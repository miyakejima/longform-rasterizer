import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'longform rasterizer',
  description: 'Deterministic long-form text rasterizer and multi-page typographic image studio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Source+Sans+3:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('longform-rasterizer-theme');var t=s||'dark';if(t==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)] antialiased selection:bg-zinc-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
