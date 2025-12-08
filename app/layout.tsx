import type { Metadata } from "next";
import Providers from "@/components/Providers";
import { googleAnalyticsId } from "@/lib/constants"; // CHANGED: Import
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Eazika - Shop Instantly, Live Effortlessly",
    template: "%s | Eazika",
  },
  description:
    "Experience the future of shopping with EAZIKA. Discover, order, and own your favorite products in just 10 minutes. Fast delivery, quality products, and seamless shopping experience in India.",
  keywords: [
    "Eazika",
    "Eazika India",
    "Eazika Shopping",
    "Fast Delivery",
    "Instant Shopping",
    "E-commerce India",
    "Shop Online India",
    "Quick Delivery Service",
    "Eazika App",
    "Eazika Products",
  ],
  authors: [{ name: "Eazika Team" }],
  creator: "Eazika",
  publisher: "Eazika",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://eazika.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Eazika - Shop Instantly, Live Effortlessly",
    description:
      "Experience the future of shopping with EAZIKA. Discover, order, and own your favorite products in just 10 minutes. Fast delivery, quality products, and seamless shopping experience in India.",
    url: "https://eazika.com",
    siteName: "Eazika",
    images: [
      {
        url: "https://eazika.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Eazika - Shop Instantly, Live Effortlessly",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
    yahoo: "your-yahoo-verification",
  },
  category: "technology",
  classification: "E-commerce, Shopping, Quick Commerce",
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Eazika",
    alternateName: "Eazika - Shop Instantly, Live Effortlessly",
    url: "https://eazika.com",
    logo: "https://eazika.com/logo.png",
    description:
      "EAZIKA is India's fastest e-commerce platform delivering groceries and essentials in just 10 minutes. Shop instantly, live effortlessly.",
    sameAs: ["https://www.instagram.com/eazika.india"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 8767731887",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Maharashtra",
      addressLocality: "Nagpur",
    },
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Eazika" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="color-scheme" content="light dark" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta
          name="theme-color"
          content="#FFFFFF"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#111827"
          media="(prefers-color-scheme: dark)"
        />

        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Preconnect to external domains */}
        {/* <link rel="preconnect" href="https://www.googletagmanager.com" /> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Google Analytics Script */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
            `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
