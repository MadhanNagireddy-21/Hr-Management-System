
'use client';
import { Geist } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { loadUser } from '@/store/authSlice';
import { useEffect } from 'react';

const geist = Geist({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body className={geist.className} suppressHydrationWarning>
        <Provider store={store}>
          <Toaster position="top-right" />
          {children}
        </Provider>
      </body>
    </html>
  );
}