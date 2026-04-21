import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Calendar, ArrowLeft,
  Shield, Award, CheckCircle2, Globe, Home,
  Building2, User, Users, Dumbbell,
  Timer, BadgeCheck, Languages,
  Image as ImageIcon, Package, MessageCircle
} from 'lucide-react';
import clsx from 'clsx';
import PageLoader from '../../components/PageLoader';
import MapPickerModal from '../../components/MapPickerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];



const TrainerProfile = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<{ total: number; avg_rating: number }>({ total: 0, avg_rating: 0 });

  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const res = await axios.get(`${API_URL}/trainers/${trainerId}`);
        setTrainer(res.data);
      } catch (err) {
        console.error('Failed to fetch trainer:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainer();

    // Fetch reviews
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${API_URL}/trainer-bookings/reviews/${trainerId}`);
        setReviews(res.data.data?.reviews || []);
        setReviewsMeta({
          total: res.data.data?.total || 0,
          avg_rating: res.data.data?.avg_rating || 0,
        });
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    fetchReviews();
  }, [trainerId]);

  if (loading) return <PageLoader message="Loading trainer profile..." />;
  if (!trainer) return (
    <div className="text-center py-20 space-y-4">
      <User size={48} className="mx-auto text-white/20" />
      <h2 className="text-2xl font-bold">Trainer Not Found</h2>
      <button onClick={() => navigate(-1)} className="btn-primary px-6 py-2">Go Back</button>
    </div>
  );

  const sessionPrice = trainer.single_session_charges || trainer.hourly_rate || 0;

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-32">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Explore</span>
      </button>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <div className="glass-card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            {trainer.avatar_url ? (
              <img src={trainer.avatar_url} alt={trainer.full_name} className="w-full h-full object-cover" />
            ) : (
              <User size={60} className="text-primary/40" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter italic uppercase">
                  {trainer.full_name || 'Pro Trainer'}
                </h1>
                {trainer.verification_status === 'verified' && (
                  <BadgeCheck size={24} className="text-blue-400 shrink-0" />
                )}
              </div>
              {trainer.bio && (
                <p className="text-white/50 text-sm leading-relaxed max-w-xl">{trainer.bio}</p>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {trainer.specializations?.map((spec: string) => (
                <span key={spec} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  {spec.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-primary fill-primary" />
                <span className="font-black text-lg">{trainer.rating_avg?.toFixed(1) || '—'}</span>
                <span className="text-[10px] text-white/30 font-bold">({trainer.rating_count} reviews)</span>
              </div>
              {trainer.experience_years && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Timer size={14} />
                  <span className="font-bold">{trainer.experience_years} yrs experience</span>
                </div>
              )}
              {trainer.total_clients > 0 && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Users size={14} />
                  <span className="font-bold">{trainer.total_clients} clients</span>
                </div>
              )}
              {trainer.languages_spoken && trainer.languages_spoken.length > 0 && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Languages size={14} />
                  <span className="font-bold">{trainer.languages_spoken.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Availability Modes */}
            <div className="flex flex-wrap gap-2 pt-2">
              {trainer.is_available_offline && (
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1.5">
                  <Building2 size={10} /> In-Gym
                </span>
              )}
              {trainer.is_available_online && (
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/20 flex items-center gap-1.5">
                  <Globe size={10} /> Online
                </span>
              )}
              {trainer.accepts_home_visits && (
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-purple-400 bg-purple-500/10 border-purple-500/20 flex items-center gap-1.5">
                  <Home size={10} /> Home Visits
                  {trainer.travel_distance_km && <span className="text-white/30">({trainer.travel_distance_km}km)</span>}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">
          {/* Certifications */}
          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award size={20} className="text-primary" /> Certifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trainer.certifications.map((cert: any) => (
                  <div key={cert.id} className="glass-card p-4 flex items-center gap-3 group hover:border-white/10 transition-colors">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      cert.is_verified ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/5 border border-white/10"
                    )}>
                      {cert.is_verified ? <Shield size={18} className="text-blue-400" /> : <Award size={18} className="text-white/30" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{cert.name}</p>
                      <p className="text-[10px] text-white/30 font-bold">{cert.issued_by}
                        {cert.issue_year && ` • ${cert.issue_year}`}
                      </p>
                    </div>
                    {cert.is_verified && (
                      <CheckCircle2 size={14} className="text-blue-400 shrink-0 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Availability */}
          {trainer.availability && trainer.availability.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-primary" /> Weekly Schedule
              </h2>
              <div className="glass-card p-6 space-y-3">
                {DAY_NAMES.map((day, idx) => {
                  const avail = trainer.availability.find((a: any) => a.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                      <span className="text-sm font-bold w-28">{day}</span>
                      {avail && avail.is_available ? (
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-emerald-400 font-bold">{avail.start_time} — {avail.end_time}</span>
                          <span className={clsx(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            avail.session_type === 'online' ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                            avail.session_type === 'offline' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                            "text-primary bg-primary/10 border-primary/20"
                          )}>
                            {avail.session_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/20 font-bold">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gallery */}
          {trainer.gallery && trainer.gallery.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" /> Portfolio
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trainer.gallery.map((img: any) => (
                  <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer">
                    <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle size={20} className="text-primary" /> Reviews
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-primary fill-primary" />
                    <span className="text-sm font-black">{reviewsMeta.avg_rating?.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-bold">({reviewsMeta.total} reviews)</span>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.slice(0, 5).map((rev: any) => (
                  <div key={rev.id} className="glass-card p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          {rev.avatar_url ? (
                            <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} className="text-white/20" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{rev.user_name || 'Member'}</p>
                            {rev.is_verified_client && (
                              <span className="text-[7px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} size={9} className={i <= rev.rating ? 'text-primary fill-primary' : 'text-white/10'} />
                            ))}
                            <span className="text-[8px] text-white/20 ml-1">
                              {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {rev.title && <p className="text-xs font-bold italic text-white/70">"{rev.title}"</p>}
                    {rev.review && <p className="text-xs text-white/40 leading-relaxed">{rev.review}</p>}
                    {rev.trainer_response && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-1">
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">Trainer Response</p>
                        <p className="text-[11px] text-white/50">{rev.trainer_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Pricing & Packages ───────────────────── */}
        <div className="space-y-6">
          {/* Quick Pricing */}
          <div className="glass-card p-6 space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent sticky top-24">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Dumbbell size={18} className="text-primary" /> Pricing
            </h3>
            
            <div className="space-y-3">
              {sessionPrice > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/60">Per Session</span>
                  <span className="text-xl font-black text-primary">₹{sessionPrice.toLocaleString()}</span>
                </div>
              )}
              {trainer.hourly_rate && (
                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <span className="text-sm text-white/60">Hourly Rate</span>
                  <span className="text-lg font-black">₹{trainer.hourly_rate.toLocaleString()}</span>
                </div>
              )}
              {trainer.monthly_charges && (
                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <span className="text-sm text-white/60">Monthly</span>
                  <span className="text-lg font-black text-emerald-400">₹{trainer.monthly_charges.toLocaleString()}</span>
                </div>
              )}
              {trainer.charges_negotiable && (
                <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">• Negotiable</p>
              )}
            </div>

            <button 
              disabled
              className="w-full bg-white/5 border border-white/10 text-white/20 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Booking Coming Soon
            </button>
          </div>

          {/* Training Packages */}
          {trainer.packages && trainer.packages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package size={18} className="text-primary" /> Packages
              </h3>
              <div className="space-y-3">
                {trainer.packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id === selectedPackage?.id ? null : pkg)}
                    className={clsx(
                      "glass-card p-5 cursor-pointer transition-all",
                      selectedPackage?.id === pkg.id ? "border-primary/50 bg-primary/5" : "hover:border-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{pkg.name}</h4>
                          {pkg.is_popular && (
                            <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">Popular</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                          {pkg.total_sessions} sessions • {pkg.validity_days} days
                        </p>
                      </div>
                      <div className="text-right">
                        {pkg.discounted_price ? (
                          <>
                            <p className="text-xs text-white/30 line-through">₹{pkg.price.toLocaleString()}</p>
                            <p className="text-xl font-black text-emerald-400">₹{pkg.discounted_price.toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="text-xl font-black">₹{pkg.price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-[11px] text-white/40 mb-3">{pkg.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {pkg.includes_diet_plan && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Diet Plan</span>
                      )}
                      {pkg.includes_progress_tracking && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Progress Tracking</span>
                      )}
                      {pkg.allows_rescheduling && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Rescheduling</span>
                      )}
                    </div>

                    {selectedPackage?.id === pkg.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-white/5"
                      >
                        <button
                          disabled
                          className="w-full bg-white/5 border border-white/10 text-white/20 py-3 text-xs font-black uppercase tracking-widest cursor-not-allowed"
                        >
                          Booking Coming Soon
                        </button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showBooking && (
          <BookingFlow
            trainer={trainer}
            selectedPackage={selectedPackage}
            onClose={() => setShowBooking(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING FLOW MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface BookingFlowProps {
  trainer: any;
  selectedPackage: any;
  onClose: () => void;
}

const BookingFlow = ({ trainer, selectedPackage, onClose }: BookingFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pkg = selectedPackage;

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/trainer-bookings/bookings`, {
        trainer_id: trainer.id,
        package_id: pkg?.id || null,
        start_date: selectedDate,
        user_notes: notes?.trim() || undefined,
      });
      setStep(4); // Success
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert(err.response?.data?.detail || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = pkg
    ? (pkg.discounted_price || pkg.price)
    : (trainer.single_session_charges || trainer.hourly_rate || 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 40 }}
          className="w-full max-w-lg glass-card p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-black tracking-tighter italic uppercase">Buy Training Plan</h2>
              <p className="text-xs text-white/40 mt-1">with {trainer.full_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={clsx(
                  "w-8 h-1 rounded-full transition-all",
                  step >= s ? "bg-primary" : "bg-white/10"
                )} />
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {step === 1 && (
              /* ── Step 1: Select Date ──────────────────────────────── */
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Plan Start Date</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {dates.map(date => {
                      const d = new Date(date);
                      const isSelected = selectedDate === date;
                      return (
                        <button
                          key={date}
                          onClick={() => handleDateSelect(date)}
                          className={clsx(
                            "flex flex-col items-center px-4 py-3 rounded-xl border transition-all shrink-0 min-w-[60px]",
                            isSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                          <span className="text-lg font-black">{d.getDate()}</span>
                          <span className="text-[9px] font-bold text-white/30">{d.toLocaleDateString('en', { month: 'short' })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card border-dashed p-4 text-sm text-white/40 leading-relaxed">
                  You’re activating a session pack here. Individual session dates and trainer approval happen after purchase.
                </div>

                <button
                  disabled={!selectedDate}
                  onClick={() => setStep(2)}
                  className="w-full btn-primary py-3 text-sm font-black uppercase tracking-widest disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              /* ── Step 2: Session Details ──────────────────────────── */
              <div className="space-y-6">
                <div className="glass-card border-dashed p-4 text-sm text-white/40 leading-relaxed">
                  Session type, location, and exact time are collected when you request each session from your active balance.
                </div>

                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Notes for Trainer (optional)</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any goals or context for this plan..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary/50 outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 font-bold text-sm hover:bg-white/5 transition-colors">Back</button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 btn-primary py-3 text-sm font-black uppercase tracking-widest disabled:opacity-30"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              /* ── Step 3: Review & Confirm ─────────────────────────── */
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Trainer</span>
                      <span className="font-bold">{trainer.full_name}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-white/40">Date</span>
                      <span className="font-bold">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    {pkg && (
                      <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                        <span className="text-white/40">Package</span>
                        <span className="font-bold">{pkg.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-white/40">Session Booking</span>
                      <span className="font-bold text-primary">Requested Later</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold">Total Amount</span>
                    <span className="text-2xl font-black text-primary">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 font-bold text-sm hover:bg-white/5 transition-colors">Back</button>
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="flex-1 btn-primary py-3 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {submitting ? 'Activating...' : 'Activate Plan'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              /* ── Step 4: Success ─────────────────────────────────── */
              <div className="text-center space-y-6 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-display font-black tracking-tighter italic uppercase">PLAN ACTIVATED!</h3>
                  <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
                    Your session balance with {trainer.full_name} is ready. You can now request individual sessions and the trainer will confirm each one.
                  </p>
                </div>
                <button
                  onClick={() => { onClose(); navigate('/app/dashboard'); }}
                  className="btn-primary py-3 px-8 text-sm font-black uppercase tracking-widest"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default TrainerProfile;
