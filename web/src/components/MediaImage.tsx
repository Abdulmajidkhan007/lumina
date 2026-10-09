import { useState, type ImgHTMLAttributes } from 'react';

/**
 * <img> that degrades to a neutral tile when the file cannot be shown —
 * deleted from Storage, or a format the browser cannot decode (iPhone HEIC).
 * Without it the feed showed the browser's broken-image glyph with the alt
 * text spilling across the card.
 */
export function MediaImage({ className, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt || 'Media unavailable'}
        className={`${className ?? ''} flex items-center justify-center bg-surface text-xs text-text-muted`}
      >
        Media unavailable
      </div>
    );
  }
  return <img {...props} alt={alt} className={className} onError={() => setFailed(true)} />;
}
