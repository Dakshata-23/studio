import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'; // Keep this if not using direct link in head
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
    <html lang="en" className="dark"> {/* Assuming dark theme is default */}
      <head>
        {/* Google Fonts links are kept as per guidelines, next/font Inter is also fine if preferred */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
