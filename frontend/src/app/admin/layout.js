'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default function AdminLayout({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user?.role === 'EMPLOYEE') {
      router.push('/employee/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="app-container">
      <Sidebar role={user?.role} />
      <div className="app-main-content">
        <Navbar />
        <main className="app-main-padding">
          {children}
        </main>
      </div>
    </div>
  );
}