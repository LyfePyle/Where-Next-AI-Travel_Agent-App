'use client';

import { useState } from 'react';

interface ChartData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface BudgetChartProps {
  data: ChartData[];
  type: 'pie' | 'bar' | 'donut';
  title: string;
  totalAmount: number;
}

export default function BudgetChart({ data, type, title, totalAmount }: BudgetChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const PieChart = () => {
    let cumulativePercentage = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="4"
          />
          {data.map((segment, index) => {
            const percentage = (segment.value / totalAmount) * 100;
            const strokeDasharray = `${percentage * 5.027} 502.7`; // 2π * 80 ≈ 502.7
            const strokeDashoffset = -cumulativePercentage * 5.027;
            cumulativePercentage += percentage;

            return (
              <circle
                key={segment.name}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 cursor-pointer hover:stroke-[16]"
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  filter: hoveredSegment === index ? 'brightness(1.1)' : 'none'
                }}
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">${totalAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const DonutChart = () => {
    let cumulativePercentage = 0;
    const radius = 70;
    const innerRadius = 40;
    const centerX = 100;
    const centerY = 100;

    return (
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {data.map((segment, index) => {
            const percentage = (segment.value / totalAmount) * 100;
            const angle = (percentage / 100) * 2 * Math.PI;
            const startAngle = (cumulativePercentage / 100) * 2 * Math.PI;
            const endAngle = startAngle + angle;

            const largeArc = angle > Math.PI ? 1 : 0;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const x3 = centerX + innerRadius * Math.cos(endAngle);
            const y3 = centerY + innerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(startAngle);
            const y4 = centerY + innerRadius * Math.sin(startAngle);

            const pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${x3} ${y3}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
              'Z'
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <path
                key={segment.name}
                d={pathData}
                fill={segment.color}
                className="cursor-pointer transition-all duration-300 hover:brightness-110"
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  filter: hoveredSegment === index ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.1))' : 'none'
                }}
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">${totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Budget</div>
          </div>
        </div>
      </div>
    );
  };

  const BarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const widthPercentage = (item.value / totalAmount) * 100;
          
          return (
            <div 
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.name}</span>
                </span>
                <span className="text-sm text-gray-600">${item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    backgroundColor: item.color,
                    width: `${percentage}%`,
                    filter: hoveredSegment === index ? 'brightness(1.1)' : 'none'
                  }}
                />
                <div className="absolute right-2 top-0 h-3 flex items-center">
                  <span className="text-xs text-white font-medium">
                    {widthPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Chart */}
        <div className="flex-shrink-0">
          {type === 'pie' && <PieChart />}
          {type === 'donut' && <DonutChart />}
          {type === 'bar' && <BarChart />}
        </div>

        {/* Legend */}
        {(type === 'pie' || type === 'donut') && (
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {data.map((item, index) => {
                const percentage = ((item.value / totalAmount) * 100).toFixed(1);
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                      hoveredSegment === index ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredSegment(index)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        {item.icon && <span className="text-base">{item.icon}</span>}
                        <span>{item.name}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${item.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Largest Category: </span>
            <span className="font-semibold text-gray-900">
              {data.reduce((max, item) => item.value > max.value ? item : max).name}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Average: </span>
            <span className="font-semibold text-gray-900">
              ${Math.round(totalAmount / data.length).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
