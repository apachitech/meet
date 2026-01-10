import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SiteConfigProvider } from './components/SiteConfigProvider';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'Apacciflix';
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`, { 
      next: { revalidate: 60 } 
    });
    const data = await res.json();
    if (data.siteName) siteName = data.siteName;
  } catch (e) {
    console.error('Failed to fetch site settings for metadata', e);
  }

  return {
    title: {
      default: `${siteName} | Live Interactive Streaming`,
      template: `%s | ${siteName}`,
    },
    description: `Join ${siteName} for the best live interactive streaming experience. Connect with creators in real-time.`,
    icons: {
      icon: { rel: 'icon', url: '/favicon.ico' },
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} data-lk-theme="default">
        <SiteConfigProvider>
          <Toaster />
          {children}
        </SiteConfigProvider>
      </body>
    </html>
  );
}
