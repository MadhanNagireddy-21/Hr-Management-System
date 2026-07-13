
'use client';
import { Geist } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';

const geist = Geist({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Provider store={store}>
          <Toaster position="top-right" />
          {children}
        </Provider>
      </body>
    </html>
  );
}