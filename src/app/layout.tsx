import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://fulushouvideo.com"),
  title: {
    default: "FulushouVideo",
    template: "%s | FulushouVideo",
  },
  description:
    "FulushouVideo is an AI short drama and comic video production platform for script parsing, storyboard generation, hook copy, and video-ready outputs.",
  keywords: [
    "AI short drama generator",
    "AI comic video generator",
    "script to video",
    "storyboard generator",
    "short drama production",
    "FulushouVideo",
  ],
  openGraph: {
    title: "FulushouVideo",
    description:
      "AI short drama and comic video production platform for script parsing, storyboard generation, and structured video outputs.",
    url: "https://fulushouvideo.com",
    siteName: "FulushouVideo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FulushouVideo",
    description:
      "AI short drama and comic video production platform for script parsing, storyboard generation, and structured video outputs.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
