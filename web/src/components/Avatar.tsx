interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

function initialsFrom(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}

/** Circular avatar image with a gradient-brand initials fallback when there's no `avatarUrl`. */
export function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-gradient-brand font-semibold text-white ${className}`}
    >
      {initialsFrom(name)}
    </div>
  );
}
