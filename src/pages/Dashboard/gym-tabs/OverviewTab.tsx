import { useState, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { Users, TrendingUp, Shield, Building2, Star, QrCode, RefreshCw, Download, Maximize2, Clock } from 'lucide-react';
import api from '../../../utils/api';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../../../components/Modal';
import clsx from 'clsx';



const OverviewTab = () => {
  const { gym, gymId } = useGym();

  // Gym QR state
  const [qrData, setQrData] = useState<{ qr_payload: string; gym_id?: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  // Fetch daily QR
  useEffect(() => {
    const fetchQR = async () => {
      if (!gymId) return;
      setQrLoading(true);
      try {
        const res = await api.get(`/gym-owner/gyms/${gymId}/daily-qr`);
        setQrData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch daily QR:', err);
      } finally {
        setQrLoading(false);
      }
    };
    fetchQR();
  }, [gymId]);



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
      ctx!.fillText(`${gym?.gym?.name || 'Gym'} — Check-in QR`, 300, 580);
      const link = document.createElement('a');
      link.download = `gym-qr-checkin.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const occupancyPercent = gym ? Math.round(((gym.gym.current_occupancy || 0) / (gym.gym.max_capacity || 100)) * 100) : 0;




  return (
    <div className="space-y-8">
      {/* Live Occupancy Header Card */}
      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 pointer-events-none">
          <Users size={180} />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-success bg-success-soft border border-success/30 px-2 py-0.5 rounded flex items-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-success" /> Live Monitor
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight uppercase">Total Occupancy</h2>
          </div>
          
          <div className="flex items-center gap-8 pr-4">
            <div className="space-y-1 text-right">
              <p className="text-7xl font-display font-black tracking-tighter text-accent-text">
                {gym?.gym?.current_occupancy || 0}
              </p>
              <p className="text-ink-muted font-bold uppercase tracking-widest text-[10px]">Members In-Gym</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6 relative z-10">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                Capacity Limit: {gym?.gym?.max_capacity || 100}
              </p>
              <p className="text-[10px] font-bold text-accent-text">{occupancyPercent}% Load</p>
            </div>
            <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden border border-border shadow-inner">
              <div 
                className="h-full bg-accent transition-all duration-700 ease-out relative" 
                style={{ width: `${Math.min(100, occupancyPercent)}%` }} 
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          </div>

          {/* Integrated Activity Breakdown */}
          {(gym?.gym?.show_stats && gym?.metrics?.workout_distribution && gym.metrics.workout_distribution.length > 0) && (
            <div className="pt-6 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {gym.metrics.workout_distribution.map((item: any, idx: number) => {
                  const colors = ['text-danger', 'text-info', 'text-success', 'text-warning', 'text-info', 'text-danger'];
                  const colorClass = colors[idx % colors.length];
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-ink-muted uppercase tracking-wide truncate pr-2">{item.workout}</span>
                        <span className={clsx("font-black italic shrink-0", colorClass)}>{item.count} members</span>
                      </div>
                      <div className="h-1 w-full bg-surface-raised rounded-full overflow-hidden">
                         <div 
                            className={clsx("h-full transition-all duration-500", colorClass.replace('text-', 'bg-'))}
                            style={{ width: `${Math.min(100, (item.count / (gym?.gym?.current_occupancy || 1)) * 100)}%` }}
                         />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {gym?.gym?.show_stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-emerald-500/50 hover:bg-surface-raised transition-colors group">
            <TrendingUp className="text-success mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <h4 className="text-3xl font-black ">{gym?.gym?.rating_count || 0}</h4>
            <p className="text-ink-muted text-[10px] font-bold uppercase tracking-widest mt-1">Total Reviews</p>
          </div>
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-blue-500/50 hover:bg-surface-raised transition-colors group">
            <Shield className="text-info mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <h4 className="text-3xl font-black ">{gym?.membership_plans?.length || 0}</h4>
            <p className="text-ink-muted text-[10px] font-bold uppercase tracking-widest mt-1">Active Plans</p>
          </div>
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-primary/50 hover:bg-surface-raised transition-colors group">
            <Building2 className="text-accent-text mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <h4 className="text-3xl font-black ">{gym?.equipment?.length || 0}</h4>
            <p className="text-ink-muted text-[10px] font-bold uppercase tracking-widest mt-1">Equipment Types</p>
          </div>
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 border-b-2 border-b-yellow-500/50 hover:bg-surface-raised transition-colors group">
            <Star className="text-warning mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <h4 className="text-3xl font-black ">{gym?.gym?.rating_avg ? gym.gym.rating_avg.toFixed(1) : 'N/A'}</h4>
            <p className="text-ink-muted text-[10px] font-bold uppercase tracking-widest mt-1">Avg Rating</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-gm-xl shadow-card p-4 text-center border-dashed text-ink-subtle text-[10px] uppercase font-bold tracking-[0.2em]">
          Portfolio statistics hidden
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Check-in QR Card ──────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 via-emerald-400 to-info" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-text">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-bold">Check-in QR</h3>
                <p className="text-[10px] text-success font-bold uppercase tracking-widest">Permanent • Print & Display</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={downloadQR} title="Download QR"
                className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-sunken text-ink-muted hover:text-ink transition-all">
                <Download size={14} />
              </button>
              <button onClick={() => setQrFullscreen(true)} title="Fullscreen QR"
                className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-sunken text-ink-muted hover:text-ink transition-all">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {qrLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-accent-text" size={24} />
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-ink rounded-2xl p-3 shadow-2xl shadow-raised">
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
                <p className="text-xs text-ink-subtle">
                  Members scan this code to check in automatically
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-[10px] font-bold text-success uppercase tracking-widest">
                    Never expires — print it once
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-ink-subtle text-sm">
              Failed to generate QR code.
            </div>
          )}
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          {/* Today's Schedule */}
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Clock size={16} className="text-accent-text" /> Today's Schedule
            </h3>
            <div className="text-sm text-ink-muted">
              {gym?.operating_hours?.find((o: any) => o.day_of_week === new Date().getDay() - 1 || (new Date().getDay() === 0 && o.day_of_week === 6)) ? (
                <div className="flex items-center justify-between p-4 bg-surface-raised rounded-xl">
                   <span className="font-bold">Today</span>
                   <span className="text-accent-text">
                     {gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.is_closed ? 'Closed' : `${gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.open_time} - ${gym.operating_hours.find((o:any) => o.day_of_week === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))?.close_time}`}
                   </span>
                </div>
              ) : (
                <p className="">No schedule set for today.</p>
              )}
            </div>
            <Link to="schedule" className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 w-full py-2 flex items-center gap-2 justify-center text-xs mt-4">Manage Schedule</Link>
          </div>
          
          {/* Member Database Link */}
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4 flex flex-col justify-center items-center text-center border-dashed">
               <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent-text mb-2">
                  <Users size={24} />
               </div>
               <h3 className="font-bold">Member Database</h3>
               <p className="text-xs text-ink-muted">Access and manage all gym members, view attendance history, and analyze demographics.</p>
               <Link to="members" className="text-accent-text text-xs font-bold hover:underline py-2">View Members →</Link>
          </div>
        </div>
      </div>

      {/* ── QR Fullscreen Modal ──────────────────────────────── */}
      <Modal isOpen={qrFullscreen} onClose={() => setQrFullscreen(false)} title="Check-in QR Code" maxWidth="max-w-md">
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold">{gym?.gym?.name || 'Your Gym'}</h3>
            <p className="text-sm text-success font-bold">Permanent Check-in Code</p>
          </div>

          {qrData && (
            <div className="bg-ink rounded-3xl p-5 shadow-2xl">
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
            <p className="text-sm text-ink-muted">
              Display this QR at your gym entrance.<br/>
              Members scan to check in automatically.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <p className="text-xs font-bold text-success uppercase tracking-widest">
                Permanent — works forever
              </p>
            </div>
          </div>

          <button onClick={downloadQR}
            className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-3 px-8 flex items-center gap-2 text-sm">
            <Download size={16} /> Download as Image
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OverviewTab;
