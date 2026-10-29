import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Form Builder",
  description: "Build versioned forms, publish them, and collect submissions.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/30">
        <TRPCProvider>
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
              <Link href="/forms" className="font-semibold">
                Form Builder
              </Link>
              <Link
                href="/forms/new"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                New form
              </Link>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}
