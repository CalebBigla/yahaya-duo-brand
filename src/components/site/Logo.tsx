import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/Log.png";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Yahaya Travel and Trade Co Ltd — home">
      <img 
        src={logoMark} 
        alt="" 
        width={60} 
        height={60} 
        className="h-14 w-14 object-contain grayscale" 
        style={{ filter: 'grayscale(100%)' }}
      />
      <span className="leading-none">
        <span
          className={`block font-display text-xl font-extrabold tracking-[0.18em] ${
            variant === "dark" ? "text-primary-foreground" : "text-primary"
          }`}
        >
          YAHAYA
        </span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Travel &amp; Trade Co LTD
        </span>
      </span>
    </Link>
  );
}
