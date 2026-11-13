import { useState, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { Star, MessageCircle, Reply, CheckCircle2, User, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import EmptyState from '../../../components/EmptyState';

const ReviewsTab = () => {
  const { gymId } = useGym();
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/memberships/reviews/${gymId}?sort_by=newest&page=1&page_size=50`);
      if (res.data.success) {
        setReviews(res.data.data.reviews || []);
        setTotalReviews(res.data.data.total || 0);
        setAvgRating(res.data.data.avg_rating || 0);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    
    setSubmittingReplyId(reviewId);
    try {
      await api.post(`/memberships/reviews/${reviewId}/respond`, { response: text });
      setReplyText({ ...replyText, [reviewId]: '' });
      await fetchReviews(); // Refresh
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Helper for rendering stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} className={i < rating ? 'fill-warning text-warning' : 'text-ink-subtle'} />
    ));
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-accent-text" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
           <MessageCircle className="text-accent-text" /> REVIEWS & FEEDBACK
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="bg-surface border border-border rounded-gm-xl shadow-card p-8 h-fit sticky top-24 space-y-6">
           <h3 className="font-bold text-sm uppercase tracking-widest text-ink-muted mb-4">Overall Score</h3>
           <div className="flex flex-col items-center justify-center py-4 bg-surface-raised rounded-2xl border border-border">
             <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-accent-text">{avgRating.toFixed(1)}</span>
                <span className="text-ink-subtle text-xl font-bold">/5</span>
             </div>
             <div className="flex gap-1 mt-2 mb-1">{renderStars(Math.round(avgRating))}</div>
             <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">{totalReviews} Ratings</p>
           </div>
        </div>

        {/* Review List */}
        <div className="md:col-span-2 space-y-4">
           {reviews.length === 0 ? (
             <EmptyState 
               icon={Star} 
               title="No reviews yet" 
               description="Once members start reviewing your gym, their feedback will appear here." 
             />
           ) : (
             reviews.map((review) => (
               <div key={review.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4 group">
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center overflow-hidden shrink-0">
                           {review.avatar_url ? <img src={review.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-ink-muted" />}
                        </div>
                        <div>
                           <h5 className="font-bold text-sm">{review.user_name || 'Anonymous Member'}</h5>
                           <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex">{renderStars(review.rating)}</div>
                              {review.is_verified_member && (
                                <span className="flex items-center gap-1 text-[10px] text-success font-bold uppercase"><CheckCircle2 size={12}/> Verified</span>
                              )}
                           </div>
                        </div>
                     </div>
                     <span className="text-xs text-ink-subtle font-mono shrink-0">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>

                  <div>
                     <h4 className="font-bold text-lg">{review.title}</h4>
                     <p className="text-sm text-ink-muted mt-1">{review.review}</p>
                  </div>

                  {/* Sub-ratings Breakdown (Optional display) */}
                  <div className="flex gap-4 pt-2">
                     <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Clean: <span className="text-ink">{review.cleanliness_rating || '-'}</span></div>
                     <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Equip: <span className="text-ink">{review.equipment_rating || '-'}</span></div>
                     <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Staff: <span className="text-ink">{review.staff_rating || '-'}</span></div>
                  </div>

                  {/* Owner Response Section */}
                  <div className="pt-4 border-t border-border">
                     {review.owner_response ? (
                        <div className="bg-accent-soft border border-accent-border rounded-xl p-4">
                           <div className="flex items-center gap-2 mb-2">
                              <Reply size={14} className="text-accent-text" />
                              <span className="text-xs font-bold text-accent-text uppercase tracking-widest">Your Response</span>
                              <span className="text-[10px] text-ink-subtle ml-auto">{new Date(review.response_date).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm text-ink-muted ">"{review.owner_response}"</p>
                        </div>
                     ) : (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 opacity-50 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                           <input 
                             type="text" 
                             value={replyText[review.id] || ''} 
                             onChange={(e) => setReplyText({...replyText, [review.id]: e.target.value})}
                             placeholder="Write a public reply..." 
                             className="flex-1 bg-surface-sunken border border-border rounded-xl py-2.5 px-4 text-sm text-ink focus:border-accent outline-none transition-colors"
                           />
                           <button 
                             onClick={() => handleReply(review.id)}
                             disabled={!replyText[review.id]?.trim() || submittingReplyId === review.id}
                             className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2.5 px-6 text-xs whitespace-nowrap disabled:opacity-50 flex items-center justify-center"
                           >
                             {submittingReplyId === review.id ? <Loader2 size={14} className="animate-spin" /> : 'Post Reply'}
                           </button>
                        </div>
                     )}
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
