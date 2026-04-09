import { useState, useEffect, useCallback } from 'react';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  Users, UserPlus, Search, Filter, LogIn, LogOut,
  Phone, Clock, ChevronRight, Activity, CheckCircle2,
  XCircle, AlertTriangle, Loader2, ArrowLeft,
  CreditCard, RefreshCw, Zap, ScanLine
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface MembershipItem {
  membership_id: string;
  plan_name: string | null;
  plan_id: string | null;
  start_date: string;
  end_date: string;
  status: string;
  remaining_visits: number | null;
  amount_paid: number;
  selected_addons: { id: string; name: string; price: number }[] | null;
  is_currently_checked_in: boolean;
  active_check_in_id: string | null;
  qr_code?: string;
  auto_renew?: boolean;
  created_at: string;
}

interface Member {
  user_id: string;
  user_name: string | null;
  user_phone: string;
  avatar_url: string | null;
  total_check_ins: number;
  memberships: MembershipItem[];
  is_currently_checked_in: boolean;
  active_status: string;
  created_at: string;
}

interface AttendanceEntry {
  check_in_id: string;
  membership_id: string;
  user_id: string;
  user_name: string | null;
  user_phone: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  method: string;
}

interface MemberDetail extends Member {
  check_in_history: {
    id: string;
    membership_id: string;
    check_in_time: string;
    check_out_time: string | null;
    duration_minutes: number | null;
    method: string;
  }[];
}

const MembersTab = () => {
  const { gym, gymId } = useGym();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // View mode: members list or attendance log
  const [viewMode, setViewMode] = useState<'members' | 'attendance'>('members');
  
  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [inGymCount, setInGymCount] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Attendance state
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);

  // Member detail state
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);

  // Enroll modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ phone: '', full_name: '', plan_id: '', payment_method: 'cash', amount_paid: '', start_date: '', end_date: '', selected_addons: [] as any[] });
  const [enrolling, setEnrolling] = useState(false);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; confirmLabel?: string; isDangerous?: boolean; onConfirm: () => void } | null>(null);

  // Loading state for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [quickResults, setQuickResults] = useState<Member[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMode, setQuickMode] = useState(false);

  // Edit member modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MembershipItem | null>(null);
  const [editForm, setEditForm] = useState({ 
    full_name: '', 
    plan_id: '', 
    start_date: '', 
    end_date: '', 
    status: '' 
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick check-in state
  const [quickSearch, setQuickSearch] = useState('');

  // Helpers
  const calculateEndDate = useCallback((startDateStr: string, planId: string) => {
    if (!startDateStr || !planId || !gym?.membership_plans) return '';
    const plan = gym.membership_plans.find((p: any) => p.id === planId);
    if (!plan) return '';
    
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + (plan.duration_days || 30));
    return end.toISOString().split('T')[0];
  }, [gym?.membership_plans]);

  // Auto-calculate Enroll End Date
  useEffect(() => {
    if (showEnrollModal && enrollForm.start_date && enrollForm.plan_id) {
      const newEnd = calculateEndDate(enrollForm.start_date, enrollForm.plan_id);
      if (newEnd && newEnd !== enrollForm.end_date) {
        setEnrollForm(prev => ({ ...prev, end_date: newEnd }));
      }
    }
  }, [enrollForm.start_date, enrollForm.plan_id, showEnrollModal, calculateEndDate]);

  // Auto-calculate Edit End Date
  useEffect(() => {
    if (showEditModal && editForm.start_date && editForm.plan_id) {
      const newEnd = calculateEndDate(editForm.start_date, editForm.plan_id);
      if (newEnd && newEnd !== editForm.end_date) {
        setEditForm(prev => ({ ...prev, end_date: newEnd }));
      }
    }
  }, [editForm.start_date, editForm.plan_id, showEditModal, calculateEndDate]);

  // ── Fetch Members ──────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!gymId) return;
    setLoadingMembers(true);
    try {
      const params: any = { page, page_size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}/members`, { params });
      const data = res.data.data;
      setMembers(data.members || []);
      setTotalMembers(data.total || 0);
      setActiveCount(data.active_count || 0);
      setExpiredCount(data.expired_count || 0);
      setInGymCount(data.currently_in_gym || 0);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [gymId, statusFilter, searchQuery, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Listen for Global Live Updates ─────────────────────────────────────────
  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchMembers();
      if (selectedMember) {
         fetchMemberDetail(selectedMember.user_id);
      }
    };
    
    window.addEventListener('gym_live_update_fetch', handleLiveUpdate);
    return () => {
      window.removeEventListener('gym_live_update_fetch', handleLiveUpdate);
    };
  }, [fetchMembers, selectedMember?.user_id]);

  // ── Quick Check-in Search ──────────────────────────────────────────────────
  useEffect(() => {
    if (!quickSearch || quickSearch.length < 2 || !gymId) {
      setQuickResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setQuickLoading(true);
      try {
        const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}/members`, {
          params: { search: quickSearch, status: 'active', page: 1, page_size: 5 }
        });
        setQuickResults(res.data.data.members || []);
      } catch { setQuickResults([]); }
      finally { setQuickLoading(false); }
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [quickSearch, gymId]);

  // ── Fetch Attendance ───────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!gymId) return;
    setLoadingAttendance(true);
    try {
      const params: any = { page: attendancePage, page_size: 30 };
      if (attendanceDateFilter) params.date = attendanceDateFilter;
      const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}/attendance`, { params });
      const data = res.data.data;
      setAttendance(data.entries || []);
      setAttendanceTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [gymId, attendanceDateFilter, attendancePage]);

  useEffect(() => {
    if (viewMode === 'attendance') fetchAttendance();
  }, [viewMode, fetchAttendance]);

  // ── Fetch Member Detail ────────────────────────────────────────────────────
  const fetchMemberDetail = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}/members/${userId}`);
      setSelectedMember(res.data.data);
    } catch (err) {
      console.error('Failed to fetch member detail:', err);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCheckIn = (userId: string, memberName?: string | null) => {
    setConfirmAction({
      title: 'Manual Check-in',
      message: `Are you sure you want to manually check in ${memberName || 'this member'}?`,
      confirmLabel: 'Confirm Check-in',
      isDangerous: false,
      onConfirm: async () => {
        setActionLoading(userId);
        try {
          await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/users/${userId}/check-in`);
          showNotification('Member checked in successfully', 'success');
          fetchMembers();
          if (selectedMember) fetchMemberDetail(selectedMember.user_id);
        } catch (err: any) {
          // Global interceptor handles this
        } finally {
          setActionLoading(null);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleCheckOut = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/users/${userId}/check-out`);
      showNotification('Member checked out successfully', 'success');
      fetchMembers();
      if (selectedMember) fetchMemberDetail(selectedMember.user_id);
    } catch (err: any) {
      // Global interceptor handles this
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = (membershipId: string, memberName: string) => {
    setConfirmAction({
      title: 'Cancel Membership',
      message: `Are you sure you want to cancel ${memberName || 'this member'}'s membership? This action cannot be undone.`,
      confirmLabel: 'Yes, Cancel',
      isDangerous: true,
      onConfirm: async () => {
        setActionLoading(membershipId);
        try {
          await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/members/${membershipId}/cancel`);
          showNotification('Membership cancelled', 'success');
          fetchMembers();
          if (selectedMember) {
            // Need to check if it was their last membership, but fetching detail again is safer 
            // since detail view now supports multiple.
            fetchMemberDetail(selectedMember.user_id);
          }
        } catch (err: any) {
          // Global interceptor handles this
        } finally {
          setActionLoading(null);
          setConfirmAction(null);
        }
      },
    });
  };

  const handleAcceptRequest = async (membershipId: string) => {
    setActionLoading(membershipId);
    try {
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/members/${membershipId}/accept`);
      showNotification('Request accepted successfully', 'success');
      fetchMembers();
    } catch (err: any) {
      showNotification('Failed to accept request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (membershipId: string) => {
    setActionLoading(membershipId);
    try {
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/members/${membershipId}/reject`);
      showNotification('Request rejected', 'success');
      fetchMembers();
    } catch (err: any) {
      showNotification('Failed to reject request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Enroll ─────────────────────────────────────────────────────────────────
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      const payload: any = {
        phone: `+91${enrollForm.phone}`,
        full_name: enrollForm.full_name,
        plan_id: enrollForm.plan_id,
        payment_method: enrollForm.payment_method,
        amount_paid: enrollForm.amount_paid ? parseInt(enrollForm.amount_paid) : undefined,
        selected_addons: enrollForm.selected_addons.map(a => ({ id: a.id, name: a.name, price: a.price }))
      };
      if (enrollForm.start_date) {
        payload.start_date = enrollForm.start_date;
      }
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/members/enroll`, payload);
      showNotification('Member enrolled successfully!', 'success');
      setShowEnrollModal(false);
      setEnrollForm({ phone: '', full_name: '', plan_id: '', payment_method: 'cash', amount_paid: '', start_date: '', end_date: '', selected_addons: [] });
      fetchMembers();
    } catch (err: any) {
      // Global interceptor handles this
    } finally {
      setEnrolling(false);
    }
  };

  const openEditModal = (member: Member, membership: MembershipItem) => {
    setEditingMember(membership);
    setEditForm({
      full_name: member.user_name || '',
      plan_id: membership.plan_id || '',
      start_date: membership.start_date.split('T')[0], // format for date input
      end_date: membership.end_date.split('T')[0],
      status: membership.status
    });
    setShowEditModal(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsUpdating(true);
    try {
      const payload = {
        full_name: editForm.full_name,
        plan_id: editForm.plan_id,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        status: editForm.status
      };
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/members/${editingMember.membership_id}`, payload);
      showNotification('Member updated successfully', 'success');
      setShowEditModal(false);
      fetchMembers();
      if(selectedMember) fetchMemberDetail(selectedMember.user_id);
    } catch (err: any) {
      // Global interceptor handles this
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
      expired: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/20',
      pending: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      suspended: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    };
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });


  // ── Member Detail View ─────────────────────────────────────────────────────
  if (selectedMember) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedMember(null)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Members
        </button>

        <div className="glass-card p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary text-2xl font-black">
                {(selectedMember.user_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-display font-black tracking-tight">{selectedMember.user_name || 'Unknown'}</h2>
                <div className="flex items-center gap-3 text-white/40 text-sm mt-1">
                  <span className="flex items-center gap-1"><Phone size={13} />{selectedMember.user_phone}</span>
                  <span>•</span>
                  {selectedMember.is_currently_checked_in && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 uppercase tracking-widest animate-pulse">IN GYM</span>
                  )}
                  <span className="flex items-center gap-1"><LogIn size={13} />{selectedMember.total_check_ins} Total Check-ins</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
               {selectedMember.active_status === 'active' && !selectedMember.is_currently_checked_in && (
                 <button onClick={() => handleCheckIn(selectedMember.user_id, selectedMember.user_name)} disabled={actionLoading === selectedMember.user_id}
                   className="btn-primary py-2 px-5 text-sm flex items-center gap-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 hover:-translate-y-0.5 transition-all font-bold">
                   {actionLoading === selectedMember.user_id ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} 
                   Check In
                 </button>
               )}
               {selectedMember.is_currently_checked_in && (
                 <button onClick={() => handleCheckOut(selectedMember.user_id)} disabled={actionLoading === selectedMember.user_id}
                   className="py-2 px-5 text-sm flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 hover:-translate-y-0.5 transition-all font-bold">
                   {actionLoading === selectedMember.user_id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />} 
                   Check Out
                 </button>
               )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Active & Past Subscriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedMember.memberships.map((membership, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white-[0.02] transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    {statusBadge(membership.status)}
                  </div>
                  
                  <div className="mb-4 pr-20">
                    <h4 className="font-bold text-lg mb-1">{membership.plan_name || 'N/A'}</h4>
                    <p className="text-xs text-white/40">₹{membership.amount_paid} • {membership.remaining_visits ?? 'Unlimited'} visits left</p>
                  </div>
                  
                  <div className="space-y-2 text-xs text-white/60 mb-6 font-mono">
                    <div className="flex justify-between">
                      <span>Start: {formatDate(membership.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End: {formatDate(membership.end_date)}</span>
                    </div>
                  </div>

                  {membership.selected_addons && membership.selected_addons.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Add-ons</p>
                      <div className="flex flex-wrap gap-2">
                        {membership.selected_addons.map((addon, aIdx) => (
                          <span key={aIdx} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                            {addon.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {membership.status === 'active' && (
                      <button onClick={() => handleCancel(membership.membership_id, selectedMember.user_name || '')}
                        className="p-1.5 px-3 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-bold group-hover:scale-100" title="Cancel Subscription">
                        Cancel
                      </button>
                    )}
                    
                    {membership.status === 'pending' && (
                      <>
                        <button onClick={() => handleAcceptRequest(membership.membership_id)} disabled={actionLoading === membership.membership_id}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 flex-1 justify-center rounded-lg">
                          {actionLoading === membership.membership_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Accept
                        </button>
                        <button onClick={() => handleRejectRequest(membership.membership_id)} disabled={actionLoading === membership.membership_id}
                          className="py-1.5 px-3 text-xs flex items-center gap-1 flex-1 justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all">
                          {actionLoading === membership.membership_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => openEditModal({} as unknown as Member, membership)} className="p-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors" title="Edit Membership">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Check-in History */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold flex items-center gap-2"><Clock size={18} className="text-primary" /> Combined Check-in History</h3>
          </div>
          {selectedMember.check_in_history?.length ? (
            <div className="divide-y divide-white/5">
              {selectedMember.check_in_history.map((ci, i) => {
                 const relatedMembership = selectedMember.memberships.find(m => m.membership_id === ci.membership_id);
                 return (
                  <div key={i} className="p-4 px-6 flex items-center justify-between text-sm hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${ci.check_out_time ? 'bg-white/20' : 'bg-green-400 animate-pulse'}`} />
                      <span>{formatDate(ci.check_in_time)}</span>
                      <span className="text-white/40">{formatTime(ci.check_in_time)}</span>
                      <span className="ml-3 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50">{relatedMembership?.plan_name || 'Unknown Plan'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/40">
                      {ci.check_out_time ? (
                        <>
                          <span>→ {formatTime(ci.check_out_time)}</span>
                          <span className="text-white/60 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">{ci.duration_minutes} min</span>
                        </>
                      ) : (
                        <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Active</span>
                      )}
                      <span className="text-[10px] uppercase tracking-widest">{ci.method}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-white/20">No check-in history yet.</div>
          )}
        </div>

        {/* ── Confirm Dialog for Detail View ──────────────────────────────────────── */}
        {confirmAction && (
          <ConfirmDialog
            isOpen={!!confirmAction}
            onClose={() => setConfirmAction(null)}
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            confirmLabel={confirmAction.confirmLabel || "Confirm"}
            isDangerous={confirmAction.isDangerous}
          />
        )}
      </div>
    );
  }

  // ── Main View ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight italic">MEMBERS</h2>
          <p className="text-white/40 text-sm">Manage your gym's member base and attendance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuickMode(!quickMode)}
            className={`py-2.5 px-5 text-sm flex items-center gap-2 rounded-xl border font-bold transition-all ${
              quickMode ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
            }`}>
            <Zap size={16} /> Quick Check-in
          </button>
          <button onClick={() => setShowEnrollModal(true)} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
            <UserPlus size={16} /> Enroll Member
          </button>
        </div>
      </div>

      {/* ── Quick Check-in Widget ─────────────────────────────────────────── */}
      <AnimatePresence>
        {quickMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="glass-card p-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <ScanLine size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Quick Check-in / Check-out</h3>
                  <p className="text-white/40 text-xs">Type member name or last few digits of their phone number</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400/60" size={20} />
                <input type="text" autoFocus placeholder="Search member... (e.g. '8989' or 'Ayus')" 
                  className="w-full bg-black/30 border-2 border-green-500/30 rounded-2xl py-4 pl-12 pr-4 text-lg focus:border-green-400 outline-none transition-all placeholder:text-white/20"
                  value={quickSearch} onChange={e => setQuickSearch(e.target.value)} />
                {quickLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-green-400" size={20} />}
              </div>

              {/* Quick results */}
              {quickSearch.length >= 2 && (
                <div className="mt-3 space-y-2">
                  {quickResults.length === 0 && !quickLoading ? (
                    <div className="p-4 text-center text-white/30 text-sm">
                      No active member found for "{quickSearch}"
                    </div>
                  ) : (
                    quickResults.map((m) => (
                      <motion.div key={m.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-green-500/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                            {(m.user_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{m.user_name || 'Unknown'}</p>
                              {m.is_currently_checked_in && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 uppercase tracking-widest animate-pulse">IN GYM</span>
                              )}
                            </div>
                            <p className="text-xs text-white/30 flex items-center gap-1"><Phone size={10} /> {m.user_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.is_currently_checked_in ? (
                            <button onClick={() => { handleCheckOut(m.user_id); setQuickSearch(''); setQuickResults([]); }}
                              disabled={actionLoading === m.user_id}
                              className="py-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all">
                              {actionLoading === m.user_id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                              Check Out
                            </button>
                          ) : (
                            <button onClick={() => { handleCheckIn(m.user_id, m.user_name); setQuickSearch(''); setQuickResults([]); }}
                              disabled={actionLoading === m.user_id}
                              className="py-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
                              {actionLoading === m.user_id ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                              Check In
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-primary' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Expired', value: expiredCount, icon: XCircle, color: 'text-amber-400' },
          { label: 'In Gym Now', value: inGymCount, icon: Activity, color: 'text-green-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{s.label}</span>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-3xl font-black mt-2">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Members / Attendance toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          {(['members', 'attendance'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all capitalize ${viewMode === mode ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
              {mode === 'members' ? 'Members' : 'Attendance Log'}
            </button>
          ))}
        </div>

        {viewMode === 'members' ? (
          <>
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input type="text" placeholder="Search by name or phone..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all"
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-white/30" />
              {['', 'pending', 'active', 'expired', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all capitalize ${statusFilter === s ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-white/40 border-white/5 hover:text-white'}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Date filter for attendance */}
            <input type="date" value={attendanceDateFilter} onChange={e => { setAttendanceDateFilter(e.target.value); setAttendancePage(1); }}
              className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:border-primary outline-none transition-all" />
            <button onClick={fetchAttendance} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <RefreshCw size={16} className="text-white/40" />
            </button>
          </>
        )}
      </div>

      {/* Lists */}
      <AnimatePresence mode="wait">
        {viewMode === 'members' ? (
          <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card overflow-hidden">
            {loadingMembers ? (
              <div className="p-16 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : members.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <Users size={48} className="mx-auto text-white/10" />
                <p className="text-white/30 text-lg font-bold">No members found</p>
                <p className="text-white/20 text-sm">Enroll your first member to get started.</p>
              </div>
            ) : (
              <>
                {/* Table Header (Desktop Only) */}
                <div className="hidden md:grid grid-cols-[1fr_150px_100px_100px_minmax(120px,auto)] gap-4 p-4 px-6 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5">
                  <span>Member</span>
                  <span>Active Plans</span>
                  <span>Status</span>
                  <span>Total Visits</span>
                  <span></span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-white/5">
                  {members.map((m, i) => (
                    <motion.div key={m.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="p-4 sm:p-5 md:px-6 flex flex-col md:grid md:grid-cols-[1fr_150px_100px_100px_minmax(120px,auto)] gap-4 items-stretch md:items-center hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => fetchMemberDetail(m.user_id)}>
                      
                      {/* -- Header Row: Avatar, Name, Phone, Status (Mobile Optimized) -- */}
                      <div className="flex items-start justify-between w-full md:w-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 font-bold text-sm shrink-0">
                            {(m.user_name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold truncate text-sm sm:text-base">{m.user_name || 'Unknown'}</p>
                              {m.is_currently_checked_in && (
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" title="Currently in gym" />
                              )}
                            </div>
                            <p className="text-xs text-white/30 flex items-center gap-1"><Phone size={10} /> {m.user_phone}</p>
                          </div>
                        </div>
                        <div className="md:hidden">
                           {statusBadge(m.active_status)}
                        </div>
                      </div>

                      {/* -- Details Grid (Mobile: 2x2 Grid, Desktop: Columns) -- */}
                      <div className="grid grid-cols-2 md:contents gap-3 p-3 md:p-0 bg-white/[0.03] md:bg-transparent rounded-xl border border-white/5 md:border-0">
                        <div className="flex flex-col md:block">
                           <span className="md:hidden text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">PLANS</span>
                           <span className="text-xs md:text-sm text-white/60 truncate font-medium flex flex-col gap-1">
                             {m.memberships.length > 0 
                              ? m.memberships.slice(0,2).map((sub, sIdx) => <span key={sIdx} className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{sub.plan_name}</span>)
                              : 'None'}
                              {m.memberships.length > 2 && <span className="text-[10px] text-white/40">+{m.memberships.length - 2} more</span>}
                           </span>
                        </div>
                        <div className="hidden md:block">{statusBadge(m.active_status)}</div>
                        <div className="flex flex-col md:block">
                           <span className="md:hidden text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">VISITS</span>
                           <span className="text-xs md:text-sm font-mono text-white/80">{m.total_check_ins} Check-ins</span>
                        </div>
                        <div className="md:hidden flex flex-col justify-center">
                           <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">GYM STATUS</span>
                           <span className={`text-[10px] font-bold ${m.is_currently_checked_in ? 'text-green-400' : 'text-white/20'}`}>
                             {m.is_currently_checked_in ? 'In Gym Now' : 'Out of Gym'}
                           </span>
                        </div>
                      </div>

                      {/* -- Actions Row (Mobile: Full Width, Desktop: Inline) -- */}
                      <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t border-white/5 md:border-0 overflow-x-auto">
                        <div className="flex items-center gap-2">
                          <button onClick={e => { 
                              e.stopPropagation(); 
                              navigate('../finance', { 
                                state: { 
                                  memberId: m.user_id,
                                  memberName: m.user_name,
                                  memberPhone: m.user_phone
                                } 
                              }); 
                            }}
                            className="p-2.5 md:p-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all border border-orange-500/20 flex items-center gap-2" title="Create Invoice">
                            <CreditCard size={16} />
                            <span className="text-xs font-bold uppercase transition-all">BILL</span>
                          </button>
                        </div>
                        <ChevronRight size={18} className="text-white/20 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalMembers > 20 && (
                  <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-white/30">Page {page} of {Math.ceil(totalMembers / 20)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        className="px-3 py-1.5 bg-white/5 rounded-lg text-xs disabled:opacity-30">Prev</button>
                      <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(totalMembers / 20)}
                        className="px-3 py-1.5 bg-white/5 rounded-lg text-xs disabled:opacity-30">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          /* Attendance Log View */
          <motion.div key="attendance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card overflow-hidden">
            {loadingAttendance ? (
              <div className="p-16 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : attendance.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <Clock size={48} className="mx-auto text-white/10" />
                <p className="text-white/30 text-lg font-bold">No attendance records</p>
                <p className="text-white/20 text-sm">{attendanceDateFilter ? 'No check-ins on this date.' : 'Check-in records will appear here.'}</p>
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[1fr_120px_120px_80px_80px] gap-4 p-4 px-6 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5">
                  <span>Member</span>
                  <span>Check In</span>
                  <span>Check Out</span>
                  <span>Duration</span>
                  <span>Method</span>
                </div>
                <div className="divide-y divide-white/5">
                  {attendance.map((a, i) => (
                    <motion.div key={a.check_in_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="p-4 px-6 flex flex-col md:grid md:grid-cols-[1fr_120px_120px_80px_80px] gap-4 items-stretch md:items-center hover:bg-white/[0.02] transition-colors">
                      
                      {/* Member Info */}
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.check_out_time ? 'bg-white/20' : 'bg-green-400 animate-pulse'}`} />
                        <div className="min-w-0">
                          <p className="font-bold truncate text-sm">{a.user_name || 'Unknown'}</p>
                          <p className="text-xs text-white/30">{a.user_phone}</p>
                        </div>
                      </div>

                      {/* Grid for details on Mobile */}
                      <div className="grid grid-cols-2 md:contents gap-4 p-3 bg-white/[0.02] md:bg-transparent rounded-xl border border-white/5 md:border-0">
                        <div className="text-sm">
                           <span className="md:hidden block text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">IN</span>
                          <p className="font-medium">{formatDate(a.check_in_time)}</p>
                          <p className="text-white/40 text-xs">{formatTime(a.check_in_time)}</p>
                        </div>
                        <div className="text-sm">
                          <span className="md:hidden block text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">OUT</span>
                          {a.check_out_time ? (
                            <>
                              <p className="font-medium">{formatDate(a.check_out_time)}</p>
                              <p className="text-white/40 text-xs">{formatTime(a.check_out_time)}</p>
                            </>
                          ) : (
                            <span className="text-green-400 text-xs font-bold uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">Active</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                           <span className="md:hidden text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">DURATION</span>
                           <span className="text-sm font-mono text-white/60">{a.duration_minutes != null ? `${a.duration_minutes}m` : '—'}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="md:hidden text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">METHOD</span>
                           <span className="text-[10px] uppercase tracking-widest text-white/30">{a.method}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {attendanceTotal > 30 && (
                  <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-white/30">Page {attendancePage} of {Math.ceil(attendanceTotal / 30)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAttendancePage(Math.max(1, attendancePage - 1))} disabled={attendancePage === 1}
                        className="px-3 py-1.5 bg-white/5 rounded-lg text-xs disabled:opacity-30">Prev</button>
                      <button onClick={() => setAttendancePage(attendancePage + 1)} disabled={attendancePage >= Math.ceil(attendanceTotal / 30)}
                        className="px-3 py-1.5 bg-white/5 rounded-lg text-xs disabled:opacity-30">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Enroll Modal ──────────────────────────────────────────────────────── */}
      <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Enroll New Member" maxWidth="max-w-md">
        <form onSubmit={handleEnroll} className="space-y-5">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <Phone size={14} className="text-white/40" />
                <span className="text-white/60 font-bold text-xs border-r border-white/10 pr-1.5">+91</span>
              </div>
              <input type="tel" required placeholder="10-digit number" maxLength={10}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-[4.5rem] pr-4 text-sm focus:border-primary outline-none transition-all"
                value={enrollForm.phone} onChange={e => setEnrollForm({ ...enrollForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Full Name</label>
            <input type="text" required placeholder="Member's full name"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all"
              value={enrollForm.full_name} onChange={e => setEnrollForm({ ...enrollForm, full_name: e.target.value })} />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Membership Plan</label>
            {!gym?.membership_plans || gym.membership_plans.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> No plans found. Create one in the Plans tab first.
              </div>
            ) : (
              <select required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all appearance-none"
                value={enrollForm.plan_id} onChange={e => {
                  setEnrollForm({ ...enrollForm, plan_id: e.target.value });
                }}>
                <option value="">Select a plan...</option>
                {gym.membership_plans.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-[#111]">
                    {p.name} — ₹{p.discounted_price || p.price} / {p.duration_days} days
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all text-white/70"
                style={{ colorScheme: 'dark' }}
                value={enrollForm.start_date} onChange={e => setEnrollForm({ ...enrollForm, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">End Date (Auto)</label>
              <input type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all text-white/70"
                style={{ colorScheme: 'dark' }}
                value={enrollForm.end_date} onChange={e => setEnrollForm({ ...enrollForm, end_date: e.target.value })} />
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Payment Method</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all appearance-none"
                value={enrollForm.payment_method} onChange={e => setEnrollForm({ ...enrollForm, payment_method: e.target.value })}>
                <option value="cash" className="bg-[#111]">Cash</option>
                <option value="upi" className="bg-[#111]">UPI</option>
                <option value="card" className="bg-[#111]">Card</option>
                <option value="bank_transfer" className="bg-[#111]">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Amount (optional)</label>
              <input type="number" placeholder="Auto from plan"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all"
                value={enrollForm.amount_paid} onChange={e => setEnrollForm({ ...enrollForm, amount_paid: e.target.value })} />
            </div>
          </div>

          {/* Add-ons Selection */}
          {gym?.addons && gym.addons.length > 0 && (
            <div className="space-y-3">
               <label className="block text-xs font-bold text-white/40 uppercase tracking-wider">Available Add-ons</label>
               <div className="grid grid-cols-1 gap-2">
                  {gym.addons.map((addon: any) => (
                    <div 
                      key={addon.id} 
                      onClick={() => {
                        const isSelected = enrollForm.selected_addons.find(a => a.id === addon.id);
                        if (isSelected) {
                          setEnrollForm({ ...enrollForm, selected_addons: enrollForm.selected_addons.filter(a => a.id !== addon.id) });
                        } else {
                          setEnrollForm({ ...enrollForm, selected_addons: [...enrollForm.selected_addons, addon] });
                        }
                      }}
                      className={clsx(
                        "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                        enrollForm.selected_addons.find(a => a.id === addon.id) ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-all", enrollForm.selected_addons.find(a => a.id === addon.id) ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/20")}>
                            {enrollForm.selected_addons.find(a => a.id === addon.id) && <CheckCircle2 size={10} />}
                          </div>
                          <span className="text-xs font-bold text-white/80">{addon.name}</span>
                       </div>
                       <span className="text-xs font-black text-emerald-500">₹{addon.price}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <button type="submit" disabled={enrolling || !enrollForm.plan_id}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {enrolling ? <><Loader2 size={16} className="animate-spin" /> Enrolling...</> : <><UserPlus size={16} /> Enroll Member</>}
          </button>
        </form>
      </Modal>

      {/* ── Confirm Dialog ────────────────────────────────────────────────────── */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          confirmLabel={confirmAction.confirmLabel || "Yes, Cancel"}
          isDangerous={confirmAction.isDangerous !== undefined ? confirmAction.isDangerous : true}
        />
      )}

      {/* ── Edit Member Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Member Info">
        <form onSubmit={handleEditMember} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Full Name</label>
            <input type="text" required placeholder="Member's full name"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all"
              value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Membership Plan</label>
            <select required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all appearance-none"
              value={editForm.plan_id} onChange={e => setEditForm({ ...editForm, plan_id: e.target.value })}>
              <option value="">Select a plan...</option>
              {gym?.membership_plans?.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-[#111]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all text-white/70"
                style={{ colorScheme: 'dark' }}
                value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">End Date</label>
              <input type="date" required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all text-white/70"
                style={{ colorScheme: 'dark' }}
                value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Status</label>
            <select required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary outline-none transition-all appearance-none"
              value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active" className="bg-[#111]">Active</option>
              <option value="expired" className="bg-[#111]">Expired</option>
              <option value="cancelled" className="bg-[#111]">Cancelled</option>
              <option value="pending" className="bg-[#111]">Pending</option>
            </select>
          </div>

          <button type="submit" disabled={isUpdating}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isUpdating ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : <><CheckCircle2 size={16} /> Save Changes</>}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MembersTab;
