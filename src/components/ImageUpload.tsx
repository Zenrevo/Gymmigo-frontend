import { useState, useRef } from 'react';
import { Camera, Loader2, X, Plus } from 'lucide-react';
import { uploadToR2 } from '../utils/r2';
import { clsx } from 'clsx';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  className?: string;
}

const ImageUpload = ({ 
  onUploadComplete, 
  initialUrl, 
  label, 
  aspectRatio = 'square',
  className
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(initialUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    // Local preview
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const url = await uploadToR2(file);
      onUploadComplete(url);
      setPreview(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setPreview(initialUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onUploadComplete('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClasses = {
    square: 'aspect-square rounded-3xl',
    video: 'aspect-video rounded-2xl',
    banner: 'aspect-[2.5/1] rounded-2xl',
  };

  return (
    <div className={clsx("space-y-2", className)}>
      {label && <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">{label}</label>}
      
      <div 
        className={clsx(
          "relative group overflow-hidden bg-white/5 border border-white/10 hover:border-primary transition-all duration-500",
          aspectClasses[aspectRatio]
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Camera size={18} />
              </button>
              <button 
                type="button"
                onClick={handleRemove}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3 group-hover:text-primary transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Upload Photo</span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
             <Loader2 className="animate-spin text-primary" size={32} />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Uploading...</span>
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter ml-1">{error}</p>}
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

export default ImageUpload;
