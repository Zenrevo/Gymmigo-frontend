import { useState, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { Users, UserPlus, Shield, Phone, Mail, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api, { getApiErrorMessage } from '../../../utils/api';
import { useNotification } from '../../../context/NotificationContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

const TeamTab = () => {
  const { gym, gymId } = useGym();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const isOwner =
    user?.active_role === 'gym_owner' ||
    user?.roles?.some((r: string | { role: string }) =>
      (typeof r === 'string' ? r : r.role) === 'gym_owner'
    );
  
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const [newManager, setNewManager] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/gym-owner/gyms/${gymId}/managers`);
      setManagers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch managers', err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gymId) fetchManagers();
  }, [gymId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...newManager,
        phone: `+91${newManager.phone.replace(/^\+91/, '')}`
      };
      await api.post(`/gym-owner/gyms/${gymId}/managers`, payload);
      showNotification('Co-owner invited successfully', 'success');
      setShowInviteModal(false);
      setNewManager({ name: '', phone: '', email: '' });
      fetchManagers();
    } catch (err: any) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this co-owner? They will lose access to this gym dashboard immediately.')) return;
    
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/managers/${userId}`);
      showNotification('Co-owner removed', 'success');
      fetchManagers();
    } catch (err) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-display font-extrabold tracking-tight flex items-center gap-3">
           <Users className="text-accent-text" size={32} /> TEAM & CO-OWNERS
         </h2>
         {isOwner && (
           <button 
             onClick={() => setShowInviteModal(true)}
             className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2.5 px-6 text-xs flex items-center gap-2"
           >
             <UserPlus size={16} /> ADD CO-OWNER
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-surface border border-border rounded-gm-xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-raised">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Authorized Managers</h3>
              <p className="text-[10px] text-ink-subtle uppercase font-mono mt-1">Management team for {gym?.gym?.name}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-accent-soft border border-accent-border rounded-full">
               <Shield size={12} className="text-accent-text" />
               <span className="text-[10px] font-bold text-accent-text uppercase tracking-tight">Secure Access</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Name & Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Contact Information</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Added On</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* The Primary Owner is always shown (even if not in manager list) */}
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent-text border border-accent-border">
                        {gym?.gym?.owner_name?.[0] || 'O'}
                      </div>
                      <div>
                        <div className="font-bold text-ink flex items-center gap-2">
                          Primary Owner
                          <span className="px-1.5 py-0.5 bg-accent text-on-accent text-[8px] font-bold uppercase rounded">Creator</span>
                        </div>
                        <div className="text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">Full System Access</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <Phone size={12} className="text-accent-text" /> {gym?.gym?.contact_phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <Mail size={12} className="text-accent-text" /> {gym?.gym?.contact_email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-success-soft text-success text-[10px] font-bold uppercase rounded-md border border-success/30 flex items-center gap-1.5 w-fit">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[10px] font-mono text-ink-muted uppercase">
                    Original
                  </td>
                  <td className="px-6 py-5 text-right"></td>
                </tr>

                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 className="animate-spin text-accent-text mx-auto mb-2" size={32} />
                      <p className="text-xs text-ink-muted uppercase tracking-widest font-bold">Synchronizing team data...</p>
                    </td>
                  </tr>
                ) : managers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Users className="text-ink-subtle mx-auto mb-3" size={48} />
                      <p className="text-sm font-bold text-ink-muted">No Co-owners Found</p>
                      <p className="text-xs text-ink-subtle uppercase mt-1">Add trusted partners to help manage your gym operations.</p>
                    </td>
                  </tr>
                ) : (
                  managers.map((m) => (
                    <tr key={m.user_id} className="hover:bg-surface-raised transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-info-soft flex items-center justify-center text-info border border-info/30">
                            {m.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-ink">{m.name}</div>
                            <div className="text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">Co-owner / Manager</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <Phone size={12} /> {m.phone}
                          </div>
                          {m.email && (
                            <div className="flex items-center gap-2 text-xs text-ink-muted">
                              <Mail size={12} /> {m.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase rounded-md border flex items-center gap-1.5 w-fit",
                          m.is_active 
                            ? "bg-success-soft text-success border-success/30" 
                            : "bg-danger-soft text-danger border-danger/30"
                        )}>
                          {m.is_active ? <><CheckCircle2 size={10} /> Active</> : <><AlertCircle size={10} /> Inactive</>}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-mono text-ink-muted uppercase">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {isOwner && (
                          <button 
                            onClick={() => handleDelete(m.user_id)}
                            className="p-2 text-ink-subtle hover:text-danger hover:bg-danger-soft rounded-lg transition-all"
                            title="Remove Co-owner"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ACCESS POLICY NOTICE */}
        <section className="bg-accent-soft border border-accent-border rounded-gm-lg p-6 flex gap-4">
           <AlertCircle className="text-accent-text shrink-0" size={24} />
           <div className="space-y-2">
              <h4 className="text-sm font-bold text-ink uppercase tracking-widest">Team Access Policy</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Co-owners and Managers can view dashboard metrics, manage members, update plans, and handle check-ins. 
                However, sensitive operations such as <span className="text-accent-text font-bold">deleting the gym</span> or 
                <span className="text-accent-text font-bold">changing bank details</span> are restricted to the Primary Owner only.
              </p>
           </div>
        </section>
      </div>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-overlay backdrop-blur-sm" 
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-gm-xl shadow-2xl p-8 overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-1 from-accent/50 to-accent/50" />
               
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-display font-extrabold tracking-tight text-ink">Add Team Member</h3>
                 <button onClick={() => setShowInviteModal(false)} className="text-ink-muted hover:text-ink transition-colors">
                   <AlertCircle className="rotate-45" size={24} />
                 </button>
               </div>

               <form onSubmit={handleInvite} className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-2">Member Name</label>
                   <input 
                     required 
                     type="text" 
                     placeholder="John Doe"
                     value={newManager.name}
                     onChange={e => setNewManager({...newManager, name: e.target.value})}
                     className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-ink focus:border-accent outline-none transition-all" 
                   />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-2">Phone Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-ink-muted font-bold text-xs border-r border-border pr-2">+91</span>
                      <input 
                        required
                        type="tel" 
                        value={newManager.phone} 
                        onChange={e => setNewManager({...newManager, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                        maxLength={10}
                        className="w-full bg-surface-sunken border border-border rounded-xl p-3 pl-12 text-ink focus:border-accent outline-none transition-all" 
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-2">Email (Optional)</label>
                   <input 
                     type="email" 
                     placeholder="john@example.com"
                     value={newManager.email}
                     onChange={e => setNewManager({...newManager, email: e.target.value})}
                     className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-ink focus:border-accent outline-none transition-all" 
                   />
                 </div>

                 <div className="pt-4">
                   <button 
                     type="submit" 
                     disabled={isSubmitting || !newManager.name || newManager.phone.length < 10}
                     className="w-full inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-4 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> GRANT ACCESS</>}
                   </button>
                   <p className="text-[10px] text-center text-ink-subtle mt-4 uppercase tracking-widest font-bold">New users will be asked to sign up</p>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamTab;
