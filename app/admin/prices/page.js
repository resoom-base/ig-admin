"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BulkPriceSettingPage() {
  const [channels, setChannels] = useState([]);
  const [options, setOptions] = useState([]);
  const [prices, setPrices] = useState({}); // { "channelId-optionId": price }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    // 1. 채널 정보 가져오기
    const { data: chanData } = await supabase.from('channels').select('*').order('id');
    // 2. 제품 옵션 정보 가져오기 (제품명 포함)
    const { data: optData } = await supabase
      .from('product_options')
      .select(`id, option_name, products(product_name)`)
      .order('id');
    // 3. 기존에 등록된 가격 정보 가져오기
    const { data: priceData } = await supabase.from('channel_option_prices').select('*');

    setChannels(chanData || []);
    setOptions(optData || []);

    // 기존 가격 정보를 상태에 매핑
    const priceMap = {};
    priceData?.forEach(p => {
      priceMap[`${p.channel_id}-${p.option_id}`] = p.price;
    });
    setPrices(priceMap);
    setLoading(false);
  }

  // 입력값 변경 처리
  const handlePriceChange = (channelId, optionId, value) => {
    setPrices(prev => ({
      ...prev,
      [`${channelId}-${optionId}`]: parseInt(value) || 0
    }));
  };

  // 일괄 저장 로직
  const handleSaveAll = async () => {
    setMessage({ text: '저장 중...', isError: false });
    
    const upsertData = [];
    for (const key in prices) {
      const [channel_id, option_id] = key.split('-');
      upsertData.push({
        channel_id: parseInt(channel_id),
        option_id: parseInt(option_id),
        price: prices[key]
      });
    }

    // upsert: 동일한 channel_id, option_id 조합이 있으면 업데이트, 없으면 삽입
    const { error } = await supabase
      .from('channel_option_prices')
      .upsert(upsertData, { onConflict: 'channel_id, option_id' });

    if (error) {
      setMessage({ text: `저장 실패: ${error.message}`, isError: true });
    } else {
      setMessage({ text: '모든 채널별 가격이 성공적으로 저장되었습니다!', isError: false });
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">데이터를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">채널별 판매가 일괄 설정</h1>
          <button 
            onClick={handleSaveAll}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-black hover:bg-indigo-700 shadow-lg"
          >
            전체 가격 저장하기
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-md text-center font-bold ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="p-4 text-left font-bold text-gray-700 sticky left-0 bg-gray-100 z-10 w-64">제품명 / 옵션명</th>
                {channels.map(channel => (
                  <th key={channel.id} className="p-4 text-center font-bold text-gray-700 border-l border-gray-200">
                    {channel.channel_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {options.map(opt => (
                <tr key={opt.id} className="hover:bg-blue-50 transition">
                  <td className="p-4 sticky left-0 bg-white font-bold border-r shadow-sm">
                    <span className="text-xs text-blue-600 block">{opt.products?.product_name}</span>
                    <span className="text-sm">{opt.option_name}</span>
                  </td>
                  {channels.map(channel => (
                    <td key={channel.id} className="p-2 border-l border-gray-100">
                      <input 
                        type="number" 
                        className="w-full p-2 text-right font-bold text-gray-900 border border-gray-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="0"
                        value={prices[`${channel.id}-${opt.id}`] || ''}
                        onChange={(e) => handlePriceChange(channel.id, opt.id, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}