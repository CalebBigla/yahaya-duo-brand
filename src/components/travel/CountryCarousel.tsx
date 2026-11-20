import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EditorialCard } from "@/components/site/EditorialCard";
import { images } from "@/lib/images";
import type { ResponsiveSource } from "@/components/site/ResponsiveImage";

const destinations: Array<{ name: string; image: ResponsiveSource }> = [
  { name: "Saudi Arabia", image: images.journeyUmrah },
  { name: "Dubai", image: images.journeyDubai },
  { name: "Turkey", image: images.journeyIstanbul },
  { name: "Egypt", image: images.journeyEgypt },
  { name: "Qatar", image: images.destinationQatar },
  { name: "China", image: images.destinationChina },
];

/**
 * Destinations as a horizontal rail of editorial cards. Native scrolling gives swipe
 * on touch and arrow-key scrolling when the rail has focus; there is no autoplay.
 */
export function CountryCarousel() {
  const rail = useRef<HTMLUListElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 32 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  const control =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 text-primary transition-colors hover:border-primary";

  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        <button type="button" className={control} onClick={() => scrollBy(-1)} aria-label="Previous destinations">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <button type="button" className={control} onClick={() => scrollBy(1)} aria-label="Next destinations">
          <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      <ul
        ref={rail}
        tabIndex={0}
        aria-label="Destinations"
        className="-mx-5 flex snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth scroll-px-5 px-5 pb-4 [scrollbar-width:thin] sm:mx-0 sm:scroll-px-0 sm:px-0 motion-reduce:scroll-auto"
      >
        {destinations.map((d) => (
          <li key={d.name} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[30%]">
            <EditorialCard
              image={d.image}
              title={d.name}
              cta="Enquire"
              to="/quote"
              search={{ desk: "travel", topic: d.name }}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
