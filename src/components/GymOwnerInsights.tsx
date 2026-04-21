import { motion } from 'framer-motion';
import { TrendingUp, MessageCircle, BellRing, Star, Zap, UserX, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotification } from '../context/NotificationContext';

export default function GymOwnerInsights() {
  const { showNotification } = useNotification();

  const handleAction = (action: string) => {
    showNotification(`${action} executed successfully.`, 'success');
  };

  // Mock data for At-Risk CRM
  const atRiskMembers = [
    { id: 1, name: 'Rahul Sharma', issue: 'Inactive for 14 days', plan: 'Monthly', avatar: null },
    { id: 2, name: 'Priya Desai', issue: 'Plan expires in 3 days', plan: 'Yearly', avatar: null },
    { id: 3, name: 'Amit Kumar', issue: 'Inactive for 21 days', plan: 'Quarterly', avatar: null },
  ];

  // Mock data for Staff Performance
  const topStaff = [
    { id: 1, name: 'Vikram Singh', role: 'Head Coach', rating: 4.9, sessions: 142 },
    { id: 2, name: 'Neha Patel', role: 'Yoga Instructor', rating: 4.8, sessions: 98 },
  ];

  return (
    <div className="space-y-8 mt-12">
      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Occupancy Chart (Simulated with CSS) */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ActivityIcon className="text-primary" />
                Live Footfall & Peak Hours
              </h3>
              <p className="text-xs text-white/40">Today's estimated traffic flow</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Live</span>
            </div>
          </div>
          
          <div className="h-48 flex items-end gap-2 pb-4 border-b border-white/5 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-4 w-6 flex flex-col justify-between text-[10px] text-white/20 font-bold">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            
            {/* Chart bars */}
            <div className="flex-1 flex items-end justify-between pl-8 gap-1 h-full">
              {[10, 15, 30, 80, 100, 60, 40, 90, 85, 30, 10, 5].map((val, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group relative">
                  <div 
                    className={clsx(
                      "w-full rounded-t-sm transition-all duration-1000",
                      val > 70 ? "bg-primary" : val > 30 ? "bg-primary/50" : "bg-white/10"
                    )} 
                    style={{ height: `${val}%` }} 
                  />
                  <span className="text-[9px] text-white/40 font-bold opacity-0 group-hover:opacity-100 absolute -top-6 bg-black/80 px-2 py-1 rounded">
                    {val}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between pl-8 text-[10px] text-white/40 font-bold uppercase">
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                Revenue Intelligence
              </h3>
              <p className="text-xs text-white/40">Month-to-date breakdown</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">₹45,200</span>
              <div className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase flex items-center justify-end gap-1">
                <TrendingUp size={10} /> +12% MoM
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white/80">Yearly Plans (60%)</span>
                <span className="text-primary">₹27,120</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} className="h-full bg-primary rounded-full" transition={{ duration: 1 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white/80">Monthly Plans (30%)</span>
                <span className="text-emerald-500">₹13,560</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '30%' }} className="h-full bg-emerald-500 rounded-full" transition={{ duration: 1, delay: 0.2 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white/80">Day Passes (10%)</span>
                <span className="text-blue-500">₹4,520</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-blue-500 rounded-full" transition={{ duration: 1, delay: 0.4 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* At-Risk CRM */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserX size={18} className="text-red-500" />
                At-Risk Members (CRM)
              </h3>
              <p className="text-xs text-white/40">Take action to prevent churn</p>
            </div>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {atRiskMembers.length} Action Needed
            </span>
          </div>
          
          <div className="space-y-3">
            {atRiskMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white/60">
                    {member.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{member.name}</h4>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {member.issue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAction(`Promo Sent to ${member.name}`)}
                    className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-lg transition-colors border border-primary/20"
                    title="Send Promo Offer"
                  >
                    <Zap size={16} />
                  </button>
                  <button 
                    onClick={() => handleAction(`WhatsApp opened for ${member.name}`)}
                    className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors border border-emerald-500/20"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Staff */}
        <div className="space-y-6 flex flex-col">
          {/* Command Center */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 border-b border-white/5 pb-2">
              <Zap size={16} className="text-amber-500" />
              Command Center
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleAction('Broadcast UI opened')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <BellRing size={20} className="text-white/40 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest">Broadcast</span>
              </button>
              <button 
                onClick={() => handleAction('Flash Sale UI opened')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <TrendingUp size={20} className="text-white/40 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest">Flash Sale</span>
              </button>
            </div>
          </div>

          {/* Staff Leaderboard */}
          <div className="glass-card p-6 flex-1">
            <h3 className="font-bold flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
              <Star size={16} className="text-primary" />
              Top Staff
            </h3>
            <div className="space-y-4">
              {topStaff.map((staff, i) => (
                <div key={staff.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-600/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{staff.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{staff.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold flex items-center gap-1 justify-end">
                      {staff.rating} <Star size={10} className="fill-primary text-primary" />
                    </p>
                    <p className="text-[10px] text-white/40">{staff.sessions} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Activity Icon helper
function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
