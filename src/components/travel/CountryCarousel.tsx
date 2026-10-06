import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import country images
import turkeyImg from '@/assets/Turkey.jpg';
import dubaiImg from '@/assets/Dubai.jpg';
import egyptImg from '@/assets/Egypt.jpg';
import qatarImg from '@/assets/qatar beuty.jpg';
import chinaImg from '@/assets/Chinese beauty.jpg';
import saudiImg from '@/assets/Saudi Arabia beauty.jpg';

interface CountryDestination {
  name: string;
  image: string;
  alt: string;
}

const destinations: CountryDestination[] = [
  {
    name: 'Turkey',
    image: turkeyImg,
    alt: 'Scenic Turkish landscape',
  },
  {
    name: 'Dubai',
    image: dubaiImg,
    alt: 'Modern Dubai skyline',
  },
  {
    name: 'Egypt',
    image: egyptImg,
    alt: 'Historic Egyptian landmarks',
  },
  {
    name: 'Qatar',
    image: qatarImg,
    alt: 'Beautiful Qatar architecture',
  },
  {
    name: 'China',
    image: chinaImg,
    alt: 'Beautiful Chinese landscape and culture',
  },
  {
    name: 'Saudi Arabia',
    image: saudiImg,
    alt: 'Saudi Arabian architecture and beauty',
  },
];

export function CountryCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {destinations.map((destination, index) => (
            <div
              key={destination.name}
              className="relative min-w-0 flex-[0_0_85%] sm:flex-[0_0_48%] lg:flex-[0_0_24%]"
            >
              <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500 hover:shadow-2xl">
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
                </div>

                {/* Country Name Overlay */}
                <div className="absolute inset-0 flex items-end p-6">
                  <h3 className="text-3xl font-bold text-white transition-all duration-500 group-hover:scale-110 group-hover:text-accent">
                    {destination.name}
                  </h3>
                </div>

                {/* Hover Effect Ring */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-500 group-hover:ring-accent/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Desktop */}
      <div className="hidden md:block">
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-3 shadow-xl transition-all hover:bg-accent hover:text-white disabled:opacity-0 disabled:pointer-events-none"
          aria-label="Previous destinations"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full bg-white p-3 shadow-xl transition-all hover:bg-accent hover:text-white disabled:opacity-0 disabled:pointer-events-none"
          aria-label="Next destinations"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {destinations.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? 'w-8 bg-accent'
                : 'w-2 bg-gray-300 hover:bg-accent/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
