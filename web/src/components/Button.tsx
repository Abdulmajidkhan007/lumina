import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-brand text-white shadow-lg shadow-brand-magenta/25 hover:scale-105 hover:shadow-brand-magenta/40',
  secondary:
    'border border-border bg-white/5 text-text hover:bg-white/10',
  ghost: 'text-text-muted hover:text-text',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-magenta';

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

type InternalLinkButtonProps = CommonProps &
  LinkProps & {
    kind: 'link';
  };

type ExternalLinkButtonProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    kind: 'anchor';
    href: string;
  };

type NativeButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    kind: 'button';
  };

export type ButtonProps = InternalLinkButtonProps | ExternalLinkButtonProps | NativeButtonProps;

/**
 * Shared CTA control. Renders a router `<Link>`, a plain `<a>`, or a native
 * `<button>` depending on `kind`, sharing one visual language across pages.
 */
export function Button(props: ButtonProps) {
  const { children, variant = 'primary', className = '' } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;

  if (props.kind === 'link') {
    const { kind: _kind, children: _children, variant: _variant, className: _cls, ...rest } = props;
    return (
      <Link className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (props.kind === 'anchor') {
    const { kind: _kind, children: _children, variant: _variant, className: _cls, ...rest } = props;
    return (
      <a className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const { kind: _kind, children: _children, variant: _variant, className: _cls, ...rest } = props;
  return (
    <button className={classes} type={props.type ?? 'button'} {...rest}>
      {children}
    </button>
  );
}
