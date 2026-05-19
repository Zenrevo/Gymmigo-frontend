import { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

type ExerciseDbMedia = {
  gif_url?: string;
  image_url?: string;
  video_url?: string;
  youtube_url?: string;
  name?: string;
  body_parts?: string[];
  equipments?: string[];
  target_muscles?: string[];
  instructions?: string[];
};

export type WorkoutExerciseMedia = {
  name?: string;
  sets?: string | number;
  reps?: string | number;
  equipment?: string;
  target_muscle?: string;
  demo_gif_url?: string;
  demo_video_url?: string;
  gif_url?: string;
  image_url?: string;
  youtube_url?: string;
  exercise_db?: ExerciseDbMedia;
};

const youtubeThumbnailFromUrl = (url?: string) => {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
};

const getExerciseVideoUrl = (exercise: WorkoutExerciseMedia) => (
  exercise.exercise_db?.youtube_url ||
  exercise.exercise_db?.video_url ||
  exercise.demo_video_url ||
  exercise.youtube_url ||
  ''
);

const getExerciseMediaUrl = (exercise: WorkoutExerciseMedia) => (
  exercise.exercise_db?.gif_url ||
  exercise.exercise_db?.image_url ||
  exercise.demo_gif_url ||
  exercise.gif_url ||
  exercise.image_url ||
  youtubeThumbnailFromUrl(getExerciseVideoUrl(exercise)) ||
  ''
);

const getExerciseMeta = (exercise: WorkoutExerciseMedia) => {
  const db = exercise.exercise_db;
  return {
    target: exercise.target_muscle || db?.target_muscles?.[0] || db?.body_parts?.[0],
    equipment: exercise.equipment || db?.equipments?.[0],
  };
};

type Props = {
  exercises?: WorkoutExerciseMedia[];
  limit?: number;
  compact?: boolean;
};

export function WorkoutExerciseMediaGrid({ exercises = [], limit, compact = false }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const visibleExercises = typeof limit === 'number' ? exercises.slice(0, limit) : exercises;
  if (!visibleExercises.length) return null;

  return (
    <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
      {visibleExercises.map((exercise, index) => {
        const mediaUrl = getExerciseMediaUrl(exercise);
        const videoUrl = getExerciseVideoUrl(exercise);
        const { target, equipment } = getExerciseMeta(exercise);
        const firstInstruction = exercise.exercise_db?.instructions?.[0];

        return (
          <div
            key={`${exercise.name || 'exercise'}-${index}`}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
          >
            {mediaUrl ? (
              <div className="relative">
                <img
                  src={mediaUrl}
                  alt={`${exercise.name || 'Exercise'} demonstration`}
                  className={clsx(
                    "w-full object-cover bg-black/40 cursor-pointer hover:opacity-90 transition-opacity",
                    compact ? "h-24" : "h-44"
                  )}
                  loading="lazy"
                  onClick={() => setSelectedImage(mediaUrl)}
                />
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 rounded-full bg-red-600/95 p-1.5 text-white shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            ) : (
              <div className={compact ? "h-20 w-full bg-white/[0.03] flex items-center justify-center" : "h-32 w-full bg-white/[0.03] flex items-center justify-center"}>
                {videoUrl ? (
                  <a href={videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-red-300">
                    <PlayCircle className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Watch</span>
                  </a>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">No demo</span>
                )}
              </div>
            )}

            <div className={compact ? "p-3 space-y-1.5" : "p-4 space-y-2"}>
              <p className="text-sm font-black text-white capitalize leading-snug">{exercise.name || 'Exercise'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                {exercise.sets ? `${exercise.sets} sets` : 'Sets as planned'}
                {exercise.reps ? ` x ${exercise.reps}` : ''}
              </p>
              {(target || equipment) && (
                <div className="flex flex-wrap gap-1.5">
                  {target ? (
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-orange-300">
                      {target}
                    </span>
                  ) : null}
                  {equipment ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/45">
                      {equipment}
                    </span>
                  ) : null}
                </div>
              )}
              {!compact && firstInstruction ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-white/45">{firstInstruction}</p>
              ) : null}
            </div>
          </div>
        );
      })}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size demonstration" 
            className="max-w-full max-h-[85vh] rounded-xl object-contain border border-white/20"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
