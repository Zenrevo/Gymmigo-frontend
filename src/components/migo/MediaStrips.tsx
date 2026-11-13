import { useState } from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { Button, Sheet, Tag, Text } from '../kit';
import type { ExerciseMedia, YouTubeVideo } from '../../types/ai';
import { openExternal } from '../../lib/migo/links';
import { exerciseMeta, https, mediaUrl, youtubeUrl } from '../../lib/migo/media';

/** Exercise image (GIF demo) with a branded placeholder when missing or broken. */
export function ExerciseImage({ src, className = '' }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-surface-sunken ${className}`}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-soft to-surface-sunken">
          <Dumbbell size={22} className="text-accent-text" />
        </div>
      )}
    </div>
  );
}

/** Full-size demo of one exercise with a YouTube link. */
export function ExercisePreview({ exercise, onClose }: { exercise: ExerciseMedia | null; onClose: () => void }) {
  const yt = exercise ? youtubeUrl(exercise) : null;
  return (
    <Sheet open={!!exercise} onClose={onClose} title={exercise?.name ?? 'Exercise'} eyebrow="Exercise demo">
      {exercise ? (
        <div className="flex flex-col gap-4">
          <ExerciseImage src={mediaUrl(exercise)} className="aspect-square w-full rounded-gm-xl" />
          {exercise.exercise_db?.instructions?.[0] ? <Text tone="muted">{exercise.exercise_db.instructions[0]}</Text> : null}
          {yt ? <Button label="Watch on YouTube" icon={Play} onClick={() => void openExternal(yt)} /> : null}
        </div>
      ) : null}
    </Sheet>
  );
}

/** "Exercise demos" carousel. */
export function ExerciseStrip({ exercises }: { exercises: ExerciseMedia[] }) {
  const [open, setOpen] = useState<ExerciseMedia | null>(null);
  if (!exercises.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <Text variant="label" tone="subtle">
        Exercise demos · {exercises.length}
      </Text>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {exercises.map((e, i) => {
          const meta = exerciseMeta(e);
          return (
            <button key={`${e.name}-${i}`} type="button" onClick={() => setOpen(e)} className="w-40 shrink-0 snap-start text-left">
              <ExerciseImage src={mediaUrl(e)} className="h-28 w-40 rounded-gm-lg" />
              <Text variant="subtitle" truncate className="mt-1.5">
                {e.name}
              </Text>
              {e.sets || e.reps ? (
                <Text variant="caption" tone="accent">
                  {[e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`].filter(Boolean).join(' × ')}
                </Text>
              ) : null}
              {meta.target || meta.equipment ? <Tag className="mt-1" parts={[meta.target, meta.equipment]} /> : null}
            </button>
          );
        })}
      </div>
      <ExercisePreview exercise={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function VideoStrip({ videos }: { videos: YouTubeVideo[] }) {
  const list = videos.filter(v => v && (v.url || v.title)).slice(0, 6);
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <Text variant="label" tone="subtle">
        Recommended videos
      </Text>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {list.map((v, i) => (
          <button key={`${v.url ?? v.title}-${i}`} type="button" onClick={() => v.url && void openExternal(v.url)} className="w-56 shrink-0 snap-start text-left">
            <div className="relative h-32 w-56 overflow-hidden rounded-gm-lg bg-surface-sunken">
              {v.thumbnail ? <img src={https(v.thumbnail)!} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-gm-md bg-[#1C1C21] text-white">
                  <Play size={18} fill="currentColor" />
                </span>
              </span>
            </div>
            <Text variant="callout" className="mt-1.5 line-clamp-2">
              {v.title || v.query || 'Watch video'}
            </Text>
            {v.channel ? (
              <Text variant="caption" tone="subtle" truncate>
                {v.channel}
              </Text>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
