import { useState, useEffect } from 'react';
import axios from 'axios';
import { clsx } from 'clsx';
import { Utensils, Dumbbell, Calendar, RefreshCw, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function PersonalizationView() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/recommendations`);
      if (res.data?.data) {
        setRecommendations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClick = (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedRec(item);
    setFeedbackModalVisible(true);
  };

  const confirmRegenerate = async () => {
    if (!selectedRec) return;
    const id = selectedRec.id;
    setRegenerating(id);
    setFeedbackModalVisible(false);
    try {
      const res = await axios.post(`${API_URL}/ai/recommendations/${id}/regenerate`, {
        feedback: feedback.trim() || undefined
      }, { timeout: 30000 });
      if (res.data?.data) {
        setFeedback('');
        fetchRecommendations();
        setSelectedRec(res.data.data);
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setRegenerating(null);
    }
  };

  const handleCompleteClick = (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedRec(item);
    setCompletionModalVisible(true);
  };

  const confirmComplete = async () => {
    if (!selectedRec) return;
    setCompleting(true);
    try {
      const res = await axios.post(`${API_URL}/ai/recommendations/${selectedRec.id}/complete`, {
        feedback: completionFeedback.trim() || undefined
      });
      if (res.data?.data) {
        setCompletionFeedback('');
        setCompletionModalVisible(false);
        fetchRecommendations();
        setSelectedRec(res.data.data);
      }
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeRecs = recommendations.filter(r => r.is_active);
  const pastRecs = recommendations.filter(r => !r.is_active);

  return (
    <div className="flex-1 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Active Recommendations Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Current Focus</h2>
            <div className="h-[1px] flex-1 bg-white/10 ml-4" />
          </div>

          {activeRecs.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center">
              <Calendar size={32} className="text-white/20 mb-3" />
              <p className="text-white/60 text-sm">No active plans.</p>
              <p className="text-white/40 text-xs mt-1">Ask MigoAI for a workout or diet plan to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRecs.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedRec(item)}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                        {item.type === 'workout' ? <Dumbbell size={14} /> : <Utensils size={14} />}
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-bold">
                          {item.type} Plan
                        </p>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        {item.is_completed && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRegenerateClick(item, e)}
                      disabled={regenerating !== null}
                      className={clsx(
                        "p-2 rounded-full transition-colors",
                        regenerating === item.id 
                          ? "bg-primary text-white" 
                          : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <RefreshCw size={14} className={regenerating === item.id ? "animate-spin" : ""} />
                    </button>
                  </div>
                  
                  {/* Snippet */}
                  <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
                    {item.content.replace(/\[METER:[^\]]+\]/g, '').replace(/[#*`]/g, '')}
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-white/30 font-bold tracking-wider">
                      Gen: {item.generation_count} • {new Date(item.date_for).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      View Full <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Recommendations */}
        {pastRecs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 mt-8">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider">Past Plans</h2>
              <div className="h-[1px] flex-1 bg-white/5 ml-4" />
            </div>
            
            <div className="flex flex-col gap-2">
              {pastRecs.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedRec(item)}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.05] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/40">
                      {item.type === 'workout' ? <Dumbbell size={12} /> : <Utensils size={12} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/80">{item.title}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-white/20" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                  {selectedRec.type === 'workout' ? <Dumbbell size={14} /> : <Utensils size={14} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedRec.title}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                    Generated for {new Date(selectedRec.date_for).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRec(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <MarkdownRenderer content={selectedRec.content} />
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black flex gap-3 justify-end">
              {selectedRec.is_completed ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  Session Logged
                </div>
              ) : (
                <>
                  <button
                    onClick={(e) => handleRegenerateClick(selectedRec, e)}
                    disabled={regenerating !== null}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 text-white/60 border border-white/10 font-bold hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={regenerating === selectedRec.id ? "animate-spin" : ""} />
                    Regenerate
                  </button>
                  <button
                    onClick={(e) => handleCompleteClick(selectedRec, e)}
                    disabled={completing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {completing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Finish Session
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Regeneration Feedback Modal */}
      {feedbackModalVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-1">Update Plan</h3>
            <p className="text-xs text-white/40 mb-6 font-bold uppercase tracking-widest">Help MigoAI improve this recommendation</p>
            
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Specific Feedback (Optional)</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
              placeholder="e.g. Focus more on cardio, exclude nuts, more protein..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setFeedbackModalVisible(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRegenerate}
                className="flex-2 btn-primary py-3 rounded-xl"
              >
                Confirm & Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Feedback Modal */}
      {completionModalVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-1">Session Complete! 🎉</h3>
            <p className="text-xs text-white/40 mb-6 font-bold uppercase tracking-widest">How was your workout today?</p>
            
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Notes for tomorrow (Optional)</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
              placeholder="e.g. Too easy, could lift heavier, or had some shoulder pain..."
              value={completionFeedback}
              onChange={(e) => setCompletionFeedback(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setCompletionModalVisible(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors"
              >
                Not now
              </button>
              <button 
                onClick={confirmComplete}
                disabled={completing}
                className="flex-2 btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {completing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Log Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
