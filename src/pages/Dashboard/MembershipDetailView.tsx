import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { ArrowLeft, Building2, MapPin, Calendar, Loader2, PlayCircle, ShieldCheck, Activity, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getGoogleMapsUrl } from '../../utils/navigation';

interface MembershipDetailProps {
  membership: any;
  onBack: () => void;
}

const MembershipDetailView = ({ membership, onBack }: MembershipDetailProps) => {
  const { showNotification } = useNotification();
  const [gymDetail, setGymDetail] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Gym info (public discovery endpoint)
        const gymRes = axios.get(`${API_URL}/gyms/${membership.gym_id}`);
        // Fetch Attendance (history for this gym)
        const authHeader = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
        const attendanceRes = axios.get(`${API_URL}/memberships/check-ins/history?gym_id=${membership.gym_id}`, { headers: authHeader });

        const [gymData, attData] = await Promise.all([gymRes, attendanceRes]);
        setGymDetail(gymData.data.data ? gymData.data.data : gymData.data);
        setAttendance(attData.data.data);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [membership]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const activeSession = attendance?.check_ins?.find((c: any) => !c.check_out_time);

  const handleCheckout = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const authHeader = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
      await axios.post(`${API_URL}/memberships/check-out/${activeSession.id}`, {}, { headers: authHeader });

      // Re-fetch attendance after checkout
      const checkinRes = await axios.get(`${API_URL}/memberships/check-ins/history?gym_id=${membership.gym_id}`, { headers: authHeader });
      setAttendance(checkinRes.data.data);
      showNotification('Successfully checked out!', 'success');
    } catch (err) {
      console.error('Failed to checkout:', err);
      showNotification('Failed to check out. Please try scanning again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-primary">
        <Loader2 className="animate-spin" size={32} />
        <p className="mt-4 text-white/50 text-sm animate-pulse">Loading membership details...</p>
      </div>
    );
  }

  // Analytics derivation
  const totalVisits = attendance?.total || membership.total_check_ins || 0;

  // Calculate avg duration
  const validCheckins = attendance?.check_ins?.filter((c: any) => c.duration_minutes != null) || [];
  const avgDuration = validCheckins.length > 0
    ? Math.round(validCheckins.reduce((acc: number, c: any) => acc + c.duration_minutes, 0) / validCheckins.length)
    : 0;

  // Days remaining
  const daysRemaining = Math.max(0, Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const curOccupancy = gymDetail?.current_occupancy ?? membership.current_occupancy ?? 0;
  const maxCap = gymDetail?.max_capacity ?? membership.max_capacity ?? 100;
  const occupancyRatio = curOccupancy / maxCap;

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/60 hover:text-white">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">My Membership</h2>
          <p className="text-white/40 text-sm">Detailed overview & attendance</p>
        </div>
      </div>

      {/* Live Status Bar (Moved to top for visibility) */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Activity size={100} className="text-primary" />
        </div>
        
        <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
          </div>
          <h3 className="text-xl font-display font-black italic uppercase tracking-tighter text-white/90">CROWD STATUS</h3>
        </div>
        
        <div className="flex-1 w-full space-y-3 relative z-10">
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(1, occupancyRatio) * 100}%` }}
              className={clsx(
                "h-full rounded-full relative transition-all duration-1000",
                occupancyRatio > 0.8 ? "bg-red-500" : occupancyRatio > 0.5 ? "bg-orange-500" : "bg-emerald-500"
              )}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className={clsx(
              "flex items-center gap-1.5",
              occupancyRatio > 0.8 ? "text-red-500" : occupancyRatio > 0.5 ? "text-orange-500" : "text-emerald-500"
            )}>
              <Activity size={12} />
              {occupancyRatio > 0.8 ? 'VERY BUSY' : occupancyRatio > 0.5 ? 'MODERATE' : 'QUIET'} NOW
            </span>
            <span className="text-white/40 font-mono">
              <span className="text-white font-bold">{curOccupancy}</span> / {maxCap} PEOPLE IN FACILITY
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Analytics & Stats Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Activity size={18} className="text-primary" /> My Activity
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Total Visits</p>
                <p className="text-4xl font-black text-white">{totalVisits}</p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Avg. Workout</p>
                <p className="text-2xl font-bold flex items-baseline gap-1">
                  {avgDuration} <span className="text-sm font-medium text-white/40 uppercase tracking-widest">min</span>
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-blue-500/20 bg-gradient-to-br from-black to-blue-500/5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400" /> Plan Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-white/60">Status</span>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 uppercase tracking-widest rounded-full">{membership.status}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-white/60">Plan</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{membership.plan_name}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-white/60">Expires</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">{daysRemaining} days</p>
                  <p className="text-[10px] text-white/40">{formatDate(membership.end_date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Area: Gym Info & Logs */}
        <div className="md:col-span-2 space-y-6">

          {/* Gym Header Profile */}
          <div className="glass-card overflow-hidden">
            <div className="h-32 bg-white/5 relative border-b border-white/10">
              {gymDetail?.cover_image && (
                <img src={gymDetail.cover_image} alt="cover" className="w-full h-full object-cover opacity-50" />
              )}
            </div>
            <div className="p-6 relative">
              <div className="absolute -top-12 left-6 w-20 h-20 bg-black rounded-2xl border-2 border-white/10 flex items-center justify-center overflow-hidden">
                {gymDetail?.logo_url ? (
                  <img src={gymDetail.logo_url} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} className="text-white/20" />
                )}
              </div>

              <div className="ml-24">
                <h3 className="text-2xl font-black">{gymDetail?.name || membership.gym_name}</h3>
                <p className="text-white/60 text-sm mt-1">{gymDetail?.description || 'A premium fitness experience.'}</p>
              </div>

              {gymDetail?.addresses?.[0] && (
                <div className="mt-6 flex flex-col gap-4">
                  <a 
                    href={getGoogleMapsUrl(`${gymDetail.addresses[0].address_line1}, ${gymDetail.addresses[0].city}, ${gymDetail.addresses[0].state}`, gymDetail.addresses[0].latitude, gymDetail.addresses[0].longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <MapPin size={16} className="text-white/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    <p className="text-sm leading-relaxed text-white/80 group-hover:text-white transition-colors">
                      {gymDetail.addresses[0].address_line1}, {gymDetail.addresses[0].city}, {gymDetail.addresses[0].state}
                    </p>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Log */}
          <div className="glass-card flex-1 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Attendance History
              </h3>
              {activeSession && (
                <button
                  onClick={handleCheckout}
                  className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl font-bold text-sm transition-all border border-rose-500/20 flex items-center gap-2"
                >
                  <Activity size={16} /> Check Out Now
                </button>
              )}
            </div>

            <div className="p-2">
              {attendance?.check_ins?.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {attendance.check_ins.map((entry: any) => (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.check_out_time ? 'bg-white/5 border border-white/10' : 'bg-green-500/20 border border-green-500/30'}`}>
                          {entry.check_out_time ? <CheckCircle size={16} className="text-white/40" /> : <PlayCircle size={16} className="text-green-400 group-hover:scale-110 transition-transform animate-pulse" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{formatDate(entry.check_in_time)}</p>
                          <div className="flex items-center gap-2 text-xs text-white/40 mt-1 uppercase tracking-widest">
                            <span className="text-emerald-400 font-bold">{formatTime(entry.check_in_time)}</span>
                            <span>→</span>
                            {entry.check_out_time ? (
                              <span className="text-blue-400 font-bold">{formatTime(entry.check_out_time)}</span>
                            ) : (
                              <span className="text-green-400 animate-pulse font-bold">Active now</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-center">
                        <span className="text-xl font-black">{entry.duration_minutes != null ? entry.duration_minutes : '—'}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/30">MINUTES</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-white/20">
                  <Activity size={32} className="mx-auto mb-4 opacity-20" />
                  <p>No check-in history found yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipDetailView;
