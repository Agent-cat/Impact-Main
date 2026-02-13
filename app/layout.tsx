import React from "react";
import type { Metadata } from "next";
import { Outfit, Oswald, Poppins } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Impact",
  description: "😇",
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
        className={`${outfit.variable} ${oswald.variable} ${poppins.variable} antialiased font-sans`}
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className:
              "font-sans !bg-white !border-gray-200 !shadow-xl !rounded-2xl !p-4",
            style: {
              background: "white",
              color: "#1a1a1a",
              border: "1px solid #E5E7EB",
            },
          }}
        />
      </body>
    </html>
  );
}
