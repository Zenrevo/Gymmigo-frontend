import { useState, useEffect, useCallback } from 'react';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../utils/api';
import { motion } from 'framer-motion';
import Modal from '../../../components/Modal';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Download, 
  Mail, FileText, Loader2, ArrowUpRight, ArrowDownRight, User,
  Search, X, CheckCircle2, XCircle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface Invoice {
  id: string;
  invoice_number: string;
  member_id: string;
  member_name?: string;
  amount: number;
  status: string;
  items: any[];
  notes: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
}

interface Summary {
  revenue: number;
  expenses: number;
  profit: number;
}

interface MemberSearchResult {
  user_id: string;
  user_name: string;
  user_phone: string;
  avatar_url?: string;
  membership_id: string;
}

const FinanceTab = () => {
  const { gymId } = useGym();
  const { showNotification } = useNotification();
  const location = useLocation();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'expenses' | 'products'>('invoices');
  const [summary, setSummary] = useState<Summary>({ revenue: 0, expenses: 0, profit: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Pagination & Search States
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    member_id: '',
    items: [{ id: `item-${Date.now()}-${Math.random()}`, description: '', quantity: 1, rate: 0, amount: 0 }],
    notes: ''
  });

  // Member Search State
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<MemberSearchResult[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);

  // Product State
  const [products, setProducts] = useState<any[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, category: 'service' });

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/gym-owner/gyms/${gymId}/products`);
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    if (gymId) fetchProducts();
  }, [gymId]);

  const searchMembers = async (query: string) => {
    if (!query || query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const response = await api.get(`/gym-owner/gyms/${gymId}/members`, {
        params: { search: query, page_size: 5 }
      });
      setMemberSearchResults(response.data.data.members || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (memberSearchQuery) searchMembers(memberSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  // Handle incoming memberId from state
  useEffect(() => {
    if (location.state?.memberId) {
      const { memberId, memberName, memberPhone } = location.state;
      setInvoiceForm(prev => ({ 
        ...prev, 
        member_id: memberId,
        items: [{ id: `item-${Date.now()}-${Math.random()}`, description: '', quantity: 1, rate: 0, amount: 0 }] 
      }));
      if (memberName && memberPhone) {
        setSelectedMember({
          user_id: memberId,
          user_name: memberName,
          user_phone: memberPhone,
          membership_id: '' // Not needed for the selection UI
        });
      }
      setShowInvoiceModal(true);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const [expenseForm, setExpenseForm] = useState({
    category: 'rent',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      const [summRes, invRes, expRes] = await Promise.all([
        api.get(`/gym-owner/gyms/${gymId}/finance/summary`, { params: { month: selectedMonth } }),
        api.get(`/gym-owner/gyms/${gymId}/invoices`),
        api.get(`/gym-owner/gyms/${gymId}/expenses`)
      ]);
      setSummary(summRes.data.data);
      setInvoices(invRes.data.data || []);
      setExpenses(expRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.member_id) return showNotification('Please select a member', 'error');
    
    setActionLoading('create_invoice');
    try {
      const total = invoiceForm.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
      const itemsClean = invoiceForm.items.map(({ id, ...rest }) => rest);
      await api.post(`/gym-owner/gyms/${gymId}/invoices`, {
        ...invoiceForm,
        amount: total,
        items: itemsClean
      });
      showNotification('Invoice created successfully', 'success');
      setShowInvoiceModal(false);
      fetchData();
    } catch (err) {
      showNotification('Failed to create invoice', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('log_expense');
    try {
      await api.post(`/gym-owner/gyms/${gymId}/expenses`, expenseForm);
      showNotification('Expense logged successfully', 'success');
      setShowExpenseModal(false);
      fetchData();
    } catch (err) {
      showNotification('Failed to log expense', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const sendInvoiceEmail = async (invoiceId: string) => {
    setActionLoading(`email_${invoiceId}`);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/invoices/${invoiceId}/send-email`);
      showNotification('Invoice sent to member email', 'success');
    } catch (err) {
      showNotification('Failed to send email', 'error');
    } finally {
      setActionLoading(null);
    }
  };
 
  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    setActionLoading(`status_${invoiceId}_${status}`);
    try {
      await api.patch(`/gym-owner/gyms/${gymId}/invoices/${invoiceId}/status`, null, {
        params: { status }
      });
      showNotification(`Invoice marked as ${status}`, 'success');
      fetchData();
    } catch (err) {
      showNotification('Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };
 
  const downloadInvoice = async (invoiceId: string, invoiceNum: string) => {
    try {
      const response = await api.get(
        `/gym-owner/gyms/${gymId}/invoices/${invoiceId}/pdf`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showNotification('Failed to download invoice', 'error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) return showNotification('Please enter valid product details', 'error');
    
    setActionLoading('create_product');
    try {
      await api.post(`/gym-owner/gyms/${gymId}/products`, newProduct);
      showNotification('Product created successfully', 'success');
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: 0, category: 'service' });
      fetchProducts();
    } catch (err) {
      showNotification('Failed to create product', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Derived state for invoice search & pagination
  const filteredInvoices = invoices.filter(inv => {
    if (!invoiceSearchQuery) return true;
    const searchLower = invoiceSearchQuery.toLowerCase();
    const matchesName = inv.member_name?.toLowerCase().includes(searchLower);
    const matchesInvoiceId = inv.invoice_number?.toLowerCase().includes(searchLower);
    const dateFormatted = new Date(inv.created_at).toLocaleDateString().toLowerCase();
    const matchesDate = dateFormatted.includes(searchLower);
    
    return matchesName || matchesInvoiceId || matchesDate;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((invoicePage - 1) * itemsPerPage, invoicePage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-white/40 uppercase tracking-widest text-xs font-bold">Calculating balance sheets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Month Filter */}
      <div className="flex justify-end">
        <input 
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-primary outline-none transition-all text-white/80 font-bold uppercase tracking-widest cursor-pointer"
        />
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border-b-2 border-b-green-500/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Revenue</span>
          </div>
          <p className="text-3xl font-display font-black italic">₹{summary.revenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-green-500/60 text-xs">
            <ArrowUpRight size={14} />
            <span>Incoming funds</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 border-b-2 border-b-red-500/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <TrendingDown size={24} />
            </div>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Expenses</span>
          </div>
          <p className="text-3xl font-display font-black italic">₹{summary.expenses.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-red-500/60 text-xs">
            <ArrowDownRight size={14} />
            <span>Operating costs</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 border-b-2 border-b-primary/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <DollarSign size={24} />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Net Profit</span>
          </div>
          <p className="text-3xl font-display font-black italic">₹{summary.profit.toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-2 uppercase tracking-tighter">After all deductions</p>
        </motion.div>
      </div>

      {/* Management Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl self-start">
            <button 
              onClick={() => setActiveSubTab('invoices')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'invoices' ? "bg-primary text-black" : "text-white/60 hover:text-white"
              )}
            >
              Invoices
            </button>
            <button 
              onClick={() => setActiveSubTab('expenses')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'expenses' ? "bg-primary text-black" : "text-white/60 hover:text-white"
              )}
            >
              Expenses
            </button>
            <button 
              onClick={() => setActiveSubTab('products')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'products' ? "bg-primary text-black" : "text-white/60 hover:text-white"
              )}
            >
              Products
            </button>
          </div>

          <div className="flex gap-2">
            {activeSubTab === 'invoices' ? (
              <button 
                onClick={() => setShowInvoiceModal(true)}
                className="btn-primary px-4 py-2 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Generate Invoice
              </button>
            ) : activeSubTab === 'expenses' ? (
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="btn-primary px-4 py-2 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Log Expense
              </button>
            ) : (
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="btn-primary px-4 py-2 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Create Product
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'invoices' ? (
            <div className="flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-white/5 flex gap-4 items-center">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by invoice#, name, or date..."
                    value={invoiceSearchQuery}
                    onChange={(e) => {
                      setInvoiceSearchQuery(e.target.value);
                      setInvoicePage(1);
                    }}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-primary/50 outline-none"
                  />
                </div>
              </div>
              <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <th className="px-6 py-4 font-bold">Invoice #</th>
                  <th className="px-6 py-4 font-bold">Member</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((inv) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-white/20" />
                          <span className="font-mono font-bold text-sm">{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold truncate max-w-[150px]">
                        {inv.member_name || "Valued Member"}
                      </td>
                      <td className="px-6 py-4 text-sm font-black">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          inv.status === 'paid' ? "bg-green-500/10 text-green-500" : 
                          inv.status === 'canceled' ? "bg-red-500/10 text-red-500" : 
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40 uppercase">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(inv.id, 'paid')}
                                disabled={!!actionLoading}
                                className="p-2 hover:bg-emerald-500/10 rounded-lg text-white/40 hover:text-emerald-500 transition-colors"
                                title="Mark as Paid"
                              >
                                {actionLoading === `status_${inv.id}_paid` ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(inv.id, 'canceled')}
                                disabled={!!actionLoading}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                                title="Cancel Invoice"
                              >
                                {actionLoading === `status_${inv.id}_canceled` ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <XCircle size={16} />
                                )}
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => downloadInvoice(inv.id, inv.invoice_number)}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => sendInvoiceEmail(inv.id)}
                            disabled={!!actionLoading}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                            title="Send via Email"
                          >
                            {actionLoading === `email_${inv.id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Mail size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText size={48} />
                        <p className="text-sm uppercase tracking-widest font-bold">No invoices generated yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  Showing {((invoicePage - 1) * itemsPerPage) + 1} to {Math.min(invoicePage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                    disabled={invoicePage === 1}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded disabled:opacity-50 text-xs hover:bg-white/10 transition-colors font-bold uppercase tracking-widest"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setInvoicePage(p => Math.min(totalPages, p + 1))}
                    disabled={invoicePage === totalPages}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded disabled:opacity-50 text-xs hover:bg-white/10 transition-colors font-bold uppercase tracking-widest"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          ) : activeSubTab === 'products' ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded">
                      {p.category}
                    </span>
                    <p className="text-xl font-black text-white">₹{p.price.toLocaleString()}</p>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{p.name}</h4>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{p.description || "No description provided."}</p>
                </motion.div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                  <Plus size={48} className="mx-auto mb-4" />
                  <p className="text-sm uppercase tracking-widest font-bold">No products created yet</p>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Description</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {exp.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-red-400">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40 uppercase">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <TrendingDown size={48} />
                        <p className="text-sm uppercase tracking-widest font-bold">No expenses logged yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal 
        isOpen={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)}
        title="Generate New Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Member</label>
            
            {!selectedMember ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  placeholder="Search by name or contact..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-primary/50 outline-none transition-all text-sm"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                />
                {isSearchingMembers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="text-primary animate-spin" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {memberSearchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {memberSearchResults.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setInvoiceForm({...invoiceForm, member_id: m.user_id});
                          setMemberSearchResults([]);
                          setMemberSearchQuery('');
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{m.user_name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-tighter">{m.user_phone}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-white/10" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedMember.user_name}</p>
                    <p className="text-[10px] text-primary/60 uppercase font-black tracking-widest">{selectedMember.user_phone}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setInvoiceForm({...invoiceForm, member_id: ''});
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>


          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Invoice Items</label>
              <button 
                type="button"
                onClick={() => setInvoiceForm({...invoiceForm, items: [...invoiceForm.items, { id: `item-${Date.now()}-${Math.random()}`, description: '', quantity: 1, rate: 0, amount: 0 }]})}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {invoiceForm.items.map((item, idx) => (
                <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3 relative group">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-7">
                      <div className="relative">
                        <input 
                          placeholder="Description (e.g. Monthly Fee)"
                          className="w-full bg-[#121212] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-primary/50 outline-none"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].description = e.target.value;
                            setInvoiceForm({...invoiceForm, items: newItems});
                          }}
                        />
                        {/* Product Suggestions */}
                        {products.length > 0 && !item.description.includes('(') && (
                          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-[#181818] border border-white/10 rounded-lg overflow-hidden shadow-xl hidden group-focus-within:block">
                            {products.filter(p => !item.description || p.name.toLowerCase().includes(item.description.toLowerCase())).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const newItems = [...invoiceForm.items];
                                  newItems[idx].description = p.name;
                                  newItems[idx].rate = p.price;
                                  newItems[idx].amount = newItems[idx].quantity * p.price;
                                  setInvoiceForm({...invoiceForm, items: newItems});
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-primary/10 transition-colors flex justify-between items-center"
                              >
                                <span>{p.name}</span>
                                <span className="text-primary font-bold">₹{p.price}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <input 
                        type="number"
                        placeholder="Qty"
                        className="w-full bg-[#121212] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-primary/50 outline-none"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 0);
                          newItems[idx].amount = newItems[idx].quantity * newItems[idx].rate;
                          setInvoiceForm({...invoiceForm, items: newItems});
                        }}
                      />
                    </div>
                    <div className="col-span-8 md:col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">₹</span>
                        <input 
                          type="number"
                          placeholder="Rate"
                          className="w-full bg-[#121212] border border-white/10 rounded-lg py-2.5 pl-7 pr-3 text-sm focus:border-primary/50 outline-none"
                          value={item.rate}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].rate = parseInt(e.target.value) || 0;
                            newItems[idx].amount = newItems[idx].quantity * newItems[idx].rate;
                            setInvoiceForm({...invoiceForm, items: newItems});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {invoiceForm.items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                        setInvoiceForm({...invoiceForm, items: newItems});
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500/20 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                  
                  <div className="flex justify-end pr-1">
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                      Sub-total: <span className="text-white">₹{(item.quantity * item.rate).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Grand Total</p>
                <p className="text-2xl font-black text-white">₹{invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-tighter">{invoiceForm.items.length} items included</p>
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-tighter italic">Professional Invoice PDF will be generated</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Notes</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm min-h-[100px]"
              placeholder="Any additional info..."
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={!!actionLoading}
            className="btn-primary w-full py-4 font-black italic uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
            Generate Official Invoice
          </button>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)}
        title="Log Gym Expense"
      >
        <form onSubmit={handleLogExpense} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Category</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm appearance-none"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
              >
                <option value="rent">Rent</option>
                <option value="electricity">Electricity</option>
                <option value="salary">Staff Salary</option>
                <option value="maintenance">Maintenance</option>
                <option value="marketing">Marketing</option>
                <option value="equipment">New Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Amount (₹)</label>
              <input 
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm"
                placeholder="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Expense Date</label>
            <input 
              type="date"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm [color-scheme:dark]"
              value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Description</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm min-h-[80px]"
              placeholder="What was this for?"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={!!actionLoading}
            className="btn-primary w-full py-4 font-black italic uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="animate-spin" /> : <TrendingDown size={20} />}
            Confirm Expense Entry
          </button>
        </form>
      </Modal>

      {/* Create Product Modal */}
      <Modal
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        title="Create New Product/Service"
      >
        <form onSubmit={handleCreateProduct} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Product Name</label>
              <input 
                type="text"
                placeholder="e.g. Personal Training (10 Sessions)"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Price (₹)</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Category</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all text-sm appearance-none"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="service">Service</option>
                  <option value="membership">Membership</option>
                  <option value="supplement">Supplement</option>
                  <option value="merch">Merchandise</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!!actionLoading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            {actionLoading === 'create_product' ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Create & Save Product</>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FinanceTab;
