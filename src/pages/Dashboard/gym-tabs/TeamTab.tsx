import { useState, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { Users, UserPlus, Shield, Phone, Mail, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import { useNotification } from '../../../context/NotificationContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

const TeamTab = () => {
  const { gym, gymId } = useGym();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const isOwner = user?.active_role === 'gym_owner';
  
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
      const msg = err.response?.data?.detail?.message || 'Failed to invite co-owner';
      showNotification(msg, 'error');
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
      showNotification('Failed to remove co-owner', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-display font-black tracking-tight italic flex items-center gap-3">
           <Users className="text-primary" size={32} /> TEAM & CO-OWNERS
         </h2>
         {isOwner && (
           <button 
             onClick={() => setShowInviteModal(true)}
             className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2"
           >
             <UserPlus size={16} /> ADD CO-OWNER
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Authorized Managers</h3>
              <p className="text-[10px] text-white/20 uppercase font-mono mt-1">Management team for {gym?.gym?.name}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
               <Shield size={12} className="text-primary" />
               <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Secure Access</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Name & Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Contact Information</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Added On</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* The Primary Owner is always shown (even if not in manager list) */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                        {gym?.gym?.owner_name?.[0] || 'O'}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          Primary Owner
                          <span className="px-1.5 py-0.5 bg-primary text-black text-[8px] font-black uppercase rounded">Creator</span>
                        </div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Full System Access</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Phone size={12} className="text-primary/60" /> {gym?.gym?.contact_phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Mail size={12} className="text-primary/60" /> {gym?.gym?.contact_email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md border border-emerald-500/20 flex items-center gap-1.5 w-fit">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[10px] font-mono text-white/40 uppercase">
                    Original
                  </td>
                  <td className="px-6 py-5 text-right"></td>
                </tr>

                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Synchronizing team data...</p>
                    </td>
                  </tr>
                ) : managers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Users className="text-white/10 mx-auto mb-3" size={48} />
                      <p className="text-sm font-bold text-white/60">No Co-owners Found</p>
                      <p className="text-xs text-white/20 uppercase mt-1">Add trusted partners to help manage your gym operations.</p>
                    </td>
                  </tr>
                ) : (
                  managers.map((m) => (
                    <tr key={m.user_id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            {m.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white">{m.name}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Co-owner / Manager</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <Phone size={12} /> {m.phone}
                          </div>
                          {m.email && (
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <Mail size={12} /> {m.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase rounded-md border flex items-center gap-1.5 w-fit",
                          m.is_active 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {m.is_active ? <><CheckCircle2 size={10} /> Active</> : <><AlertCircle size={10} /> Inactive</>}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-mono text-white/40 uppercase">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {isOwner && (
                          <button 
                            onClick={() => handleDelete(m.user_id)}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4">
           <AlertCircle className="text-primary shrink-0" size={24} />
           <div className="space-y-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Team Access Policy</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Co-owners and Managers can view dashboard metrics, manage members, update plans, and handle check-ins. 
                However, sensitive operations such as <span className="text-primary font-bold">deleting the gym</span> or 
                <span className="text-primary font-bold">changing bank details</span> are restricted to the Primary Owner only.
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
               
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-display font-black tracking-tighter italic uppercase text-white">Add Team Member</h3>
                 <button onClick={() => setShowInviteModal(false)} className="text-white/40 hover:text-white transition-colors">
                   <AlertCircle className="rotate-45" size={24} />
                 </button>
               </div>

               <form onSubmit={handleInvite} className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Member Name</label>
                   <input 
                     required 
                     type="text" 
                     placeholder="John Doe"
                     value={newManager.name}
                     onChange={e => setNewManager({...newManager, name: e.target.value})}
                     className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-all" 
                   />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Phone Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-white/40 font-bold text-xs border-r border-white/10 pr-2">+91</span>
                      <input 
                        required
                        type="tel" 
                        value={newManager.phone} 
                        onChange={e => setNewManager({...newManager, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                        maxLength={10}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-12 text-white focus:border-primary outline-none transition-all" 
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Email (Optional)</label>
                   <input 
                     type="email" 
                     placeholder="john@example.com"
                     value={newManager.email}
                     onChange={e => setNewManager({...newManager, email: e.target.value})}
                     className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-all" 
                   />
                 </div>

                 <div className="pt-4">
                   <button 
                     type="submit" 
                     disabled={isSubmitting || !newManager.name || newManager.phone.length < 10}
                     className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> GRANT ACCESS</>}
                   </button>
                   <p className="text-[10px] text-center text-white/20 mt-4 uppercase tracking-widest font-bold">New users will be asked to sign up</p>
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
