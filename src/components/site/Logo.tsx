import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/Log.webp";

/**
 * Brand lockup: the original navy-and-gold mark with the wordmark.
 * `light` = navy wordmark for ivory/white backgrounds; `dark` = ivory wordmark on navy.
 */
export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  const word = variant === "dark" ? "text-ivory" : "text-primary";
  const sub = variant === "dark" ? "text-on-navy-muted" : "text-muted-foreground";
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-sm"
      aria-label="Yahaya Travel and Trade Co Ltd, home"
    >
      <img
        src={logoMark}
        alt=""
        width={240}
        height={175}
        className="h-10 w-auto object-contain sm:h-11"
        decoding="async"
      />
      <span className="leading-none">
        <span className={`block font-display text-lg tracking-[0.14em] sm:text-xl ${word}`}>YAHAYA</span>
        <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px] ${sub}`}>
          Travel &amp; Trade Co Ltd
        </span>
      </span>
    </Link>
  );
}
