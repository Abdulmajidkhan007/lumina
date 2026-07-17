import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

type RevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delayMs?: number;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Wraps content in a scroll-triggered fade/slide-in animation, rendered as
 * whichever semantic tag `as` specifies (defaults to `div`). All other props
 * are forwarded to the underlying element, so callers can pass native
 * attributes (aria-*, onSubmit, etc.) directly.
 * Falls back to always-visible when IntersectionObserver is unavailable
 * or when the user prefers reduced motion (handled in CSS).
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  delayMs = 0,
  ...rest
}: RevealProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const { ref, visible } = useScrollReveal<HTMLElement>();

  return (
    <Component
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}
