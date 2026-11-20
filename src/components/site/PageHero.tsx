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
    <section className="gradient-mesh relative isolate bg-primary-deep py-14 text-primary-foreground sm:py-20">
      <div className="container-page relative">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-on-dark animate-fade-up">{eyebrow}</p>
          <h1 className="animate-fade-up stagger-2 mt-4 text-3xl font-bold leading-[1.1] sm:text-5xl">{title}</h1>
          <p className="animate-fade-up stagger-3 mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
