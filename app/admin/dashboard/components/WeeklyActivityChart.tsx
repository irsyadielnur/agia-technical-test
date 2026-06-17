'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/app/components/motion';
import { DashboardStats } from './types';

interface WeeklyActivityChartProps {
  chartData: DashboardStats['chartData'];
  activeTab: 'chats' | 'users' | 'sales';
  onTabChange: (tab: 'chats' | 'users' | 'sales') => void;
}

const cardVariants = fadeInUp(0, 15);

// Helper to draw smooth Bezier line chart in SVG
const drawSvgChart = (
  data: { chats: number; users: number; sales: number }[],
  key: 'chats' | 'users' | 'sales'
) => {
  const width = 600;
  const height = 290;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d[key]);
  const maxVal = Math.max(...values, 5);

  const points = values.map((val, idx) => {
    const x = paddingLeft + (idx * chartWidth) / (values.length - 1);
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, value: val };
  });

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  let areaD = '';
  if (points.length > 0) {
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  return {
    points,
    pathD,
    areaD,
    width,
    height,
    maxVal,
    paddingLeft,
    chartWidth,
    chartHeight,
  };
};

export default function WeeklyActivityChart({
  chartData,
  activeTab,
  onTabChange,
}: WeeklyActivityChartProps) {
  const chartInfo = drawSvgChart(chartData, activeTab);

  let strokeColor = '#8b5cf6';
  let gradId = 'violetGrad';
  if (activeTab === 'users') {
    strokeColor = '#3b82f6';
    gradId = 'blueGrad';
  } else if (activeTab === 'sales') {
    strokeColor = '#10b981';
    gradId = 'emeraldGrad';
  }

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-4 flex flex-col justify-between hover:shadow-md transition duration-200"
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Aktivitas Mingguan</h2>
            <p className="text-xs text-gray-400">
              Frekuensi chatbot, jumlah pelanggan, dan data penjualan.
            </p>
          </div>
          {/* Toggle Tab */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto">
            {(['chats', 'users', 'sales'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer relative ${
                  activeTab === tab ? 'text-slate-900 font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeAnalyticTab"
                    className="absolute inset-0 bg-white rounded-md shadow-xs z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {tab === 'chats' ? 'Sesi Chat' : tab === 'users' ? 'Pelanggan' : 'Penjualan'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="w-full relative mt-2 overflow-hidden">
          <svg viewBox={`0 0 ${chartInfo.width} ${chartInfo.height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const yVal = chartInfo.paddingLeft + i * (chartInfo.chartHeight / 3);
              const rawVal = chartInfo.maxVal - (i * chartInfo.maxVal) / 3;

              let labelVal = '';
              if (activeTab === 'sales') {
                if (rawVal >= 1000000) {
                  labelVal = `Rp ${(rawVal / 1000000).toFixed(1)}jt`;
                } else if (rawVal >= 1000) {
                  labelVal = `Rp ${Math.round(rawVal / 1000)}rb`;
                } else {
                  labelVal = `Rp ${Math.round(rawVal)}`;
                }
              } else {
                labelVal = String(Math.round(rawVal));
              }

              return (
                <g key={i}>
                  <line
                    x1={chartInfo.paddingLeft}
                    y1={yVal}
                    x2={chartInfo.width - 20}
                    y2={yVal}
                    stroke="#f8fafc"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartInfo.paddingLeft - 10}
                    y={yVal + 4}
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* X-axis Labels */}
            {chartInfo.points.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={chartInfo.height - 10}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                {chartData[idx]?.label.split(' ')[0]}
              </text>
            ))}

            {/* Filled gradient area */}
            <motion.path
              key={`area-${activeTab}`}
              d={chartInfo.areaD}
              fill={`url(#${gradId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            />

            {/* Smooth Bezier line path */}
            <motion.path
              key={`line-${activeTab}`}
              d={chartInfo.pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Interactive circles */}
            {chartInfo.points.map((pt, idx) => (
              <g key={idx} className="cursor-pointer group">
                <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ffffff" stroke={strokeColor} strokeWidth="3" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="11"
                  fill={strokeColor}
                  fillOpacity="0"
                  className="hover:fill-opacity-10 transition duration-150"
                />
                <title>
                  {activeTab === 'sales'
                    ? `${chartData[idx]?.label}: Rp ${pt.value.toLocaleString('id-ID')}`
                    : `${chartData[idx]?.label}: ${pt.value}`}
                </title>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-400 mt-4">
        <span>Data dihitung secara dinamis dari database.</span>
        <span className="font-semibold text-gray-600 capitalize">Mode: {activeTab}</span>
      </div>
    </motion.div>
  );
}
