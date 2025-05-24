import type {Metadata} from 'next';
import { Geist } from 'next/font/google'; // Use Geist directly
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({ // Use the variable font functionality
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Ensure font display strategy
});


export const metadata: Metadata = {
  title: 'ChatterStats - Analyze Your Chats',
  description: 'Upload, analyze, and visualize your chat data with ChatterStats.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className={`font-sans antialiased`}> {/* Use font-sans which will pick up --font-geist-sans */}
        {children}
        <Toaster /> {/* Add Toaster here for global toasts */}
      </body>
    </html>
  );
}
