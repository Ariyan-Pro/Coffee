import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Reveal, Button, IconArrow } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductBag, productArtConfigs } from "@/components/art/ProductBag";
import { Bean } from "@/components/art/art";
import { getProductBySlug, products } from "@/data/products";
import { site } from "@/data/site";
import { ROAST_META, type RoastLevel } from "@/types/domain";
import { formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Coffee not found" };
  const url = `${site.url}/coffee/${product.slug}`;
  return {
    title: product.name,
    description: product.summary ?? product.description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.name} | EMBER`,
      description: `${product.summary ?? ""} ${product.weight_grams}g, ${ROAST_META[product.roast_level].label} roast, ${formatPrice(product.price_per_unit)}.`,
      url,
      type: "website",
    },
  };
}

function RoastScale({ level }: { level: RoastLevel }) {
  const meta = ROAST_META[level];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="t-label text-[0.62rem] text-ink-3">Roast</span>
        <span className="t-caption font-semibold text-ink">{meta.label}</span>
      </div>
      <div className="mt-2 flex gap-1.5" role="img" aria-label={`Roast level: ${meta.label}. ${meta.description}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              background: i < Math.round(meta.intensity * 4) ? "var(--color-bronze)" : "var(--color-line)",
            }}
          />
        ))}
      </div>
      <p className="t-caption mt-2 text-ink-3">{meta.description}</p>
    </div>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const art = productArtConfigs[product.slug];
  const metaRows: Array<{ k: string; v: string }> = [
    { k: "Origin", v: product.origin_country },
    { k: "Region", v: product.region ?? "Not listed" },
    { k: "Farm / station", v: product.farm ?? "Not listed" },
    { k: "Altitude", v: product.altitude_m ? `${product.altitude_m.toLocaleString()} m` : "Not listed" },
    { k: "Process", v: product.processing_method ?? "Not listed" },
    { k: "Roast", v: ROAST_META[product.roast_level].label },
  ];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary ?? product.description ?? undefined,
    image: `${site.url}/coffee/${product.slug}`,
    brand: { "@type": "Brand", name: "EMBER" },
    countryOfOrigin: product.origin_country,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price_per_unit,
      availability: "https://schema.org/InStock",
      url: `${site.url}/coffee/${product.slug}`,
    },
  };

  return (
    <div className="section-space-sm bg-paper pt-28">
      <JsonLd data={productLd} />
      <Container>
        {/* breadcrumb */}
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center gap-2 text-[0.78rem] text-ink-3">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/coffee" className="transition-colors hover:text-ink">Coffee</Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-ink">{product.name}</li>
            </ol>
          </nav>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Gallery */}
          <div className="lg:col-span-6">
            <Reveal>
              <div
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-2 p-10"
                style={
                  art ? { background: `radial-gradient(80% 80% at 50% 40%, ${art.glow} 0%, transparent 65%)` } : undefined
                }
              >
                <ProductBag product={product} className="h-full w-auto" />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-cream p-4 text-center">
                  <Bean className="h-6 w-6" />
                  <span className="t-caption text-ink-2">{product.weight_grams}g net</span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-cream p-4 text-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-bronze" fill="none" aria-hidden>
                    <path d="M4 7h12M6 7c0 6 5 9 12 9M8 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span className="t-caption text-ink-2">Whole bean or ground</span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-cream p-4 text-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-bronze" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span className="t-caption text-ink-2">Roasted to order</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Info */}
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow>{product.origin_country}</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="t-display-l balance mt-5">{product.name}</h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="t-body-l pretty mt-5 text-ink-2">{product.summary}</p>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="mt-8 flex items-center gap-6 border-y border-line py-5">
                <div>
                  <p className="t-heading-l font-display">{formatPrice(product.price_per_unit)}</p>
                  <p className="t-caption text-ink-3">per {product.weight_grams}g bag</p>
                </div>
                <span className="h-10 w-px bg-line" aria-hidden />
                <div>
                  <p className="t-body-s font-semibold text-ink">Subscribe and save</p>
                  <p className="t-caption text-ink-3">10-15% off every bag</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 space-y-6">
                <RoastScale level={product.roast_level} />
                <div>
                  <span className="t-label text-[0.62rem] text-ink-3">Tasting notes</span>
                  <ul className="mt-3 flex flex-wrap gap-2.5">
                    {product.flavor_notes.map((n) => (
                      <li
                        key={n}
                        className="rounded-full border border-bronze/30 bg-bronze/10 px-4 py-1.5 text-[0.8rem] font-medium text-bronze"
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.22}>
              <dl className="mt-8 divide-y divide-line border-t border-line">
                {metaRows.map((row) => (
                  <div key={row.k} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="t-caption text-ink-3">{row.k}</dt>
                    <dd className="t-body-s text-right font-medium text-ink">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href={`/subscribe?blend=${product.slug}`} size="lg">
                  Subscribe to this blend <IconArrow />
                </Button>
                <Button href="/coffee" size="lg" variant="secondary">
                  Browse all coffees
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="t-caption mt-6 text-ink-3">
                Dispatched within 48 hours of roasting. Free delivery on orders over Rs. 5,000.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Description */}
        <Reveal delay={0.1}>
          <div className="mx-auto mt-20 max-w-3xl border-t border-line pt-12 text-center">
            <p className="t-body-l pretty leading-8 text-ink-2">{product.description}</p>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
