// app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Property Calculator",
  description: "Global Property ROI & Tax Calculator (PWA)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light"> 
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />

        {/* Disable dark mode on mobile browsers */}
        <meta name="color-scheme" content="light" />
      </head>

      <body className="bg-white text-black">
        {children}
      </body>
    </html>
  );
}