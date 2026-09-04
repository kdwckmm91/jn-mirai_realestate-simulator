import React, { useState } from 'react';
import { ComparisonPattern, SimulationParams } from '../types/simulation';
import { calculateSimulation } from '../utils/calculation';
import { calculateExitAnalysis } from '../utils/exitCalculation';
import { Line } from 'react-chartjs-2';
import { Layers, Plus, Trash2, Copy, Check } from 'lucide-react';

interface PatternComparisonViewProps {
  baseParams: SimulationParams;
  onApplyPatternToBase: (params: SimulationParams) => void;
}

const MAX_PATTERNS = 5;
const MIN_PATTERNS = 1;

const COLOR_PALETTE = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#f97316', // Orange
];

export const PatternComparisonView: React.FC<PatternComparisonViewProps> = ({
  baseParams,
  onApplyPatternToBase,
}) => {
  const [patterns, setPatterns] = useState<ComparisonPattern[]>([
    {
      id: 'pattern_1',
      name: 'パターンA（現在設定 / 基準）',
      params: { ...baseParams },
      color: '#10b981', // Emerald
    },
    {
      id: 'pattern_2',
      name: 'パターンB（ストレス検証：金利+1%・空室10%）',
      params: {
        ...baseParams,
        interestRate: baseParams.interestRate + 1.0,
        vacancyRate: Math.min(100, baseParams.vacancyRate + 5.0),
      },
      color: '#f59e0b', // Amber
    },
    {
      id: 'pattern_3',
      name: 'パターンC（元金均等返済＆頭金15%）',
      params: {
        ...baseParams,
        downPaymentRatio: 15,
        repaymentMethod: 'equal-principal',
      },
      color: '#6366f1', // Indigo
    },
  ]);

  // パターン追加（新規作成）
  const handleAddPattern = () => {
    if (patterns.length >= MAX_PATTERNS) return;

    const nextIndex = patterns.length;
    const letter = String.fromCharCode(65 + nextIndex); // D, E, ...
    const color = COLOR_PALETTE[nextIndex % COLOR_PALETTE.length];
    const newId = `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 直近のパターンまたはベース設定をコピー
    const templateParams = patterns.length > 0 ? patterns[patterns.length - 1].params : baseParams;

    const newPattern: ComparisonPattern = {
      id: newId,
      name: `パターン${letter}（カスタム条件）`,
      params: { ...templateParams },
      color,
    };

    setPatterns((prev) => [...prev, newPattern]);
  };

  // パターン複製
  const handleDuplicatePattern = (id: string) => {
    if (patterns.length >= MAX_PATTERNS) return;

    const target = patterns.find((p) => p.id === id);
    if (!target) return;

    const nextIndex = patterns.length;
    const color = COLOR_PALETTE[nextIndex % COLOR_PALETTE.length];
    const newId = `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPattern: ComparisonPattern = {
      id: newId,
      name: `${target.name}（コピー）`,
      params: { ...target.params },
      color,
    };

    setPatterns((prev) => [...prev, newPattern]);
  };

  // パターン削除
  const handleDeletePattern = (id: string) => {
    if (patterns.length <= MIN_PATTERNS) return;
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  };

  // パラメータ更新
  const updatePatternParam = (
    patternId: string,
    field: keyof SimulationParams,
    value: any
  ) => {
    setPatterns((prev) =>
      prev.map((p) => (p.id === patternId ? { ...p, params: { ...p.params, [field]: value } } : p))
    );
  };

  // メタデータ更新（名称・カラー）
  const updatePatternMeta = (
    patternId: string,
    field: 'name' | 'color',
    value: string
  ) => {
    setPatterns((prev) =>
      prev.map((p) => (p.id === patternId ? { ...p, [field]: value } : p))
    );
  };

  // シミュレーション＆Exit計算
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
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="chart-title">
            <Layers size={18} color="var(--brand-primary)" />
            複数条件 累計キャッシュフロー推移 比較グラフ（{patterns.length}パターン）
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              登録数: {patterns.length} / {MAX_PATTERNS}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddPattern}
              disabled={patterns.length >= MAX_PATTERNS}
              style={{ opacity: patterns.length >= MAX_PATTERNS ? 0.5 : 1 }}
              title={patterns.length >= MAX_PATTERNS ? `上限（最大${MAX_PATTERNS}件）に達しています` : '新規パターンを追加'}
            >
              <Plus size={14} /> パターンを追加
            </button>
          </div>
        </div>
        <div className="chart-canvas-wrapper" style={{ height: '320px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* パターン比較カード一覧 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {results.map(({ pattern, sim, exit }) => (
          <div
            key={pattern.id}
            className="panel"
            style={{
              borderTop: `4px solid ${pattern.color}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              position: 'relative',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* カードヘッダー：カラー選択・タイトル・操作ボタン */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  <input
                    type="color"
                    value={pattern.color}
                    onChange={(e) => updatePatternMeta(pattern.id, 'color', e.target.value)}
                    title="グラフ・識別カラーを変更"
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                  />
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => updatePatternMeta(pattern.id, 'name', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.3rem 0.5rem',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      width: '100%',
                    }}
                    placeholder="パターン名"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.3rem 0.45rem' }}
                    onClick={() => handleDuplicatePattern(pattern.id)}
                    disabled={patterns.length >= MAX_PATTERNS}
                    title={patterns.length >= MAX_PATTERNS ? `上限（最大${MAX_PATTERNS}件）に達しています` : 'このパターンを複製'}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.3rem 0.45rem',
                      color: patterns.length <= MIN_PATTERNS ? 'var(--text-muted)' : '#f87171',
                    }}
                    onClick={() => handleDeletePattern(pattern.id)}
                    disabled={patterns.length <= MIN_PATTERNS}
                    title={patterns.length <= MIN_PATTERNS ? '最低1つのパターンが必要です' : 'このパターンを削除'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* 主要指標サマリー */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.65rem',
                  background: 'var(--bg-surface)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>初年度FCF</div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: sim.summary.firstYearFcf >= 0 ? '#34d399' : '#f87171',
                    }}
                  >
                    {fmt(sim.summary.firstYearFcf)} 万円
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>10年累計CF</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {fmt(sim.summary.cumulativeFcf10)} 万円
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>内部収益率 (IRR)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-accent)' }}>
                    {exit.irr !== null ? `${exit.irr.toFixed(2)}%` : '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>デッドクロス</div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: sim.summary.deadCrossYear ? '#f87171' : '#34d399',
                    }}
                  >
                    {sim.summary.deadCrossYear ? `${sim.summary.deadCrossYear}年目` : '発生なし'}
                  </div>
                </div>
              </div>
            </div>

            {/* パラメータ編集エリア */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>借入金利:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={20}
                    value={pattern.params.interestRate}
                    onChange={(e) =>
                      updatePatternParam(pattern.id, 'interestRate', parseFloat(e.target.value) || 0)
                    }
                    style={{
                      width: '75px',
                      padding: '0.25rem 0.4rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>空室率:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={100}
                    value={pattern.params.vacancyRate}
                    onChange={(e) =>
                      updatePatternParam(pattern.id, 'vacancyRate', parseFloat(e.target.value) || 0)
                    }
                    style={{
                      width: '75px',
                      padding: '0.25rem 0.4rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>返済方式:</span>
                <select
                  value={pattern.params.repaymentMethod}
                  onChange={(e) => updatePatternParam(pattern.id, 'repaymentMethod', e.target.value)}
                  style={{
                    padding: '0.25rem 0.4rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="equal-payment">元利均等返済</option>
                  <option value="equal-principal">元金均等返済</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>頭金割合:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    max={100}
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
                      padding: '0.25rem 0.4rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>%</span>
                </div>
              </div>
            </div>

            {/* フッター：基本設定へ反映ボタン */}
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.25rem' }}
              onClick={() => onApplyPatternToBase(pattern.params)}
            >
              <Check size={14} color="var(--brand-primary)" /> この条件を基本入力に反映
            </button>
          </div>
        ))}

        {/* パターン追加カード（上限未満の場合に表示） */}
        {patterns.length < MAX_PATTERNS && (
          <button
            onClick={handleAddPattern}
            className="panel"
            style={{
              border: '2px dashed var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minHeight: '260px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
              e.currentTarget.style.color = 'var(--brand-primary)';
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Plus size={22} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              新しい比較パターンを追加
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              あと {MAX_PATTERNS - patterns.length} パターン追加可能（最大{MAX_PATTERNS}件）
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
