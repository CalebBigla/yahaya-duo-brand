import { Map, Users, Clock, Shield, Calendar, CheckCircle2 } from 'lucide-react';

interface TourPackageFeature {
  title: string;
  description: string;
}

const tourPackages: TourPackageFeature[] = [
  {
    title: 'Complete Itinerary Planning',
    description: 'Flights, accommodation, airport transfers, and guided activities all coordinated seamlessly.',
  },
  {
    title: 'Visa Processing Included',
    description: 'We handle all visa requirements where applicable, so you can focus on the experience.',
  },
  {
    title: 'Group Coordination',
    description: 'Same itinerary for all travelers with dedicated group management and support.',
  },
  {
    title: 'Travel Insurance Options',
    description: 'Comprehensive coverage options to protect your investment and peace of mind.',
  },
  {
    title: 'On-Ground Support',
    description: 'Local contact number available for the entire duration of your trip.',
  },
  {
    title: 'Flexible Timelines',
    description: '4-6 weeks for visa-required packages, 2-3 weeks for visa-free destinations.',
  },
];

export function TourPackagesCards() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center rounded-full bg-accent-soft p-3 mb-4">
          <Map className="h-8 w-8 text-accent-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">Tour Packages</h2>
        <p className="mt-3 text-lg font-semibold text-accent-foreground/80">
          Complete travel experiences from start to finish
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Whether it's a corporate retreat, pilgrimage tour, or leisure vacation, we organize
          complete tour packages with every detail handled. One invoice, one point of contact,
          zero stress for you and your group.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tourPackages.map((feature, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-accent/50 hover:-translate-y-1"
          >
            {/* Accent line on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft/50 transition-colors duration-300 group-hover:bg-accent-soft">
                  <CheckCircle2 className="h-6 w-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-primary group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What You Need Section */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-accent" />
              <h3 className="text-lg font-bold text-primary">What You Need to Provide</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Group size and composition
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Preferred destination(s)
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Travel dates or preferred period
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Budget per person
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Specific activities or sites to include
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-accent" />
              <h3 className="text-lg font-bold text-primary">Timeline & Process</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              Allow 4–6 weeks for complete package arrangements, especially for groups requiring visas.
              For domestic packages or visa-free destinations, 2–3 weeks is typically sufficient.
            </p>
            <div className="rounded-lg border border-accent/30 bg-accent-soft/30 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 text-accent-foreground mt-0.5" />
                <p className="text-sm leading-relaxed text-foreground/80">
                  <strong className="text-accent-foreground">All-inclusive pricing:</strong> Receive
                  one itemized invoice covering all services. Everything is confirmed before you
                  commit, with full transparency on what's included.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Scenario */}
      <div className="rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent-soft/50 to-accent-soft/30 p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70 mb-2">
              Example Scenario
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              Organizing a corporate retreat to Ghana for 12 staff? We arrange round-trip flights
              from Abuja, 3 nights at a beach resort, airport transfers, a city tour, team dinner,
              and travel insurance — all itemized and confirmed before you commit. One invoice, one
              point of contact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
