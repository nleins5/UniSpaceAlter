import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniSpace",
  description: "Thiết kế áo thun độc đáo với AI. Tạo hình ảnh, kéo thả lên áo và đặt hàng ngay.",
};

// Next.js 16: viewport & themeColor must be a separate export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#b026ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`h-full antialiased ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Google Fonts for Design Studio */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700;900&family=Poppins:wght@400;600;700&family=Nunito:wght@400;700&family=Raleway:wght@400;700&family=Oswald:wght@400;700&family=Ubuntu:wght@400;700&family=Quicksand:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=PT+Serif:wght@400;700&family=Crimson+Text:wght@400;700&family=Bebas+Neue&family=Righteous&family=Pacifico&family=Lobster&family=Permanent+Marker&family=Bungee&family=Fredoka+One&family=Abril+Fatface&family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Satisfy&family=Great+Vibes&family=Sacramento&family=Fira+Code:wght@400;700&family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Noise overlay for premium texture */}
        <svg className="noise-overlay" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        {children}
      </body>
    </html>
  );
}

