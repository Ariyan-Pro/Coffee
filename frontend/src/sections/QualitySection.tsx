import { Container, Eyebrow, Reveal } from "@/components/ui/primitives";
import { qualityClaims } from "@/data/content";

/**
 * Quality & freshness — an editorial list, not a card grid.
 */
export function QualitySection() {
  return (
    <section className="section-space bg-paper-2">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Statement panel */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <Eyebrow>Quality & freshness</Eyebrow>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="t-heading-xl balance mt-6">
                  Freshness is the whole point.
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="t-body-l pretty mt-6 text-ink-2">
                  Flavour fades in weeks, not months. So we run this business
                  backwards to normal coffee retail: we roast after you order,
                  not before a warehouse fills up.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                {/* roast-date chip — factual */}
                <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-bronze/30 bg-cream px-5 py-2.5">
                  <span aria-hidden className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bronze/50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-bronze" />
                  </span>
                  <span className="t-caption font-semibold tracking-wide text-ink">
                    Roast date printed on every bag
                  </span>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Claims list */}
          <div className="lg:col-span-7">
            <ol className="border-t border-line">
              {qualityClaims.map((claim, i) => (
                <Reveal key={claim.title} delay={0.05 * i}>
                  <li className="group flex gap-6 border-b border-line py-8 md:gap-10">
                    <span className="font-display text-3xl font-medium text-bronze/60 transition-colors group-hover:text-bronze">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-medium tracking-tight">{claim.title}</h3>
                      <p className="t-body-m pretty mt-2 max-w-lg text-ink-2">{claim.copy}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
