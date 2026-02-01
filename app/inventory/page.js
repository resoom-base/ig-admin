"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InventoryManagementPage() {
  const [parts, setParts] = useState([]);
  const [incomingQty, setIncomingQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    // parts 테이블에서 모든 정보를 가져옵니다. (safety_stock 포함)
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('part_name');
    
    if (error) {
      console.error('Error:', error);
      setMessage({ text: '데이터를 불러오지 못했습니다.', isError: true });
    } else {
      setParts(data || []);
    }
    setLoading(false);
  }

  const handleUpdateStock = async (part) => {
    const addQty = incomingQty[part.id] || 0;
    if (addQty <= 0) {
      alert("입고 수량을 입력해주세요.");
      return;
    }

    const newStockQty = (part.current_stock || 0) + addQty;

    const { error } = await supabase
      .from('parts')
      .update({ current_stock: newStockQty })
      .eq('id', part.id);

    if (error) {
      setMessage({ text: `업데이트 실패: ${error.message}`, isError: true });
    } else {
      setMessage({ text: `${part.part_name} 부품이 ${addQty}개 입고 처리되었습니다.`, isError: false });
      setIncomingQty(prev => ({ ...prev, [part.id]: 0 }));
      fetchInventory();
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">재고 데이터를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter">아이지 부품 재고 및 입고 관리</h1>
          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span> 안전재고 부족</div>
            <button onClick={fetchInventory} className="text-indigo-600 hover:underline">새로고침</button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-center font-bold shadow-sm ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white font-black text-sm uppercase">
                <th className="p-5 border-r border-gray-700">부품명</th>
                <th className="p-5 text-right border-r border-gray-700">현재 잔존 재고 (안전재고)</th>
                <th className="p-5 text-center bg-gray-700 w-48">신규 입고 입력</th>
                <th className="p-5 text-center">실행</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parts.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400">등록된 부품이 없습니다.</td></tr>
              ) : (
                parts.map(part => {
                  // 안전재고 부족 여부 판단
                  const isLowStock = part.current_stock <= (part.safety_stock || 0);
                  
                  return (
                    <tr key={part.id} className={`transition-colors ${isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}`}>
                      <td className="p-5">
                        <div className="font-black text-lg text-gray-800">{part.part_name}</div>
                        {isLowStock && <span className="text-[10px] font-black text-red-600 uppercase bg-red-200 px-2 py-0.5 rounded-full">발주 필요</span>}
                      </td>
                      <td className="p-5 text-right border-l border-gray-100">
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black ${isLowStock ? 'text-red-600' : 'text-blue-600'}`}>
                              {part.current_stock?.toLocaleString()}
                            </span>
                            <span className="text-gray-500 font-bold">개</span>
                          </div>
                          <div className="text-xs font-bold text-gray-400">
                            안전: {part.safety_stock?.toLocaleString() || 0}개
                          </div>
                        </div>
                      </td>
                      <td className={`p-5 ${isLowStock ? 'bg-red-50/50' : 'bg-gray-50'}`}>
                        <input 
                          type="number" 
                          placeholder="0"
                          className="w-full p-3 border-2 border-indigo-200 rounded-lg text-center font-black text-indigo-600 outline-none focus:border-indigo-500"
                          value={incomingQty[part.id] || ''}
                          onChange={(e) => setIncomingQty({...incomingQty, [part.id]: parseInt(e.target.value) || 0})}
                        />
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => handleUpdateStock(part)}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 shadow-md active:scale-95 transition-all w-full md:w-auto"
                        >
                          입고 확정
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}