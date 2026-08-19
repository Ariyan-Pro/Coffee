import type { Metadata } from "next";
import { Container, Eyebrow, Reveal, Heading, Button } from "@/components/ui/primitives";
import { originStory, qualityClaims } from "@/data/content";
import { products } from "@/data/products";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "EMBER is a Lahore roastery buying single-origin coffee directly from named farms and roasting it to order. Traceable, fresh, and delivered across Pakistan.",
  alternates: { canonical: `${site.url}/about` },
};

const buying = [
  {
    n: "01",
    t: "We buy directly, and we can name the farm",
    c: "Every lot is traceable to a washing station or estate: Idido in Ethiopia, El Diviso in Colombia, Kieni in Kenya. We buy year to year from the same sources, paying above commodity price for the lots that score highest at cupping.",
  },
  {
    n: "02",
    t: "We roast like a kitchen, not a warehouse",
    c: "No stock that sits waiting for a buyer. Your bag is roasted after you confirm, in small batches we can control, and sealed with a roast date you can read.",
  },
  {
    n: "03",
    t: "We ship so freshness survives the doorstep",
    c: "Despatched within 48 hours of roasting via national courier, with a free-delivery threshold of Rs. 5,000. The point of the entire chain is the cup you make at home.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Intro */}
      <section className="section-space-sm bg-paper pt-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Eyebrow>About EMBER</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="t-display-l balance mt-6">Fresh is the whole point.</h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="t-body-l pretty mt-6 text-ink-2">{originStory.intro}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* The story */}
      <section className="section-space-sm bg-cream">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>The story</Eyebrow>
                <Heading size="heading-xl" className="mt-5">
                  {originStory.headline}
                </Heading>
              </Reveal>
            </div>
            <div className="space-y-6 lg:col-span-8">
              {originStory.body.map((para, i) => (
                <Reveal key={i} delay={0.05 * i}>
                  <p className="t-body-l pretty leading-relaxed text-ink-2">{para}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Standards */}
      <section className="section-space-sm bg-paper">
        <Container>
          <Reveal>
            <div className="max-w-2xl">
              <Eyebrow>The standards</Eyebrow>
              <Heading size="heading-xl" className="mt-5">
                Four rules we will not break.
              </Heading>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {qualityClaims.map((q, i) => (
              <Reveal key={q.title} delay={0.06 * i} className="h-full">
                <div className="flex h-full flex-col gap-3 bg-cream p-7">
                  <span className="t-label text-bronze">0{i + 1}</span>
                  <h3 className="font-display text-xl font-medium tracking-tight text-ink">{q.title}</h3>
                  <p className="t-body-m pretty text-ink-2">{q.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section className="section-space-sm bg-mocha text-paper">
        <Container>
          <Reveal>
            <div className="max-w-2xl">
              <Eyebrow dark>How we work</Eyebrow>
              <Heading size="heading-xl" className="mt-5 text-paper">
                Farm, roastery, doorstep.
              </Heading>
            </div>
          </Reveal>
          <ol className="mt-12 space-y-0">
            {buying.map((b, i) => (
              <Reveal key={b.n} delay={0.05 * i}>
                <li className="grid gap-4 border-t border-paper/15 py-8 md:grid-cols-12 md:gap-8">
                  <span className="t-label pt-1 text-bronze-2 md:col-span-1">{b.n}</span>
                  <h3 className="font-display text-2xl font-medium tracking-tight md:col-span-5">
                    {b.t}
                  </h3>
                  <p className="t-body-m pretty text-paper/65 md:col-span-6">{b.c}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Lineup teaser */}
      <section className="section-space-sm bg-paper">
        <Container>
          <div className="rounded-lg border border-line bg-cream px-8 py-10 md:flex md:items-center md:justify-between md:gap-10 md:px-12">
            <div>
              <p className="t-label text-bronze">The lineup</p>
              <h2 className="t-heading-l mt-4">
                {products.length} single-origin lots, {products.length} stories.
              </h2>
              <p className="t-body-m pretty mt-3 max-w-xl text-ink-2">
                Each one roasted to order and shipped within 48 hours. Meet the beans.
              </p>
            </div>
            <div className="mt-8 shrink-0 md:mt-0">
              <Button href="/coffee" size="lg">
                Explore the coffees
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
