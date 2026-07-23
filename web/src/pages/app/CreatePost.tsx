import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../lib/posts';

export function CreatePost() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).slice(0, 10);
    setFiles(picked);
    setPreviews(picked.map((f) => URL.createObjectURL(f)));
  };

  const onSubmit = async () => {
    if (files.length === 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await createPost({ files, caption, location: location.trim() || undefined });
      navigate(`/app/p/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the post.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <h1 className="mb-4 text-lg font-bold">New post</h1>

      <label className="mb-4 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface text-text-muted transition hover:bg-white/5">
        {previews.length > 0 ? (
          <img src={previews[0]} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm">Tap to choose photos (up to 10)</span>
        )}
        <input type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      </label>

      {previews.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {previews.map((p, i) => (
            <img key={i} src={p} alt={`Selected ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      ) : null}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption…"
        rows={3}
        className="mb-3 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand-magenta"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Add location"
        className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-magenta"
      />

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={files.length === 0 || submitting}
        className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white transition disabled:opacity-50"
      >
        {submitting ? 'Sharing…' : 'Share'}
      </button>
    </div>
  );
}
