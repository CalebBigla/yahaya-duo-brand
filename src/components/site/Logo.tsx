import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/logo-mark.png";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Yahaya Travel and Trade Co Ltd — home">
      <img src={logoMark} alt="" width={40} height={40} className="h-9 w-9 object-contain" />
      <span className="leading-none">
        <span
          className={`block font-display text-lg font-extrabold tracking-[0.18em] ${
            variant === "dark" ? "text-primary-foreground" : "text-primary"
          }`}
        >
          YAHAYA
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
          Travel &amp; Trade
        </span>
      </span>
    </Link>
  );
}
