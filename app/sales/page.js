"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfessionalBulkEntryPage() {
  const [channels, setChannels] = useState([]);
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState([]);
  const [channelPrices, setChannelPrices] = useState({});
  
  const [salesCounts, setSalesCounts] = useState({});
  const [adSpends, setAdSpends] = useState({});
  const [channelAdBoost, setChannelAdBoost] = useState(0); // 채널 공통 광고비(AD부스트)
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const { data: chan } = await supabase.from('channels').select('*').order('id');
    const { data: prod } = await supabase.from('products').select('*').order('id');
    const { data: opt } = await supabase.from('product_options').select('*').order('id');
    const { data: prices } = await supabase.from('channel_option_prices').select('*');
    setChannels(chan || []);
    setProducts(prod || []);
    setOptions(opt || []);
    const pMap = {};
    prices?.forEach(p => { pMap[`${p.channel_id}-${p.option_id}`] = p.price; });
    setChannelPrices(pMap);
  }

  // 실시간 합계 계산 로직
  const getProductTotals = (productId) => {
    const productOptions = options.filter(o => o.product_id === productId);
    let totalQty = 0;
    let totalAmt = 0;
    productOptions.forEach(opt => {
      const qty = salesCounts[opt.id] || 0;
      const price = channelPrices[`${selectedChannel}-${opt.id}`] || 0;
      totalQty += qty;
      totalAmt += (qty * price);
    });
    return { totalQty, totalAmt };
  };

  const grandTotalQty = Object.values(salesCounts).reduce((sum, val) => sum + (val || 0), 0);
  const grandTotalRevenue = options.reduce((sum, opt) => {
    const qty = salesCounts[opt.id] || 0;
    const price = channelPrices[`${selectedChannel}-${opt.id}`] || 0;
    return sum + (qty * price);
  }, 0);

  const handleSave = async () => {
    if (!selectedChannel) {
      setMessage({ text: '판매 채널을 선택해주세요.', isError: true });
      return;
    }

    setMessage({ text: '데이터 기록 중...', isError: false });
    const insertData = [];

    // 1. 채널 공통 광고비(AD부스트) 저장 (제품ID 없음)
    if (channelAdBoost > 0) {
      insertData.push({
        date: selectedDate,
        channel_id: parseInt(selectedChannel),
        product_id: null,
        option_id: null,
        sales_count: 0,
        unit_price: 0,
        total_cost_price: 0,
        ad_spend: channelAdBoost,
        revenue: 0
      });
    }

    // 2. 제품별 루프 (광고비 + 옵션별 판매량)
    for (const product of products) {
      const productAdSpend = adSpends[product.id] || 0;
      if (productAdSpend > 0) {
        insertData.push({
          date: selectedDate,
          channel_id: parseInt(selectedChannel),
          product_id: product.id,
          option_id: null,
          sales_count: 0,
          unit_price: 0,
          total_cost_price: 0,
          ad_spend: productAdSpend,
          revenue: 0
        });
      }

      const productOptions = options.filter(o => o.product_id === product.id);
      for (const opt of productOptions) {
        const count = salesCounts[opt.id] || 0;
        if (count > 0) {
          const { data: bomData } = await supabase.from('bom').select('quantity, parts(current_unit_price)').eq('option_id', opt.id);
          const currentTotalCost = bomData?.reduce((sum, item) => sum + (item.quantity * (item.parts?.current_unit_price || 0)), 0) || 0;
          const unitPrice = channelPrices[`${selectedChannel}-${opt.id}`] || 0;

          insertData.push({
            date: selectedDate,
            channel_id: parseInt(selectedChannel),
            product_id: product.id,
            option_id: opt.id,
            sales_count: count,
            unit_price: unitPrice,
            total_cost_price: currentTotalCost,
            ad_spend: 0,
            revenue: unitPrice * count
          });
        }
      }
    }

    const { error } = await supabase.from('daily_metrics').insert(insertData);
    if (error) {
      setMessage({ text: `저장 실패: ${error.message}`, isError: true });
    } else {
      setMessage({ text: '기록 성공! AD부스트 포함 모든 성과가 저장되었습니다.', isError: false });
      setSalesCounts({});
      setAdSpends({});
      setChannelAdBoost(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
        <h1 className="text-3xl font-black mb-8 text-center text-indigo-900">아이지 채널별 성과 통합 보고</h1>

        {/* 상단 설정 영역 (AD부스트 포함) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div>
            <label className="block text-xs font-black text-indigo-800 mb-1">날짜</label>
            <input type="date" className="w-full border-2 border-white rounded-lg p-2 font-bold focus:ring-2 focus:ring-indigo-400" 
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-black text-indigo-800 mb-1">판매 채널</label>
            <select className="w-full border-2 border-white rounded-lg p-2 font-bold focus:ring-2 focus:ring-indigo-400" 
              value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
              <option value="">채널 선택</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.channel_name}</option>)}
            </select>
          </div>
          <div className="bg-yellow-100 p-2 rounded-lg border-2 border-yellow-200">
            <label className="block text-[10px] font-black text-yellow-800 mb-1 uppercase">채널 공통 광고비 (AD부스트)</label>
            <input type="number" placeholder="0" className="w-full border-none bg-transparent text-right font-black text-yellow-900 text-lg focus:ring-0 outline-none"
              value={channelAdBoost || ''} onChange={e => setChannelAdBoost(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* 제품 및 옵션 입력 리스트 */}
        {products.map(product => {
          const { totalQty, totalAmt } = getProductTotals(product.id);
          return (
            <div key={product.id} className="mb-8 border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
                <h2 className="text-xl font-black">{product.product_name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">제품 광고비:</span>
                  <input type="number" placeholder="0" className="w-28 p-1.5 rounded bg-gray-700 text-right font-black text-red-400 border-none focus:ring-2 focus:ring-red-500 outline-none"
                    value={adSpends[product.id] || ''} onChange={e => setAdSpends({...adSpends, [product.id]: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
                  <tr>
                    <th className="p-3 text-left">옵션명</th>
                    <th className="p-3 text-center w-28">판매 수량</th>
                    <th className="p-3 text-right">금액 합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold">
                  {options.filter(o => o.product_id === product.id).map(opt => {
                    const unitPrice = channelPrices[`${selectedChannel}-${opt.id}`] || 0;
                    const count = salesCounts[opt.id] || 0;
                    return (
                      <tr key={opt.id} className="hover:bg-blue-50">
                        <td className="p-3 text-sm text-gray-700">{opt.option_name}</td>
                        <td className="p-3">
                          <input type="number" placeholder="0" className="w-full border-2 border-gray-100 rounded p-1.5 text-center font-black text-blue-600 focus:border-blue-500 outline-none"
                            value={salesCounts[opt.id] || ''} onChange={e => setSalesCounts({...salesCounts, [opt.id]: parseInt(e.target.value) || 0})} />
                        </td>
                        <td className="p-3 text-right text-sm text-gray-900">{(unitPrice * count).toLocaleString()}원</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100">
                  <tr className="font-black text-indigo-900">
                    <td className="p-3 text-sm">{product.product_name} 소계</td>
                    <td className="p-3 text-center text-lg">{totalQty.toLocaleString()}</td>
                    <td className="p-3 text-right text-lg">{totalAmt.toLocaleString()}원</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        {/* 전체 합계 요약 박스 */}
        <div className="mt-12 mb-6 p-6 bg-gray-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">오늘의 총 판매 수량</p>
            <p className="text-4xl font-black text-blue-400">{grandTotalQty.toLocaleString()}<span className="text-xl ml-1 text-white">개</span></p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-700"></div>
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">오늘의 총 예상 매출액</p>
            <p className="text-4xl font-black text-green-400">{grandTotalRevenue.toLocaleString()}<span className="text-xl ml-1 text-white">원</span></p>
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-black py-5 rounded-xl text-2xl hover:bg-indigo-700 shadow-2xl transition-all active:scale-95">
          오늘의 성과 일괄 저장
        </button>
        
        {message.text && (
          <div className={`mt-6 p-4 rounded-xl text-center font-bold ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}