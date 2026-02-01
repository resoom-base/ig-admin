"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ExecutiveDailyDashboard() {
  const [lastMonthData, setLastMonthData] = useState({ revenue: 0, adSpend: 0, cost: 0, profit: 0 });
  const [thisMonthData, setThisMonthData] = useState({ revenue: 0, adSpend: 0, cost: 0, profit: 0 });
  const [latestDayData, setLatestDayData] = useState({ date: '', revenue: 0, adSpend: 0, cost: 0, profit: 0 });
  const [channelPerformance, setChannelPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_metrics')
      .select(`*, channels(channel_name)`)
      .order('date', { ascending: false });
    
    if (!error && data.length > 0) {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let tm = { revenue: 0, adSpend: 0, cost: 0, profit: 0 };
      let lm = { revenue: 0, adSpend: 0, cost: 0, profit: 0 };
      
      // 1. 월간 데이터 집계
      data.forEach(item => {
        const itemDate = new Date(item.date);
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();
        const revenue = item.revenue || 0;
        const adSpend = item.ad_spend || 0;
        const cost = (item.total_cost_price || 0) * (item.sales_count || 0);

        if (itemMonth === thisMonth && itemYear === thisYear) {
          tm.revenue += revenue; tm.adSpend += adSpend; tm.cost += cost;
        } else if (itemMonth === lastMonth && itemYear === lastMonthYear) {
          lm.revenue += revenue; lm.adSpend += adSpend; lm.cost += cost;
        }
      });
      tm.profit = tm.revenue - tm.adSpend - tm.cost;
      lm.profit = lm.revenue - lm.adSpend - lm.cost;
      setThisMonthData(tm); setLastMonthData(lm);

      // 2. 최근 판매 성과 (가장 최근 날짜 1일치)
      const latestDate = data[0].date;
      const latestDayRows = data.filter(item => item.date === latestDate);
      let ld = { date: latestDate, revenue: 0, adSpend: 0, cost: 0, profit: 0 };
      
      // 3. 채널별 최근 성과 그룹화
      const chanMap = {};
      latestDayRows.forEach(item => {
        ld.revenue += (item.revenue || 0);
        ld.adSpend += (item.ad_spend || 0);
        ld.cost += (item.total_cost_price * item.sales_count || 0);

        const cName = item.channels?.channel_name || '기타';
        if (!chanMap[cName]) chanMap[cName] = { name: cName, revenue: 0, adSpend: 0, cost: 0 };
        chanMap[cName].revenue += (item.revenue || 0);
        chanMap[cName].adSpend += (item.ad_spend || 0);
        chanMap[cName].cost += (item.total_cost_price * item.sales_count || 0);
      });
      ld.profit = ld.revenue - ld.adSpend - ld.cost;
      setLatestDayData(ld);
      setChannelPerformance(Object.values(chanMap));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-4xl font-black text-indigo-900 tracking-tighter">아이지(IGDND) 경영판</h1>
          <button onClick={fetchAnalytics} className="bg-white border-2 border-gray-200 px-6 py-2 rounded-2xl font-black">갱신</button>
        </header>

        {/* 핵심 성과 카드 (월간 + 일간 통합) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="월 매출액" thisMonth={thisMonthData.revenue} lastMonth={lastMonthData.revenue} daily={latestDayData.revenue} color="blue" />
          <StatCard title="월 광고비" thisMonth={thisMonthData.adSpend} lastMonth={lastMonthData.adSpend} daily={latestDayData.adSpend} color="red" />
          <StatCard title="월 제조원가" thisMonth={thisMonthData.cost} lastMonth={lastMonthData.cost} daily={latestDayData.cost} color="orange" />
          <StatCard title="월 순이익" thisMonth={thisMonthData.profit} lastMonth={lastMonthData.profit} daily={latestDayData.profit} color="green" />
        </div>

        {/* 채널별 당일 성과 리포트 */}
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-200">
          <div className="p-8 border-b bg-gray-50/50">
            <h2 className="text-xl font-black text-gray-800">최근 입력일 채널별 상세 ({latestDayData.date})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="p-6">채널</th>
                  <th className="p-6 text-right">일 매출</th>
                  <th className="p-6 text-right">일 광고비</th>
                  <th className="p-6 text-right text-indigo-600">일 순이익</th>
                  <th className="p-6 text-center">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold">
                {channelPerformance.map((chan, idx) => {
                  const profit = chan.revenue - chan.adSpend - chan.cost;
                  const roas = chan.adSpend > 0 ? ((chan.revenue / chan.adSpend) * 100).toFixed(0) : 0;
                  return (
                    <tr key={idx} className="hover:bg-indigo-50/30">
                      <td className="p-6"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs">{chan.name}</span></td>
                      <td className="p-6 text-right text-lg">{chan.revenue.toLocaleString()}원</td>
                      <td className="p-6 text-right text-sm text-red-500">{chan.adSpend.toLocaleString()}원</td>
                      <td className="p-6 text-right text-lg text-indigo-700">{profit.toLocaleString()}원</td>
                      <td className="p-6 text-center">
                        <span className={`px-4 py-1 rounded-full text-xs font-black ${parseInt(roas) >= 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{roas}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, thisMonth, lastMonth, daily, color }) {
  const progress = lastMonth > 0 ? ((thisMonth / lastMonth) * 100).toFixed(1) : 0;
  const colorMap = { blue: "border-blue-500", red: "border-red-500", orange: "border-orange-500", green: "border-green-500" };

  return (
    <div className={`bg-white p-7 rounded-[2rem] shadow-md border-b-[10px] ${colorMap[color]} hover:scale-[1.02] transition-all`}>
      <p className="text-xs font-black text-gray-400 uppercase mb-2">{title}</p>
      <p className="text-[11px] font-black text-red-500 mb-2 whitespace-nowrap">전달 확정: {lastMonth.toLocaleString()}원</p>
      
      <div className="flex items-baseline gap-1 whitespace-nowrap mb-1">
        <span className="text-3xl font-black text-gray-900 tracking-tighter">{thisMonth.toLocaleString()}</span>
        <span className="text-lg font-bold text-gray-900">원</span>
      </div>
      <p className="text-[11px] font-black text-red-500 mb-4 whitespace-nowrap">전달 대비 {progress}% 달성 중</p>
      
      {/* 분리선 및 일 성과 추가 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">최근 입력일 성과</p>
        <p className="text-lg font-black text-gray-800 whitespace-nowrap">{daily.toLocaleString()}원</p>
      </div>
    </div>
  );
}