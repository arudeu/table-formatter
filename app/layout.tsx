import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
// The stylesheet is processed by Next.js; TypeScript does not resolve CSS files here.
// @ts-expect-error CSS side-effect imports are handled by the Next.js build pipeline.
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLUSH — Table Formatter",
  description:
    "A tool to format tables for Markdown, HTML, and other formats. BLUSH is a free and open-source project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
