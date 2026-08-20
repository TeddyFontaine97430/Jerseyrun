import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PushRegistration } from "@/components/PushRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jerseyrun.re";
const siteTitle = "Jersey Run — La boutique officielle des clubs sportifs";
const siteDescription =
  "Jersey Run réunit les boutiques de plusieurs clubs sportifs de La Réunion : maillots, équipements et goodies officiels, au même endroit.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s — Jersey Run",
  },
  description: siteDescription,
  keywords: [
    "Jersey Run",
    "maillots club sportif",
    "boutique club sportif",
    "équipement sportif Réunion",
    "maillot rugby",
    "maillot football",
    "boutique en ligne club",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Jersey Run",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/hero-banner.png", width: 1408, height: 768, alt: "Jersey Run" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/hero-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "DpwLtyonO2j_VLgCcIHEoI2KkLDi4eut37RZ7r0WP5k",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Jersey Run",
  url: siteUrl,
  logo: `${siteUrl}/logo-wordmark.png`,
  description: siteDescription,
  address: {
    "@type": "PostalAddress",
    streetAddress: "28 chemin Saint Expédit",
    postalCode: "97430",
    addressLocality: "Le Tampon",
    addressRegion: "La Réunion",
    addressCountry: "FR",
  },
  sameAs: ["https://www.facebook.com/p/Jersey-run-cr%C3%A9ation-100082974560526/"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jersey Run",
  url: siteUrl,
  inLanguage: "fr-FR",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-54J49SY4WG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-54J49SY4WG');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <PushRegistration />
        <Analytics />
      </body>
    </html>
  );
}
