import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/nav/Footer";
import { FloatingCTA } from "@/components/conversion/FloatingCTA";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { site } from "@/data/site";
import "@/styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Premium Coffee, Delivered Fresh | EMBER",
    template: "%s | EMBER",
  },
  description: site.description,
  applicationName: site.name,
  generator: undefined,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Premium Coffee, Delivered Fresh | EMBER",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Coffee, Delivered Fresh | EMBER",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-bronze focus:px-5 focus:py-2.5 focus:text-paper"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <FloatingCTA />
        <WhatsAppButton />
      </body>
    </html>
  );
}
