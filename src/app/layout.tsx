import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

// If using next/font, define it here
const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'F1 Strategist',
  description: 'Live gaming strategies for F1 gaming.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/*
          The next/font Inter instance (fontInter) will automatically handle
          optimizing and loading the font. Manual <link> tags for Google Fonts
          are generally not needed when using next/font for the same font family.
        */}
      </head>
      <body className={cn(
          "font-body antialiased",
          fontInter.variable // If using next/font
        )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
