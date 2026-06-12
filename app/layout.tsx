import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Documentación de Ingeniería de Software Estadístico',
  description: 'Plataforma técnica central para arquitectura, DataOps, MLOps y gobierno de datos.',
  icons: {
    icon: '/logo-portfolio.svg',
    shortcut: '/logo-portfolio.svg',
    apple: '/logo-portfolio.svg'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen bg-bg text-text">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
