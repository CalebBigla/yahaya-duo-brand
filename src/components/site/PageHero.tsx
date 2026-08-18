export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="bg-primary-deep py-16 text-primary-foreground sm:py-20">
      <div className="container-page max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/75 sm:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
