import React from "react";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImpacAnalyzer",
  description: "Intelligent Test Impact Analysis",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased font-sans bg-black`}
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-sans !bg-neutral-900 !border-neutral-800 !shadow-xl !rounded-lg !p-4",
            style: {
              background: "#171717",
              color: "#e5e5e5",
              border: "1px solid #262626",
            },
          }}
        />
      </body>
    </html>
  );
}
