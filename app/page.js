// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
      <h1 className="text-4xl font-black text-indigo-900 mb-12 tracking-tighter text-center">
        아이지(IGDND) 관리 시스템
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <Link href="/dashboard" className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all text-center border-b-8 border-indigo-500">
          <span className="text-4xl block mb-4">📈</span>
          <span className="text-xl font-black text-gray-800">경영 대시보드</span>
        </Link>
        <Link href="/sales" className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all text-center border-b-8 border-green-500">
          <span className="text-4xl block mb-4">💰</span>
          <span className="text-xl font-black text-gray-800">판매 성과 입력</span>
        </Link>
        <Link href="/inventory" className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all text-center border-b-8 border-orange-500">
          <span className="text-4xl block mb-4">📦</span>
          <span className="text-xl font-black text-gray-800">부품 재고 관리</span>
        </Link>
      </div>
    </div>
  );
}