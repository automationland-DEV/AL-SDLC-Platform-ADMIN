import { useState } from 'react';
import { resolveAvatarUrl, resolveAvatarFrameUrl } from '../../utils/avatar';

interface FramedAvatarProps {
  /** Avatar image URL */
  src?: string | null;
  /** Avatar frame identifier (catalog id) or full URL */
  frame?: string | null;
  /** Display name used for the fallback initial */
  name?: string | null;
  /** Tailwind sizing for the avatar circle */
  className?: string;
  /** Classes applied to the circular image itself */
  imageClassName?: string;
  /** Rendered when there is no avatar image */
  fallback?: React.ReactNode;
  alt?: string;
}

/**
 * Avatar renderer that overlays the animated GIF frame on the user's picture
 * whenever the user has one assigned.
 */
export default function FramedAvatar({
  src,
  frame,
  name,
  className = 'w-8 h-8',
  imageClassName = '',
  fallback,
  alt,
}: FramedAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [frameError, setFrameError] = useState(false);

  const avatarUrl = resolveAvatarUrl(src);
  const frameUrl = resolveAvatarFrameUrl(frame);

  const initial =
    name?.charAt(0).toUpperCase() || (fallback ?? <span>U</span>);

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={alt ?? name ?? 'Avatar'}
          className={`h-full w-full rounded-full object-cover ${imageClassName}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-mono-code font-bold text-xs">
          {initial}
        </div>
      )}
      {frameUrl && !frameError && (
        <img
          src={frameUrl}
          alt=""
          aria-hidden="true"
          className="absolute -inset-[18%] w-[136%] h-[136%] max-w-none pointer-events-none z-10 object-contain select-none"
          onError={() => setFrameError(true)}
        />
      )}
    </div>
  );
}
