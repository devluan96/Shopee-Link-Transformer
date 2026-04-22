import React from 'react';
import { 
  MousePointer2, 
  Activity, 
  TrendingUp, 
  PieChart as PieChartIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell
} from 'recharts';

interface AnalyticsProps {
  analyticsData: {
    history: Array<{ date: string; clicks: number }>;
    topLinks: Array<{ title: string; clicks: number }>;
  };
  linksCount: number;
}

export const Analytics = ({ analyticsData, linksCount }: AnalyticsProps) => {
  // Defensive checks to prevent "Cannot read properties of undefined (reading 'reduce')"
  const history = analyticsData?.history || [];
  const topLinks = analyticsData?.topLinks || [];
  
  const totalClicks = history.reduce((a, b) => a + (b.clicks || 0), 0);

  return (
    <div className="space-y-8 pb-12">
       {/* Stats Overview */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Tổng Lượt Click', value: totalClicks.toLocaleString(), icon: MousePointer2, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Link Hoạt Động', value: linksCount || 0, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Tăng Trưởng (30d)', value: '+0%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <stat.icon size={24} />
               </div>
               <div className="text-3xl font-black text-gray-900 mb-1 font-mono">{stat.value}</div>
               <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
            </div>
          ))}
       </div>

       {/* Main Chart */}
       <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-xl font-black text-gray-900">Biểu đồ lượt click</h3>
                <p className="text-xs text-gray-400 font-medium">Thống kê dữ liệu trong 30 ngày gần nhất</p>
             </div>
             <div className="flex gap-2">
                <span className="flex items-center gap-2 text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Live Data
                </span>
             </div>
          </div>
          
          <div className="h-[350px] w-full min-h-[350px]">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#FB923C" strokeWidth={4} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 py-20">
                 <Activity size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-sm italic">Không có dữ liệu click nào trong 30 ngày qua.</p>
              </div>
            )}
          </div>
       </div>

       {/* Bottom Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Links */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <TrendingUp size={20} className="text-orange-500" />
                <h3 className="text-xl font-black text-gray-900">Top Link Hiệu Quả</h3>
             </div>
             <div className="space-y-4">
                {topLinks.length > 0 ? topLinks.map((item, idx) => (
                   <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all font-mono">
                         0{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                         <div className="font-bold text-gray-900 truncate">{item.title}</div>
                         <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{item.clicks} CLICKS</div>
                      </div>
                      {topLinks.length > 0 && (
                        <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-orange-500" 
                              style={{ width: `${(item.clicks / Math.max(1, ...topLinks.map(l => l.clicks || 0))) * 100}%` }}
                          />
                        </div>
                      )}
                   </div>
                )) : (
                  <div className="py-12 text-center text-gray-400 text-sm font-medium italic">
                     Chưa có dữ liệu thống kê link
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <PieChartIcon size={20} className="text-blue-500" />
                <h3 className="text-xl font-black text-gray-900">Nguồn Lưu Lượng</h3>
             </div>
             <div className="h-[200px] mb-6 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                   <BarChart data={[
                      { name: 'Direct', value: 0 },
                      { name: 'Social', value: 0 },
                      { name: 'Search', value: 0 },
                      { name: 'Refer', value: 0 },
                   ]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                         {[
                            <Cell key={0} fill="#3b82f6" />,
                            <Cell key={1} fill="#ef4444" />,
                            <Cell key={2} fill="#10b981" />,
                            <Cell key={3} fill="#9ca3af" />,
                         ]}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-xs text-gray-400 font-medium italic">Dữ liệu phân tích dựa trên HTTP Referrer</p>
          </div>
       </div>
    </div>
  );
};
