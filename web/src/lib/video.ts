/**
 * Reads what a reel needs from a picked video file, in the browser: its size,
 * duration and a JPEG cover frame. Mobile players show the cover while the
 * video loads; without one a reel is a black box until playback starts.
 */
export interface VideoInfo {
  width: number;
  height: number;
  durationMs: number;
  /** JPEG frame from ~0.5 s in; null when the browser cannot decode the file. */
  thumbnail: Blob | null;
}

/** Same cap as storage.rules (posts/{uid}/… < 50 MB). */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function readVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    let settled = false;
    const done = (info: VideoInfo) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(info);
    };

    video.onerror = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      reject(new Error('This video format cannot be read. Try an MP4 file.'));
    };

    video.onloadedmetadata = () => {
      const base = {
        width: video.videoWidth || 1080,
        height: video.videoHeight || 1920,
        durationMs: Math.max(1, Math.round((video.duration || 0) * 1000)),
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        // Covers are shown small; 720 px on the long edge is plenty.
        const scale = Math.min(1, 720 / Math.max(base.width, base.height));
        canvas.width = Math.round(base.width * scale);
        canvas.height = Math.round(base.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          done({ ...base, thumbnail: null });
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => done({ ...base, thumbnail: blob }), 'image/jpeg', 0.8);
      };
      // Some browsers never fire `seeked` for a metadata-only load; post
      // without a cover rather than hang the Share button.
      window.setTimeout(() => done({ ...base, thumbnail: null }), 5000);
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
  });
}
