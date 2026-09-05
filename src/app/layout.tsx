import type { Metadata } from 'next';
import './globals.css';
import { GuncellemeBildirimi } from '@/components/guncelleme-bildirimi';

export const metadata: Metadata = {
  title: 'LabStock — elektronik komponent deposu',
  description: 'Elektronik komponent stok ve depo takibi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        {/* next/font yerine <link>: derleme sırasında Google'a istek atmaz,
            ağı kısıtlı ortamlarda build kırılmaz. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        {children}
        <GuncellemeBildirimi />
      </body>
    </html>
  );
}
