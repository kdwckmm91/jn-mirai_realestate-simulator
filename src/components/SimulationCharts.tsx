import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart, Line } from 'react-chartjs-2';
import { AnnualData, SimulationParams } from '../types/simulation';
import { BarChart3, LineChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface SimulationChartsProps {
  params: SimulationParams;
  annualList: AnnualData[];
}

export const SimulationCharts: React.FC<SimulationChartsProps> = ({ params, annualList }) => {
  const [chartMode, setChartMode] = useState<'cf' | 'balance'>('cf');

  const labels = annualList.map((d) => `${d.year}年目`);

  // 1. 年間キャッシュフロー＆利益推移
  const cfChartData = {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: '実効家賃収入',
        data: annualList.map((d) => Math.round(d.effectiveRent)),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 2,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: '税引前利益',
        data: annualList.map((d) => Math.round(d.preTaxProfit)),
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'フリーCF (FCF)',
        data: annualList.map((d) => Math.round(d.fcf)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointRadius: 3,
        tension: 0.2,
        fill: true,
        yAxisID: 'y',
      },
    ],
  };

  // 2. ローン残高＆資産簿価推移
  const landPrice = params.price * (1 - params.buildingRatio / 100);
  const buildingPrice = params.price * (params.buildingRatio / 100);
  const annualDepreciation = params.usefulLife > 0 ? buildingPrice / params.usefulLife : 0;

  const totalAssetValues: number[] = [];
  let cumDep = 0;
  for (let i = 0; i < annualList.length; i++) {
    const yr = annualList[i].year;
    if (yr <= params.usefulLife) {
      cumDep += annualDepreciation;
    }
    const bValue = Math.max(0, buildingPrice - cumDep);
    totalAssetValues.push(Math.round(landPrice + bValue));
  }

  const balanceChartData = {
    labels,
    datasets: [
      {
        label: '期末借入金残高',
        data: annualList.map((d) => Math.round(d.endingBalance)),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.2,
        fill: true,
      },
      {
        label: '総資産簿価 (土地+建物簿価)',
        data: totalAssetValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 2,
        tension: 0.2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed.y;
            return ` ${context.dataset.label}: ${val?.toLocaleString()} 万円`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', maxRotation: 45, minRotation: 0 },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          callback: (value: any) => `${Number(value).toLocaleString()}万`,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title">
          {chartMode === 'cf' ? (
            <>
              <BarChart3 size={18} color="var(--brand-primary)" />
              年間キャッシュフロー・収支推移
            </>
          ) : (
            <>
              <LineChart size={18} color="var(--color-danger)" />
              借入残高・資産簿価推移（純資産蓄積）
            </>
          )}
        </div>

        <div className="segmented-control" style={{ width: 'auto' }}>
          <button
            type="button"
            className={`segmented-control-btn ${chartMode === 'cf' ? 'active' : ''}`}
            onClick={() => setChartMode('cf')}
          >
            収支・キャッシュフロー推移
          </button>
          <button
            type="button"
            className={`segmented-control-btn ${chartMode === 'balance' ? 'active' : ''}`}
            onClick={() => setChartMode('balance')}
          >
            ローン残高＆資産推移
          </button>
        </div>
      </div>

      <div className="chart-canvas-wrapper">
        {chartMode === 'cf' ? (
          <Chart type="bar" data={cfChartData} options={options} />
        ) : (
          <Line data={balanceChartData} options={options} />
        )}
      </div>
    </div>
  );
};
