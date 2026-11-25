import { useState, useEffect, useCallback } from 'react';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../utils/api';
import { motion } from 'framer-motion';
import { Sheet, confirmDialog } from '../../../components/kit';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Download, 
  Mail, FileText, Loader2, ArrowUpRight, ArrowDownRight,
  Search, XCircle, Pencil, Trash2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { inr, type Product } from '../../../api/ownerSuite';
import { InvoiceSheet } from './suite/BillingTab';
import { NewInvoiceSheet } from './suite/NewInvoiceSheet';
import { ProductSheet } from './suite/ProductSheet';

interface Invoice {
  id: string;
  invoice_number: string;
  member_id: string;
  member_name?: string;
  amount: number;
  total_amount?: number;
  balance_due?: number;
  status: string;
  items: unknown[];
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
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sheets (same builders as the app)
  const [newInvoice, setNewInvoice] = useState<null | { preset: { user_id: string; user_name: string | null; user_phone: string | null } | null }>(null);
  const [openInvoice, setOpenInvoice] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | 'new' | null>(null);

  // Product State
  const [products, setProducts] = useState<Product[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  // Handle incoming memberId from state (e.g. "Create invoice" on a member)
  useEffect(() => {
    if (location.state?.memberId) {
      const { memberId, memberName, memberPhone } = location.state;
      setNewInvoice({ preset: { user_id: memberId, user_name: memberName ?? null, user_phone: memberPhone ?? null } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [expenseForm, setExpenseForm] = useState({ category: 'rent', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const openExpense = (exp?: Expense) => {
    setEditingExpense(exp?.id ?? null);
    setExpenseForm(exp ? { category: exp.category, amount: String(exp.amount), description: exp.description ?? '', expense_date: exp.expense_date.slice(0, 10) } : { category: 'rent', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
    setShowExpenseModal(true);
  };
  const deleteExpense = async (exp: Expense) => {
    if (!(await confirmDialog({ title: 'Delete this expense?', message: `${exp.category} · ₹${exp.amount.toLocaleString()}`, tone: 'danger', confirmLabel: 'Delete' }))) return;
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/expenses/${exp.id}`);
      showNotification('Expense deleted', 'success');
      fetchData();
    } catch {
      showNotification('Failed to delete expense', 'error');
    }
  };

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
  }, [gymId, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('log_expense');
    try {
      const body = { ...expenseForm, amount: Number(expenseForm.amount) || 0 };
      if (editingExpense) await api.patch(`/gym-owner/gyms/${gymId}/expenses/${editingExpense}`, body);
      else await api.post(`/gym-owner/gyms/${gymId}/expenses`, body);
      showNotification(editingExpense ? 'Expense updated' : 'Expense logged successfully', 'success');
      setShowExpenseModal(false);
      fetchData();
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      showNotification('Failed to download invoice', 'error');
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
        <Loader2 className="w-8 h-8 text-accent-text animate-spin" />
        <p className="text-ink-muted uppercase tracking-widest text-xs font-bold">Calculating balance sheets...</p>
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
          className="bg-surface border border-border rounded-xl px-4 py-2 text-sm focus:border-accent outline-none transition-all text-ink-muted font-bold uppercase tracking-widest cursor-pointer"
        />
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-green-500/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-soft rounded-xl text-success">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-bold text-success uppercase tracking-widest">Revenue</span>
          </div>
          <p className="text-3xl font-display font-extrabold ">₹{summary.revenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-success text-xs">
            <ArrowUpRight size={14} />
            <span>Incoming funds</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-red-500/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-danger-soft rounded-xl text-danger">
              <TrendingDown size={24} />
            </div>
            <span className="text-[10px] font-bold text-danger uppercase tracking-widest">Expenses</span>
          </div>
          <p className="text-3xl font-display font-extrabold ">₹{summary.expenses.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-danger text-xs">
            <ArrowDownRight size={14} />
            <span>Operating costs</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-primary/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent-soft rounded-xl text-accent-text">
              <DollarSign size={24} />
            </div>
            <span className="text-[10px] font-bold text-accent-text uppercase tracking-widest">Net Profit</span>
          </div>
          <p className="text-3xl font-display font-extrabold ">₹{summary.profit.toLocaleString()}</p>
          <p className="text-ink-muted text-xs mt-2 uppercase tracking-tight">After all deductions</p>
        </motion.div>
      </div>

      {/* Management Section */}
      <div className="bg-surface border border-border rounded-gm-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl self-start">
            <button 
              onClick={() => setActiveSubTab('invoices')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'invoices' ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink"
              )}
            >
              Invoices
            </button>
            <button 
              onClick={() => setActiveSubTab('expenses')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'expenses' ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink"
              )}
            >
              Expenses
            </button>
            <button 
              onClick={() => setActiveSubTab('products')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'products' ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink"
              )}
            >
              Products
            </button>
          </div>

          <div className="flex gap-2">
            {activeSubTab === 'invoices' ? (
              <button 
                onClick={() => setNewInvoice({ preset: null })}
                className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 px-4 py-2 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Generate Invoice
              </button>
            ) : activeSubTab === 'expenses' ? (
              <button 
                onClick={() => openExpense()}
                className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 px-4 py-2 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Log Expense
              </button>
            ) : (
              <button 
                onClick={() => setEditProduct('new')}
                className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 px-4 py-2 flex items-center gap-2 text-xs"
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
              <div className="p-4 border-b border-border flex gap-4 items-center">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by invoice#, name, or date..."
                    value={invoiceSearchQuery}
                    onChange={(e) => {
                      setInvoiceSearchQuery(e.target.value);
                      setInvoicePage(1);
                    }}
                    className="w-full bg-surface border border-border rounded-lg py-2 pl-9 pr-4 text-xs focus:border-accent-border outline-none"
                  />
                </div>
              </div>
              <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-ink-muted">
                  <th className="px-6 py-4 font-bold">Invoice #</th>
                  <th className="px-6 py-4 font-bold">Member</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((inv) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-surface-raised transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-ink-subtle" />
                          <button type="button" onClick={() => setOpenInvoice(inv.id)} className="font-mono font-bold text-sm hover:underline">{inv.invoice_number}</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold truncate max-w-[150px]">
                        {inv.member_name || "Valued Member"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        {inr(inv.total_amount ?? inv.amount)}
                        {inv.balance_due && inv.status !== 'paid' && inv.status !== 'canceled' ? <span className="block text-[11px] font-semibold text-danger">{inr(inv.balance_due)} due</span> : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          inv.status === 'paid' ? "bg-success-soft text-success" : 
                          inv.status === 'canceled' || inv.status === 'overdue' ? "bg-danger-soft text-danger" : 
                          "bg-warning-soft text-warning"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted uppercase">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {['pending', 'partial', 'overdue'].includes(inv.status) && (
                            <>
                              <button 
                                onClick={() => setOpenInvoice(inv.id)}
                                className="px-3 py-1.5 rounded-lg bg-success-soft text-success text-xs font-bold hover:opacity-80 transition-opacity"
                                title="Take a full or part payment"
                              >
                                Take payment
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(inv.id, 'canceled')}
                                disabled={!!actionLoading}
                                className="p-2 hover:bg-danger-soft rounded-lg text-ink-muted hover:text-danger transition-colors"
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
                            className="p-2 hover:bg-surface-raised rounded-lg text-ink-muted hover:text-ink transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => sendInvoiceEmail(inv.id)}
                            disabled={!!actionLoading}
                            className="p-2 hover:bg-surface-raised rounded-lg text-ink-muted hover:text-ink transition-colors"
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
              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-ink-muted">
                  Showing {((invoicePage - 1) * itemsPerPage) + 1} to {Math.min(invoicePage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                    disabled={invoicePage === 1}
                    className="px-3 py-1 bg-surface-raised border border-border rounded disabled:opacity-50 text-xs hover:bg-surface-sunken transition-colors font-bold uppercase tracking-widest"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setInvoicePage(p => Math.min(totalPages, p + 1))}
                    disabled={invoicePage === totalPages}
                    className="px-3 py-1 bg-surface-raised border border-border rounded disabled:opacity-50 text-xs hover:bg-surface-sunken transition-colors font-bold uppercase tracking-widest"
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
                  onClick={() => setEditProduct(p)}
                  className="p-5 bg-surface-raised border border-border rounded-gm-lg hover:border-accent-border transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 bg-accent-soft text-accent-text text-[10px] font-bold uppercase tracking-widest rounded">
                      {p.category}
                    </span>
                    <p className="text-xl font-bold text-ink">₹{p.price.toLocaleString()}</p>
                  </div>
                  <h4 className="text-sm font-bold text-ink group-hover:text-accent-text transition-colors">{p.name}</h4>
                  <p className="text-xs text-ink-muted mt-1">
                    {p.gst_rate != null ? `GST ${p.gst_rate}%` : 'Gym GST rate'}{p.hsn ? ` · HSN ${p.hsn}` : ''}
                    {p.track_stock ? <span className={clsx('ml-1 font-semibold', p.low_stock ? 'text-danger' : 'text-ink-muted')}>· {p.stock_qty} in stock</span> : null}
                  </p>
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
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-ink-muted">
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Description</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="group hover:bg-surface-raised transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-surface-raised rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">
                        {exp.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-danger">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted uppercase">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openExpense(exp)} className="p-2 hover:bg-surface-raised rounded-lg text-ink-muted hover:text-ink transition-colors" title="Edit expense"><Pencil size={16} /></button>
                          <button onClick={() => deleteExpense(exp)} className="p-2 hover:bg-danger-soft rounded-lg text-ink-muted hover:text-danger transition-colors" title="Delete expense"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
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

      {/* Expense Modal */}
      <Sheet size="md" 
        open={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)}
        title={editingExpense ? "Edit expense" : "Log Gym Expense"}
      >
        <form onSubmit={handleLogExpense} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Category</label>
              <select 
                className="w-full bg-surface-raised border border-border rounded-xl py-3 px-4 focus:border-accent-border outline-none transition-all text-sm appearance-none"
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Amount (₹)</label>
              <input 
                type="number"
                className="w-full bg-surface-raised border border-border rounded-xl py-3 px-4 focus:border-accent-border outline-none transition-all text-sm"
                placeholder="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Expense Date</label>
            <input 
              type="date"
              className="w-full bg-surface-raised border border-border rounded-xl py-3 px-4 focus:border-accent-border outline-none transition-all text-sm [color-scheme:dark]"
              value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Description</label>
            <textarea 
              className="w-full bg-surface-raised border border-border rounded-xl py-3 px-4 focus:border-accent-border outline-none transition-all text-sm min-h-[80px]"
              placeholder="What was this for?"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={!!actionLoading}
            className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 w-full py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="animate-spin" /> : <TrendingDown size={20} />}
            {editingExpense ? 'Save changes' : 'Confirm Expense Entry'}
          </button>
        </form>
      </Sheet>

      {newInvoice && gymId ? (
        <NewInvoiceSheet gymId={gymId} preset={newInvoice.preset} onClose={() => setNewInvoice(null)}
          onCreated={inv => { setNewInvoice(null); fetchData(); if (inv.balance_due) setOpenInvoice(inv.id); }} />
      ) : null}
      {openInvoice && gymId ? <InvoiceSheet gymId={gymId} invoiceId={openInvoice} onClose={() => setOpenInvoice(null)} onChanged={fetchData} /> : null}
      {editProduct && gymId ? <ProductSheet gymId={gymId} product={editProduct} onClose={() => setEditProduct(null)} onSaved={fetchProducts} /> : null}
    </div>
  );
};

export default FinanceTab;
