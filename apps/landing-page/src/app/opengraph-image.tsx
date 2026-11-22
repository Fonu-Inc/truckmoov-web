import { ImageResponse } from "next/og";
import { BrandMark } from "@/shared/seo/BrandMark";
import { SITE_NAME } from "@/shared/seo/site";

// Static export has no server to render this card on demand.
export const dynamic = "force-static";

export const alt = `${SITE_NAME}: modern fleet management built for Africa`;
export const size = {
  width: 1200, height: 630,
};
export const contentType = "image/png";

/** Social share card used by every page (WhatsApp, Facebook, X, LinkedIn). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "radial-gradient(700px circle at 100% 0%, rgba(255,193,5,0.22), transparent 60%), linear-gradient(135deg, #000000 0%, #272727 100%)",
        color: "#ffffff",
      }}
    >
      <BrandMark size={140} />
      <div
        style={{
          marginTop: 48,
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {SITE_NAME}
      </div>
      <div style={{
        marginTop: 20, fontSize: 40, color: "#e5e5e5",
      }}
      >
        Modern Fleet Management Built for Africa
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 44,
          fontSize: 28,
          fontWeight: 700,
          color: "#ffc105",
        }}
      >
        Live tracking · Dispatch · Analytics · IoT SIMs & devices
      </div>
    </div>,
    size,
  );
}
