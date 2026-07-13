'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default function EmployeeLayout({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar role={user?.role} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar />
        <main style={{ marginTop: '60px', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}