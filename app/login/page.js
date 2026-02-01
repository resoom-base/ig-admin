"use client";
import { useState } from 'react';
import { signIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (error) setError('이메일 또는 비밀번호가 틀렸습니다.');
    else router.push('/'); 
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-indigo-900 mb-8 text-center">아이지 보안 로그인</h1>
        
        {error && <p className="text-red-500 font-bold mb-4 text-center">{error}</p>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 ml-1 uppercase">Email</label>
            <input 
              type="email" 
              placeholder="이메일을 입력하세요" 
              className="w-full p-4 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-900 placeholder-gray-300"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 ml-1 uppercase">Password</label>
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
              className="w-full p-4 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-900 placeholder-gray-300"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-xl hover:bg-indigo-700 mt-8 transition-colors">
          시스템 접속
        </button>
      </form>
    </div>
  );
}