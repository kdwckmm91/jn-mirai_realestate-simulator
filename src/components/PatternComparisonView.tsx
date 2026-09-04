import React, { useState } from 'react';
import { ComparisonPattern, SimulationParams } from '../types/simulation';
import { calculateSimulation } from '../utils/calculation';
import { calculateExitAnalysis } from '../utils/exitCalculation';
import { Line } from 'react-chartjs-2';
import { Layers } from 'lucide-react';

interface PatternComparisonViewProps {
  baseParams: SimulationParams;
  onApplyPatternToBase: (params: SimulationParams) => void;
}

export const PatternComparisonView: React.FC<PatternComparisonViewProps> = ({
  baseParams,
  onApplyPatternToBase,
}) => {
  const [patterns, setPatterns] = useState<ComparisonPattern[]>([
    {
      id: 'A',
      name: 'パターンA（現在設定 / 基準）',
      params: { ...baseParams },
      color: '#10b981', // Emerald
    },
    {
      id: 'B',
      name: 'パターンB（ストレス検証：金利+1%・空室10%）',
      params: {
        ...baseParams,
        interestRate: baseParams.interestRate + 1.0,
        vacancyRate: Math.min(100, baseParams.vacancyRate + 5.0),
      },
      color: '#f59e0b', // Amber
    },
    {
      id: 'C',
      name: 'パターンC（元金均等返済＆頭金15%）',
      params: {
        ...baseParams,
        downPaymentRatio: 15,
        repaymentMethod: 'equal-principal',
      },
      color: '#6366f1', // Indigo
    },
  ]);

  const updatePatternParam = (
    patternId: 'A' | 'B' | 'C',
    field: keyof SimulationParams,
    value: any
  ) => {
    setPatterns((prev) =>
      prev.map((p) => (p.id === patternId ? { ...p, params: { ...p.params, [field]: value } } : p))
    );
  };

  const results = patterns.map((p) => {
    const sim = calculateSimulation(p.params);
    const exit = calculateExitAnalysis(p.params, sim.annualList);
    return {
      pattern: p,
      sim,
      exit,
    };
  });

  // 累計CF重ね合わせグラフデータ（35年間）
  const maxYears = 35;
  const labels = Array.from({ length: maxYears }, (_, i) => `${i + 1}年目`);

  const chartData = {
    labels,
    datasets: results.map((r) => ({
      label: r.pattern.name,
      data: r.sim.annualList.slice(0, maxYears).map((d) => Math.round(d.cumulativeFcf)),
      borderColor: r.pattern.color,
      backgroundColor: `${r.pattern.color}22`,
      borderWidth: 2.5,
      pointRadius: 2,
      tension: 0.2,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94a3b8', boxWidth: 10 },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y?.toLocaleString()} 万円`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          callback: (v: any) => `${Number(v).toLocaleString()}万`,
        },
      },
    },
  };

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 重ね合わせグラフ */}
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <Layers size={18} color="var(--brand-primary)" />
            3パターン 累計キャッシュフロー推移 比較グラフ
          </div>
        </div>
        <div className="chart-canvas-wrapper" style={{ height: '320px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 3パターン並列比較カード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {results.map(({ pattern, sim, exit }) => (
          <div
            key={pattern.id}
            className="panel"
            style={{
              borderTop: `4px solid ${pattern.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="text"
                value={pattern.name}
                onChange={(e) =>
                  setPatterns((prev) =>
                    prev.map((p) => (p.id === pattern.id ? { ...p, name: e.target.value } : p))
                  )
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  width: '75%',
                }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onApplyPatternToBase(pattern.params)}
                title="このパターンのパラメータを基本入力に反映"
              >
                反映
              </button>
            </div>

            {/* 主要指標サマリー */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                background: 'var(--bg-surface)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>初年度FCF</div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: sim.summary.firstYearFcf >= 0 ? '#34d399' : '#f87171',
                  }}
                >
                  {fmt(sim.summary.firstYearFcf)} 万円
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10年累計CF</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {fmt(sim.summary.cumulativeFcf10)} 万円
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>内部収益率 (IRR)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-accent)' }}>
                  {exit.irr !== null ? `${exit.irr.toFixed(2)}%` : '-'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>デッドクロス</div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: sim.summary.deadCrossYear ? '#f87171' : '#34d399',
                  }}
                >
                  {sim.summary.deadCrossYear ? `${sim.summary.deadCrossYear}年目` : 'なし'}
                </div>
              </div>
            </div>

            {/* 主要パラメータ変更 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>借入金利:</span>
                <input
                  type="number"
                  step={0.1}
                  value={pattern.params.interestRate}
                  onChange={(e) =>
                    updatePatternParam(pattern.id, 'interestRate', parseFloat(e.target.value) || 0)
                  }
                  style={{
                    width: '75px',
                    padding: '0.2rem 0.4rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    textAlign: 'right',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>空室率:</span>
                <input
                  type="number"
                  step={0.5}
                  value={pattern.params.vacancyRate}
                  onChange={(e) =>
                    updatePatternParam(pattern.id, 'vacancyRate', parseFloat(e.target.value) || 0)
                  }
                  style={{
                    width: '75px',
                    padding: '0.2rem 0.4rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    textAlign: 'right',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>返済方式:</span>
                <select
                  value={pattern.params.repaymentMethod}
                  onChange={(e) => updatePatternParam(pattern.id, 'repaymentMethod', e.target.value)}
                  style={{
                    padding: '0.2rem 0.4rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#ffffff',
                  }}
                >
                  <option value="equal-payment">元利均等返済</option>
                  <option value="equal-principal">元金均等返済</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>頭金割合:</span>
                <input
                  type="number"
                  step={1}
                  value={pattern.params.downPaymentRatio}
                  onChange={(e) =>
                    updatePatternParam(
                      pattern.id,
                      'downPaymentRatio',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  style={{
                    width: '75px',
                    padding: '0.2rem 0.4rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
