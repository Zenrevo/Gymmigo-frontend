import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Image as ImageIcon, Video, Trash2, Link, Star, Loader2 } from 'lucide-react';
import axios from 'axios';
import Modal from '../../../components/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/images`, { image_url: imgUrl, is_primary: imgPrimary });
      await refetch();
      setImgModalOpen(false);
      setImgUrl(''); setImgPrimary(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteImage = async (id: string) => {
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/gym-owner/gyms/${gymId}/images/${id}`);
      await refetch();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/videos`, { video_url: vidUrl, thumbnail_url: vidThumb, title: vidTitle });
      await refetch();
      setVidModalOpen(false);
      setVidUrl(''); setVidThumb(''); setVidTitle('');
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteVideo = async (id: string) => {
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/gym-owner/gyms/${gymId}/videos/${id}`);
      await refetch();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-12">
      {/* IMAGES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
             <ImageIcon className="text-primary" /> PHOTO GALLERY
          </h3>
          <button onClick={() => setImgModalOpen(true)} className="btn-primary py-2 px-4 text-xs">+ Add Photo</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gym?.images?.map((img: any) => (
             <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img src={img.image_url} alt="Gym" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                   <div className="flex justify-end">
                     <button onClick={() => handleDeleteImage(img.id)} disabled={isSubmitting} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full backdrop-blur-md transition-colors disabled:opacity-50">
                       <Trash2 size={16} />
                     </button>
                   </div>
                   {img.is_primary && (
                     <div className="flex items-center gap-1 text-yellow-500 bg-black/60 w-fit px-2 py-1 rounded-md border border-white/10 backdrop-blur-md">
                        <Star size={12} className="fill-yellow-500" /> <span className="text-[10px] font-bold uppercase tracking-widest">Primary</span>
                     </div>
                   )}
                </div>
             </div>
          ))}
          {!gym?.images?.length && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl">
               <ImageIcon size={48} className="mx-auto text-white/20 mb-4" />
               <p className="text-white/40">No photos uploaded. Showcase your gym to attract members.</p>
            </div>
          )}
        </div>
      </section>

      {/* VIDEOS */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
             <Video className="text-blue-500" /> VIDEO TOURS
          </h3>
          <button onClick={() => setVidModalOpen(true)} className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 rounded-full font-bold text-xs transition-colors">+ Add Video</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {gym?.videos?.map((vid: any) => (
             <div key={vid.id} className="glass-card overflow-hidden group">
               <div className="aspect-video bg-black relative border-b border-white/10">
                 {vid.thumbnail_url ? (
                    <img src={vid.thumbnail_url} className="w-full h-full object-cover opacity-60" alt="" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Video size={48} className="text-white/10" />
                    </div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 pl-1 group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent" />
                    </div>
                 </div>
               </div>
               <div className="p-5 flex items-center justify-between">
                 <h5 className="font-bold truncate pr-4">{vid.title}</h5>
                 <button onClick={() => handleDeleteVideo(vid.id)} disabled={isSubmitting} className="text-white/40 hover:text-red-500 transition-colors p-2 shrink-0 disabled:opacity-50">
                    <Trash2 size={18} />
                 </button>
               </div>
             </div>
           ))}
           {!gym?.videos?.length && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl">
               <p className="text-white/40">Upload virtual tours, class highlights, or promotional videos.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <Modal isOpen={imgModalOpen} onClose={() => setImgModalOpen(false)} title="Upload Photo">
        <form onSubmit={handleAddImage} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2 flex items-center gap-2"><Link size={14}/> Image URL Hosting Link *</label>
              <input required type="url" value={imgUrl} onChange={e => setImgUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="https://..." />
           </div>
           <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
              <input type="checkbox" checked={imgPrimary} onChange={e => setImgPrimary(e.target.checked)} className="w-5 h-5 accent-yellow-500" />
              <div>
                <span className="text-sm font-bold text-yellow-500">Set as Primary Display Image</span>
                <p className="text-xs text-white/40">This will be the main cover photo for your gym listing.</p>
              </div>
           </label>
           <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3">{isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto"/> : 'Save Photo'}</button>
        </form>
      </Modal>

      <Modal isOpen={vidModalOpen} onClose={() => setVidModalOpen(false)} title="Add Video Tour">
        <form onSubmit={handleAddVideo} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Video Title *</label>
              <input required type="text" value={vidTitle} onChange={e => setVidTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="e.g. Full Gym Walkthrough" />
           </div>
           <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Video Source URL (YouTube/Vimeo) *</label>
              <input required type="url" value={vidUrl} onChange={e => setVidUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="https://..." />
           </div>
           <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Thumbnail Link (Optional)</label>
              <input type="url" value={vidThumb} onChange={e => setVidThumb(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="https://..." />
           </div>
           <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-full mt-4 flex justify-center hover:bg-blue-700">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Video'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default GalleryTab;
