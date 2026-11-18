import type {
  Metadata,
  Viewport,
} from "next";
import {
  IBM_Plex_Sans,
  Instrument_Sans,
} from "next/font/google";
import { SiteFooter } from "@/shared/components/layout/SiteFooter";
import { SiteHeader } from "@/shared/components/layout/SiteHeader";
import { Providers } from "@/shared/components/providers";
import { CtaBand } from "@/shared/components/sections/CtaBand";
import { SupportPill } from "@/shared/components/sections/SupportPill";
import { JsonLd } from "@/shared/seo/JsonLd";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  THEME_COLOR,
} from "@/shared/seo/site";
import "@/shared/global.css";

/** UI font for all text (Figma: Instrument Sans 400–700). */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: [
    "400",
    "500",
    "600",
    "700",
  ],
  variable: "--font-instrument",
  display: "swap",
});

/** Secondary font used in a few Figma spots. */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: [
    "400",
    "500",
  ],
  variable: "--font-ibm-plex",
  display: "swap",
  preload: false,
});

/** Site-wide defaults; each page sets its own title, description and canonical URL. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Modern fleet management built for Africa`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_NG",
    url: "/",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: THEME_COLOR };

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      "name": SITE_NAME,
      "url": absoluteUrl("/"),
      "logo": absoluteUrl("/brand/logo.png"),
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      "name": SITE_NAME,
      "url": absoluteUrl("/"),
      "publisher": { "@id": absoluteUrl("/#organization") },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${ibmPlexSans.variable}`}
    >
      <body>
        <Providers>
          <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip text-foreground">
            <SiteHeader />
            <main className="flex-1 pt-20">{children}</main>
            <CtaBand />
            <SiteFooter />
            <SupportPill />
          </div>
        </Providers>
        <JsonLd data={ORGANIZATION_JSON_LD} />
      </body>
    </html>
  );
}
