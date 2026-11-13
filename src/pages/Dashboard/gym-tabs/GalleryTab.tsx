import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Image as ImageIcon, Video, Trash2, Star, Loader2 } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';
import api from '../../../utils/api';
import { Sheet } from '../../../components/kit';

const GalleryTab = () => {
  const { gym, refetch, gymId } = useGym();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image form
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [imgPrimary, setImgPrimary] = useState(false);

  // Video form
  const [vidModalOpen, setVidModalOpen] = useState(false);
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumb, setVidThumb] = useState('');
  const [vidTitle, setVidTitle] = useState('');

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/images`, { image_url: imgUrl, is_primary: imgPrimary });
      await refetch();
      setImgModalOpen(false);
      setImgUrl(''); setImgPrimary(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteImage = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/images/${id}`);
      await refetch();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/videos`, { video_url: vidUrl, thumbnail_url: vidThumb, title: vidTitle });
      await refetch();
      setVidModalOpen(false);
      setVidUrl(''); setVidThumb(''); setVidTitle('');
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the video "${title}"?`)) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/videos/${id}`);
      await refetch();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-12">
      {/* IMAGES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
             <ImageIcon className="text-accent-text" /> PHOTO GALLERY
          </h3>
          <button onClick={() => setImgModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2 px-4 text-xs">+ Add Photo</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gym?.images?.map((img: any) => (
             <div key={img.id} className="group relative aspect-square rounded-gm-lg overflow-hidden bg-surface-raised border border-border">
                <img src={img.image_url || img.url} alt="Gym" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                   <div className="flex justify-end">
                      <button onClick={(e) => handleDeleteImage(img.id, e)} disabled={isSubmitting} className="p-2 bg-danger-soft text-danger hover:bg-danger hover:text-on-accent rounded-full backdrop-blur-md transition-colors disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   {img.is_primary && (
                     <div className="flex items-center gap-1 text-warning bg-overlay w-fit px-2 py-1 rounded-md border border-border backdrop-blur-md">
                        <Star size={12} className="fill-warning" /> <span className="text-[10px] font-bold uppercase tracking-widest">Primary</span>
                     </div>
                   )}
                </div>
             </div>
          ))}
          {!gym?.images?.length && (
            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-gm-lg">
               <ImageIcon size={48} className="mx-auto text-ink-subtle mb-4" />
               <p className="text-ink-muted">No photos uploaded. Showcase your gym to attract members.</p>
            </div>
          )}
        </div>
      </section>

      {/* VIDEOS */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
             <Video className="text-info" /> VIDEO TOURS
          </h3>
          <button onClick={() => setVidModalOpen(true)} className="px-4 py-2 bg-info-soft text-info border border-info/30 hover:bg-info-soft rounded-full font-bold text-xs transition-colors">+ Add Video</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {gym?.videos?.map((vid: any) => (
             <div key={vid.id} className="bg-surface border border-border rounded-gm-xl shadow-card overflow-hidden group">
               <div className="aspect-video bg-surface relative border-b border-border">
                 {vid.thumbnail_url ? (
                    <img src={vid.thumbnail_url} className="w-full h-full object-cover opacity-60" alt="" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-raised">
                      <Video size={48} className="text-ink-subtle" />
                    </div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-surface-sunken backdrop-blur-md flex items-center justify-center border border-border-strong pl-1 group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent" />
                    </div>
                 </div>
               </div>
               <div className="p-5 flex items-center justify-between">
                 <h5 className="font-bold truncate pr-4">{vid.title}</h5>
                  <button onClick={() => handleDeleteVideo(vid.id, vid.title)} disabled={isSubmitting} className="text-ink-muted hover:text-danger transition-colors p-2 shrink-0 disabled:opacity-50">
                     <Trash2 size={18} />
                  </button>
               </div>
             </div>
           ))}
           {!gym?.videos?.length && (
            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-gm-lg">
               <p className="text-ink-muted">Upload virtual tours, class highlights, or promotional videos.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <Sheet size="md" open={imgModalOpen} onClose={() => setImgModalOpen(false)} title="Upload Photo">
        <form onSubmit={handleAddImage} className="space-y-6">
           <ImageUpload 
             label="Choose Photo"
             onUploadComplete={(url) => setImgUrl(url)}
             aspectRatio="square"
           />
           <label className="flex items-center gap-3 p-4 bg-surface-raised rounded-xl border border-border cursor-pointer group">
              <input type="checkbox" checked={imgPrimary} onChange={e => setImgPrimary(e.target.checked)} className="w-5 h-5 accent-yellow-500" />
              <div>
                <span className="text-sm font-bold text-warning">Set as Primary Display Image</span>
                <p className="text-xs text-ink-muted">This will be the main cover photo for your gym listing.</p>
              </div>
           </label>
           <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-3">{isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto"/> : 'Save Photo'}</button>
        </form>
      </Sheet>

      <Sheet size="md" open={vidModalOpen} onClose={() => setVidModalOpen(false)} title="Add Video Tour">
        <form onSubmit={handleAddVideo} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Video Title *</label>
              <input required type="text" value={vidTitle} onChange={e => setVidTitle(e.target.value)} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="e.g. Full Gym Walkthrough" />
           </div>
           <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Video Source URL (YouTube/Vimeo) *</label>
              <input required type="url" value={vidUrl} onChange={e => setVidUrl(e.target.value)} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="https://..." />
           </div>
           <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Thumbnail Link (Optional)</label>
              <input type="url" value={vidThumb} onChange={e => setVidThumb(e.target.value)} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="https://..." />
           </div>
           <button type="submit" disabled={isSubmitting} className="w-full bg-info text-ink font-bold py-3 rounded-full mt-4 flex justify-center hover:bg-info">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Video'}</button>
        </form>
      </Sheet>
    </div>
  );
};

export default GalleryTab;
