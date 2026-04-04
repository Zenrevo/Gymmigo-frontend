import { useState, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { Users, TrendingUp, Shield, Plus, X, Building2, Star, QrCode, RefreshCw, Download, Maximize2, Clock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../../../components/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const OverviewTab = () => {
  const { gym, refetch, gymId } = useGym();
  const [isUpdating, setIsUpdating] = useState(false);

  // Daily QR state
  const [qrData, setQrData] = useState<{ qr_payload: string; date: string; token: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  // Fetch daily QR
  useEffect(() => {
    const fetchQR = async () => {
      if (!gymId) return;
      setQrLoading(true);
      try {
        const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}/daily-qr`);
        setQrData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch daily QR:', err);
      } finally {
        setQrLoading(false);
      }
    };
    fetchQR();
  }, [gymId]);

  const updateOccupancy = async (change: number) => {
    if (!gym) return;
    const newValue = Math.max(0, (gym.gym.current_occupancy || 0) + change);
    if (newValue > gym.gym.max_capacity) return;

    setIsUpdating(true);
    try {
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/capacity`, {
        current_occupancy: newValue
      });
      await refetch();
    } catch (err) {
      console.error('Failed to update occupancy', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('daily-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, 600, 600);
      ctx!.drawImage(img, 50, 50, 500, 500);
      ctx!.fillStyle = '#000000';
      ctx!.font = 'bold 18px Inter, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText(`${gym?.gym?.name || 'Gym'} — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 300, 580);
      const link = document.createElement('a');
      link.download = `daily-qr-${qrData?.date || 'today'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const occupancyPercent = gym ? Math.round(((gym.gym.current_occupancy || 0) / (gym.gym.max_capacity || 100)) * 100) : 0;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Live Occupancy Header Card */}
      <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 pointer-events-none">
          <Users size={180} />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Monitor
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight italic">LIVE OCCUPANCY</h2>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="space-y-1 text-right">
              <p className="text-7xl font-display font-black italic tracking-tighter text-primary">
                {gym?.gym?.current_occupancy || 0}
              </p>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Members In-Gym</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => updateOccupancy(1)}
                disabled={isUpdating}
                className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-bold"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={() => updateOccupancy(-1)}
                disabled={isUpdating}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3 relative z-10">
          <div className="flex justify-between items-end">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Total Capacity: {gym?.gym?.max_capacity || 100}
            </p>
            <p className="text-[10px] font-bold text-primary">{occupancyPercent}% Full</p>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${Math.min(100, occupancyPercent)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 border-b-2 border-b-emerald-500/50 hover:bg-white/5 transition-colors group">
          <TrendingUp className="text-emerald-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
          <h4 className="text-3xl font-black italic">{gym?.gym?.rating_count || 0}</h4>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Total Reviews</p>
        </div>
        <div className="glass-card p-6 border-b-2 border-b-blue-500/50 hover:bg-white/5 transition-colors group">
          <Shield className="text-blue-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
          <h4 className="text-3xl font-black italic">{gym?.membership_plans?.length || 0}</h4>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Active Plans</p>
        </div>
        <div className="glass-card p-6 border-b-2 border-b-primary/50 hover:bg-white/5 transition-colors group">
          <Building2 className="text-primary mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
          <h4 className="text-3xl font-black italic">{gym?.equipment?.length || 0}</h4>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Equipment Types</p>
        </div>
        <div className="glass-card p-6 border-b-2 border-b-yellow-500/50 hover:bg-white/5 transition-colors group">
          <Star className="text-yellow-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
          <h4 className="text-3xl font-black italic">{gym?.gym?.rating_avg ? gym.gym.rating_avg.toFixed(1) : 'N/A'}</h4>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Avg Rating</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Daily QR Card ──────────────────────────────────── */}
        <div className="glass-card p-6 space-y-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-400 to-blue-500" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-bold">Today's Check-in QR</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{todayFormatted}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={downloadQR} title="Download QR"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <Download size={14} />
              </button>
              <button onClick={() => setQrFullscreen(true)} title="Fullscreen QR"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {qrLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-primary" size={24} />
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white rounded-2xl p-3 shadow-2xl shadow-primary/10">
                <QRCodeSVG
                  id="daily-qr-svg"
                  value={qrData.qr_payload}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-white/30">
                  Members scan this code to check in automatically
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Refreshes at midnight
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">
              Failed to generate QR code.
            </div>
          )}
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          {/* Today's Schedule */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Today's Schedule
            </h3>
            <div className="text-sm text-white/60">
              {gym?.operating_hours?.find((o: any) => o.day_of_week === new Date().getDay() - 1 || (new Date().getDay() === 0 && o.day_of_week === 6)) ? (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                   <span className="font-bold">Today</span>
                   <span className="text-primary">
                     {gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.is_closed ? 'Closed' : `${gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.open_time} - ${gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.close_time}`}
                   </span>
                </div>
              ) : (
                <p className="italic">No schedule set for today.</p>
              )}
            </div>
            <Link to="schedule" className="btn-primary w-full py-2 flex items-center gap-2 justify-center text-xs mt-4">Manage Schedule</Link>
          </div>
          
          {/* Member Database Link */}
          <div className="glass-card p-6 space-y-4 flex flex-col justify-center items-center text-center border-dashed">
               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Users size={24} />
               </div>
               <h3 className="font-bold">Member Database</h3>
               <p className="text-xs text-white/40">Access and manage all gym members, view attendance history, and analyze demographics.</p>
               <Link to="/contact" className="text-primary text-xs font-bold hover:underline py-2">View Members →</Link>
          </div>
        </div>
      </div>

      {/* ── QR Fullscreen Modal ──────────────────────────────── */}
      <Modal isOpen={qrFullscreen} onClose={() => setQrFullscreen(false)} title="Daily Check-in QR Code" maxWidth="max-w-md">
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold">{gym?.gym?.name || 'Your Gym'}</h3>
            <p className="text-sm text-white/40">{todayFormatted}</p>
          </div>

          {qrData && (
            <div className="bg-white rounded-3xl p-5 shadow-2xl">
              <QRCodeSVG
                value={qrData.qr_payload}
                size={280}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-white/50">
              Display this QR at your gym entrance.<br/>
              Members scan to check in automatically.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                New code every midnight
              </p>
            </div>
          </div>

          <button onClick={downloadQR}
            className="btn-primary py-3 px-8 flex items-center gap-2 text-sm">
            <Download size={16} /> Download as Image
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OverviewTab;
