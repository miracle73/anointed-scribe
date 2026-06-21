import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { KeyBanner } from "@/components/key-banner";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Scribe — Write your book in your own voice",
  description:
    "An AI writing assistant for apostolic, prophetic and Spirit-filled authors. It learns your voice, then writes your manuscript as a ghostwriter who has studied you for years.",
  openGraph: {
    title: "The Scribe — Write your book in your own voice",
    description:
      "An AI ghostwriter for Christian authors. Captures your Voice DNA, then drafts manuscripts that sound unmistakably like you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "#8a6420", colorBackground: "#fffdf8", fontFamily: "var(--font-inter)" } }}
    >
      <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
        <body className="paper min-h-full flex flex-col">
          <KeyBanner />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
