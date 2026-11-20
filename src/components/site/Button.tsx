import type { ComponentProps, ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Public-site buttons. Primary = navy fill; secondary = navy outline; onDark* for
 * navy sections; text = an underline that draws in. Press state scales to 0.98,
 * no hover lift. Every button is at least 44x44px.
 */
export type ButtonVariant = "primary" | "secondary" | "onDark" | "onDarkSecondary" | "text" | "textOnDark";

const base =
  "btn-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-6 text-[0.9375rem] font-semibold tracking-[0.01em] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: `${base} bg-primary text-primary-foreground hover:bg-primary-deep`,
  secondary: `${base} border border-primary/30 text-primary hover:border-primary`,
  onDark: `${base} bg-ivory text-primary hover:bg-white`,
  onDarkSecondary: `${base} border border-ivory/40 text-ivory hover:border-ivory`,
  text: "link-draw inline-flex min-h-11 items-center gap-2 font-semibold text-primary",
  textOnDark: "link-draw inline-flex min-h-11 items-center gap-2 font-semibold text-ivory",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `${variants[variant]} ${className}`.trim();
}

type LinkProps = ComponentProps<typeof Link>;

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: Omit<LinkProps, "className" | "children"> & { variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return (
    <Link {...props} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  variant = "primary",
  className,
  external,
  ...props
}: ComponentProps<"a"> & { variant?: ButtonVariant; external?: boolean }) {
  return (
    <a
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={buttonClass(variant, className)}
    />
  );
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type="button" {...props} className={buttonClass(variant, className)} />;
}
