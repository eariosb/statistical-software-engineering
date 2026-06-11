import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
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
            <footer className="border-t border-border bg-bg/95 h-[2.2rem] shrink-0">
              <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-4 px-6 py-2 text-xs text-muted md:flex-row md:justify-between md:px-8">
                <div className="flex items-center gap-3">
                  <Image src="/logo-portfolio.svg" alt="Logo" width={24} height={25} style={{ height: 'auto' }} className="rounded-sm" />
                  <p>
                    <span className="font-medium text-text">Autor y Contacto</span> · Esneider Rios · Estadístico ·
                    Universidad Nacional de Colombia - Sede Medellín
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="mailto:eariosb@unal.edu.co" className="hover:text-text">
                    eariosb@unal.edu.co
                  </a>
                  <a href="https://wa.me/573044575399" className="hover:text-text">
                    WhatsApp: +57 3044575399
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
