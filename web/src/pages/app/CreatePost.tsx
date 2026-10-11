import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../lib/posts';
import { MAX_VIDEO_BYTES } from '../../lib/video';
import { useI18n } from '../../i18n';

const MAX_PHOTOS = 10;

/**
 * New post: up to 10 photos, or one video. A single video is also published
 * to Reels (lib/posts.ts writes the reel twin), like in the mobile app.
 */
export function CreatePost() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isVideo = files.length === 1 && files[0]?.type.startsWith('video/') === true;

  // Object URLs hold the file in memory until revoked.
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p)), [previews]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    setError('');
    if (picked.length === 0) return;
    const video = picked.find((f) => f.type.startsWith('video/'));
    let chosen: File[];
    if (video) {
      if (video.size >= MAX_VIDEO_BYTES) {
        setError(t('Video must be under 50 MB.'));
        return;
      }
      // A reel is one video; extra files in the same pick are ignored.
      chosen = [video];
      if (picked.length > 1) setError(t('A post can have one video or up to 10 photos — only the video was kept.'));
    } else {
      chosen = picked.slice(0, MAX_PHOTOS);
    }
    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
  };

  const onSubmit = async () => {
    if (files.length === 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await createPost({ files, caption, location: location.trim() || undefined });
      navigate(isVideo ? '/app/reels' : `/app/p/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t('Could not create the post.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <h1 className="mb-4 text-lg font-bold">{t('New post')}</h1>

      <label
        className={`mb-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface text-text-muted transition hover:bg-white/5 ${
          isVideo ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-square'
        }`}
      >
        {previews.length > 0 ? (
          isVideo ? (
            <video src={previews[0]} muted playsInline controls className="h-full w-full bg-black object-contain" />
          ) : (
            <img src={previews[0]} alt={t('Preview')} className="h-full w-full object-cover" />
          )
        ) : (
          <span className="px-6 text-center text-sm">
            {t('Tap to choose photos (up to 10) or one video')}
            <span className="mt-1 block text-xs text-text-faint">{t('A video post also appears in Reels')}</span>
          </span>
        )}
        <input type="file" accept="image/*,video/*" multiple onChange={onPick} className="hidden" />
      </label>

      {previews.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {previews.map((p, i) => (
            <img
              key={p}
              src={p}
              alt={t('Selected {n}', { n: i + 1 })}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={t('Write a caption…')}
        rows={3}
        className="mb-3 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand-magenta"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={t('Add location')}
        className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-magenta"
      />

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={files.length === 0 || submitting}
        className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white transition disabled:opacity-50"
      >
        {submitting ? (isVideo ? t('Uploading video…') : t('Sharing…')) : t('Share')}
      </button>
    </div>
  );
}
