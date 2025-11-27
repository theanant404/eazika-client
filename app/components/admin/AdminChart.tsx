"use client";

import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface AdminChartProps {
  title: string;
  data: ChartData[];
  color?: 'indigo' | 'green' | 'blue' | 'orange' | 'red';
  onRangeChange?: (range: string) => void; // New Prop
}

export function AdminChart({ title, data, color = 'indigo', onRangeChange }: AdminChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  const colorMap = {
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  const barColor = colorMap[color];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <select 
            className="text-xs bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none"
            onChange={(e) => onRangeChange && onRangeChange(e.target.value)}
        >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
        </select>
      </div>
      
      <div className="h-48 flex items-end justify-between gap-2 md:gap-4">
        {data.map((item, i) => {
          // Calculate height percentage, ensure min-height for visibility if value > 0
          const heightPercent = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 10) : 0;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-md relative h-full overflow-hidden flex flex-col-reverse">
                <div 
                  className={`w-full transition-all duration-500 rounded-t-md relative group-hover:shadow-lg ${barColor} flex items-start justify-center pt-1`}
                  style={{ height: `${heightPercent}%` }}
                >
                   {/* Value inside the bar */}
                   <span className="text-[10px] text-white/90 font-bold group-hover:text-white transition-colors">
                      {item.value}
                  </span>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
}