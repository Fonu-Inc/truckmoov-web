import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/ui/components/nav-bar";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Truckmoov",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} h-dvh antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col text-foreground">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
