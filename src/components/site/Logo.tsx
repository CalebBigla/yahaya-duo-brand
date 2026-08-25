import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/Log.png";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <Link to="/" className="flex items-center gap-2 sm:gap-3" aria-label="Yahaya Travel and Trade Co Ltd — home">
      <img 
        src={logoMark} 
        alt="" 
        width={60} 
        height={60} 
        className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain grayscale" 
        style={{ filter: 'grayscale(100%)' }}
      />
      <span className="leading-none">
        <span
          className={`block font-display text-base sm:text-lg md:text-xl font-extrabold tracking-[0.18em] ${
            variant === "dark" ? "text-primary-foreground" : "text-primary"
          }`}
        >
          YAHAYA
        </span>
        <span className="mt-0.5 sm:mt-1 block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Travel &amp; Trade Co LTD
        </span>
      </span>
    </Link>
  );
}
