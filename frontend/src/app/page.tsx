import type { Metadata } from "next";
import { Hero } from "@/components/hero/Hero";
import { BrandProposition } from "@/sections/BrandProposition";
import { HowItWorks } from "@/sections/HowItWorks";
import { FeaturedCoffee } from "@/sections/FeaturedCoffee";
import { SubscriptionExperience } from "@/sections/SubscriptionExperience";
import { OriginStory } from "@/sections/OriginStory";
import { QualitySection } from "@/sections/QualitySection";
import { DeliverySection } from "@/sections/DeliverySection";
import { FAQSection } from "@/sections/FAQSection";
import { FinalCTA } from "@/sections/FinalCTA";
import { BronzeRule } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/data/site";
import { products } from "@/data/products";
import { faqItems } from "@/data/content";

export const metadata: Metadata = {
  title: "Premium Coffee, Delivered Fresh | EMBER",
  description: site.description,
  alternates: { canonical: site.url },
  openGraph: {
    title: "Premium Coffee, Delivered Fresh | EMBER",
    description: site.description,
    url: site.url,
    type: "website",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EMBER",
  url: site.url,
  description: site.description,
  sameAs: [site.url],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EMBER",
  url: site.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/coffee?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const productsLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.name,
    url: `${site.url}/coffee/${p.slug}`,
  })),
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={[orgLd, websiteLd, productsLd, faqLd]} />
      <Hero />
      <BrandProposition />
      <HowItWorks />
      <FeaturedCoffee />
      <SubscriptionExperience />
      <OriginStory />
      <QualitySection />
      <BronzeRule className="bg-paper" />
      <DeliverySection />
      <BronzeRule className="bg-paper" />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
