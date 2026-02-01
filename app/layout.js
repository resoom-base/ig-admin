// app/layout.js 일부 내용
"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import "./globals.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && pathname !== '/login') {
        router.push('/login'); // 로그인이 안 되어 있고 로그인 페이지가 아니면 이동
      }
      setLoading(false);
    };
    checkUser();
  }, [pathname, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black">보안 확인 중...</div>;

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}