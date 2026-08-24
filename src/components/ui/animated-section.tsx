import { type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-in" | "scale" | "slide-left" | "slide-right";
}

const animationClasses = {
  "fade-up": "translate-y-8 opacity-0",
  "fade-in": "opacity-0",
  "scale": "scale-95 opacity-0",
  "slide-left": "-translate-x-8 opacity-0",
  "slide-right": "translate-x-8 opacity-0",
};

const activeClasses = {
  "fade-up": "translate-y-0 opacity-100",
  "fade-in": "opacity-100",
  "scale": "scale-100 opacity-100",
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
      className={`transition-all duration-700 ease-out ${
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
