import type { Metadata } from "next";
import { Container, Eyebrow, Reveal } from "@/components/ui/primitives";
import { ProductGrid } from "@/components/products/ProductGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { products } from "@/data/products";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Shop Coffee",
  description:
    "Six traceable single-origin coffees from Ethiopia, Colombia, Indonesia, Kenya, Brazil and Guatemala, roasted to order in Pakistan.",
  alternates: { canonical: `${site.url}/coffee` },
  openGraph: {
    title: "Shop Coffee | EMBER",
    description:
      "Six traceable single-origin coffees, roasted to order and delivered fresh across Pakistan.",
    url: `${site.url}/coffee`,
    type: "website",
  },
};

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.name,
    url: `${site.url}/coffee/${p.slug}`,
  })),
};

export default function CoffeePage() {
  return (
    <div className="section-space-sm bg-paper pt-32">
      <JsonLd data={itemListLd} />
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>Shop coffee</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="t-display-l balance mt-6">Six lots. Six origins. One standard.</h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="t-body-l pretty mt-6 text-ink-2">
              Every bag is roasted to order after you confirm, sealed with the
              roast date, and dispatched within 48 hours.
            </p>
          </Reveal>
        </div>

        <div className="mt-14">
          <ProductGrid products={products} />
        </div>
      </Container>
    </div>
  );
}
