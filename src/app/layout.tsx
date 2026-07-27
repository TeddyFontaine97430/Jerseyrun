import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
