import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FulushouVideo",
  description: "FulushouVideo AI Drama & Comic Video Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

