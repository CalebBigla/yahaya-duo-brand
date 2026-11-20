import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ResponsiveImage, type ResponsiveSource } from "./ResponsiveImage";

/**
 * Editorial image card: 4:5 photo, serif title, one line of description, optional
 * call to action. The whole card is one link with a visible focus ring. Hover: the
 * photo scales to 1.03 over 500ms and the title underlines.
 */
export function EditorialCard({
  image,
  title,
  description,
  cta,
  to,
  hash,
  search,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  aspect = "aspect-[4/5]",
  eyebrow,
}: {
  image: ResponsiveSource;
  title: string;
  description?: ReactNode;
  cta?: string;
  /** Route path, e.g. "/travel". */
  to: string;
  hash?: string;
  /** Query string values, e.g. to pre-fill the enquiry flow. */
  search?: Record<string, string>;
  sizes?: string;
  aspect?: string;
  eyebrow?: string;
}) {
  return (
    <Link
      to={to}
      {...(hash ? { hash } : {})}
      {...(search ? { search: search as never } : {})}
      className="group block rounded-lg focus-visible:outline-offset-4"
    >
      <div className={`overflow-hidden rounded-lg bg-secondary ${aspect}`}>
        <ResponsiveImage
          image={image}
          alt=""
          sizes={sizes}
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      <div className="mt-5">
        {eyebrow && <p className="t-eyebrow text-accent-ink">{eyebrow}</p>}
        <h3 className={`t-h3 text-primary ${eyebrow ? "mt-2" : ""}`}>
          <span className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat bg-[linear-gradient(currentColor,currentColor)] transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">
            {title}
          </span>
        </h3>
        {description && <p className="t-body mt-2 text-muted-foreground">{description}</p>}
        {cta && (
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
      </div>
    </Link>
  );
}
