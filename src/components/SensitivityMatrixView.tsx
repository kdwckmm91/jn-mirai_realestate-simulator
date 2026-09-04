import React, { useState } from 'react';
import { SimulationParams } from '../types/simulation';
import { calculateSensitivityMatrix } from '../utils/sensitivity';
import { Activity } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SensitivityMatrixViewProps {
  baseParams: SimulationParams;
}

export const SensitivityMatrixView: React.FC<SensitivityMatrixViewProps> = ({ baseParams }) => {
  const [metric, setMetric] = useState<'firstYear' | 'cumulative10'>('firstYear');
  const sensitivityData = calculateSensitivityMatrix(baseParams);

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="panel">
      <div className="panel-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--brand-primary)" />
          金利 × 空室率 感度分析（ストレステスト・マトリクス）
          <Tooltip content="金利上昇や空室率悪化が同時に発生した場合のキャッシュフロー耐久性を検証するマトリクス表です。" />
        </div>

        <div className="segmented-control" style={{ width: 'auto' }}>
          <button
            type="button"
            className={`segmented-control-btn ${metric === 'firstYear' ? 'active' : ''}`}
            onClick={() => setMetric('firstYear')}
          >
            初年度年間FCF
          </button>
          <button
            type="button"
            className={`segmented-control-btn ${metric === 'cumulative10' ? 'active' : ''}`}
            onClick={() => setMetric('cumulative10')}
          >
            10年累計FCF
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
        基準金利: <strong>{baseParams.interestRate}%</strong> ／ 基準空室率:{' '}
        <strong>{baseParams.vacancyRate}%</strong>（単位: 万円）
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="matrix-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: '130px' }}>
                金利＼空室率
              </th>
              {sensitivityData.vacancyRateDeltas.map((dv) => {
                const vacVal = baseParams.vacancyRate + dv;
                return (
                  <th key={dv} style={{ minWidth: '110px' }}>
                    +{dv}% ({vacVal.toFixed(1)}%)
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sensitivityData.matrix.map((row, rIdx) => {
              const deltaRate = sensitivityData.interestRateDeltas[rIdx];
              const curRate = baseParams.interestRate + deltaRate;

              return (
                <tr key={deltaRate}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
                    +{deltaRate.toFixed(1)}% ({curRate.toFixed(2)}%)
                  </td>

                  {row.map((cell) => {
                    const value =
                      metric === 'firstYear' ? cell.firstYearFcf : cell.cumulativeFcf10;
                    const diff = cell.fcfDiffVsBase;

                    let colorClass = 'profit-med';
                    if (value < 0) {
                      colorClass = 'profit-neg';
                    } else if (metric === 'firstYear' && diff < -150) {
                      colorClass = 'profit-low';
                    } else if (metric === 'firstYear' && value > 100) {
                      colorClass = 'profit-high';
                    }

                    return (
                      <td key={cell.deltaVacancy}>
                        <div className={`matrix-cell ${colorClass}`}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {fmt(value)}万
                          </div>
                          {metric === 'firstYear' && (
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: diff >= 0 ? '#34d399' : '#f87171',
                              }}
                            >
                              {diff >= 0 ? `+${fmt(diff)}` : fmt(diff)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: 'rgba(16, 185, 129, 0.4)',
            }}
          />
          高収益 (黒字余裕)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: 'rgba(245, 158, 11, 0.4)',
            }}
          />
          収益圧迫 (注意)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: 'rgba(239, 68, 68, 0.4)',
            }}
          />
          赤字持ち出し (元本返済負担超過)
        </div>
      </div>
    </div>
  );
};
