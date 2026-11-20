import { type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-in" | "scale" | "slide-left" | "slide-right";
}

const animationClasses = {
  "fade-up": "translate-y-5 opacity-0",
  "fade-in": "opacity-0",
  "scale": "translate-y-3 scale-[0.98] opacity-0",
  "slide-left": "-translate-x-5 opacity-0",
  "slide-right": "translate-x-5 opacity-0",
};

const activeClasses = {
  "fade-up": "translate-y-0 opacity-100",
  "fade-in": "opacity-100",
  "scale": "translate-y-0 scale-100 opacity-100",
  "slide-left": "translate-x-0 opacity-100",
  "slide-right": "translate-x-0 opacity-100",
};

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        isVisible ? activeClasses[animation] : animationClasses[animation]
      } ${className}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
