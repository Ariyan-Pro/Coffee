import { Container, Reveal } from "@/components/ui/primitives";
import { products } from "@/data/products";

const facts = [
  {
    value: "48h",
    label: "From roast confirmation to dispatch",
  },
  {
    value: "6",
    label: "Traceable single-origin lots, cupped before listing",
  },
  {
    value: "Rs. 5,000",
    label: "Orders above this ship free across Pakistan",
  },
];

const flavorWords = Array.from(
  new Set(products.flatMap((p) => p.flavor_notes)),
);

export function BrandProposition() {
  return (
    <section className="section-space relative bg-paper">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal delay={0.08}>
              <h2 className="t-display-l balance">
                Coffee tastes like its origin,{" "}
                <span className="italic text-bronze">when it is young.</span>
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.15}>
              <p className="t-body-l pretty mt-10 text-ink-2 lg:mt-0 lg:pt-10">
                Most supermarket beans are months old before they reach the
                shelf, past their peak and blended flat. We skip the middle,
                buy single-origin lots at source, and roast after you order.
                Coffee this fresh is why it tastes different here.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Concrete facts */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal key={f.label} delay={0.06 * i} className="bg-cream">
              <div className="flex h-full flex-col gap-3 p-7 md:p-9">
                <span className="font-display text-4xl font-medium tracking-tight text-bronze md:text-5xl">
                  {f.value}
                </span>
                <span className="t-body-s text-ink-2">{f.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Flavor strip */}
      <div className="mt-20 overflow-hidden border-y border-line py-5" aria-hidden>
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[...flavorWords, ...flavorWords].map((word, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display text-2xl font-medium italic tracking-tight text-ink/70">
                {word}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-bronze/50" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
