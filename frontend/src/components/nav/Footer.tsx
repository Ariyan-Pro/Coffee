import Link from "next/link";
import { site, whatsappLink } from "@/data/site";
import { products } from "@/data/products";
import { IconWhatsApp } from "@/components/ui/primitives";

const legal = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
];

export function Footer() {
  const wa = whatsappLink("Hi EMBER, I have a question about your coffee subscription.");
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-mocha text-paper">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-site relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
                <circle cx="32" cy="32" r="30" fill="#c29b63" />
                <ellipse cx="32" cy="32" rx="16" ry="10.5" transform="rotate(-24 32 32)" fill="#241b13" />
                <path
                  d="M 28 25 C 33 32 35 41 38 47"
                  fill="none"
                  stroke="#9c6b3a"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-display text-xl font-semibold tracking-[0.28em]">{site.name}</span>
            </div>
            <p className="t-body-m mt-5 max-w-sm text-paper/70">{site.tagline} Single-origin lots, roasted to order and delivered across Pakistan.</p>
            <p className="t-caption mt-6 text-paper/60">{site.contact.hours}</p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <h2 className="t-label text-bronze-2">Explore</h2>
            <ul className="mt-5 space-y-3">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="t-body-s text-paper/80 transition-colors hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="t-body-s text-paper/80 transition-colors hover:text-paper">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Coffee */}
          <div className="lg:col-span-3">
            <h2 className="t-label text-bronze-2">The Lineup</h2>
            <ul className="mt-5 space-y-3">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/coffee/${p.slug}`} className="t-body-s text-paper/80 transition-colors hover:text-paper">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h2 className="t-label text-bronze-2">Reach us</h2>
            <ul className="mt-5 space-y-3">
              {wa ? (
                <li>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-body-s inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-paper"
                  >
                    <IconWhatsApp className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
              ) : null}
              <li>
                <a href={`mailto:${site.contact.email}`} className="t-body-s text-paper/80 transition-colors hover:text-paper">
                  {site.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line-dark pt-8 md:flex-row md:items-center md:justify-between">
          <p className="t-caption text-paper/60">
            © {year} {site.name}. All rights reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Legal">
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="t-caption text-paper/60 transition-colors hover:text-paper/90">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
