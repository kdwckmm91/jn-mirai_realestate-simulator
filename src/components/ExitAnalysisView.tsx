import React from 'react';
import { ExitAnalysisResult, SimulationParams, AnnualData } from '../types/simulation';
import { Tooltip } from './Tooltip';
import { calculateExitAnalysis } from '../utils/exitCalculation';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface ExitAnalysisViewProps {
  params: SimulationParams;
  annualList: AnnualData[];
  exitResult: ExitAnalysisResult;
  onChangeParams: (params: SimulationParams) => void;
}

export const ExitAnalysisView: React.FC<ExitAnalysisViewProps> = ({
  params,
  annualList,
  exitResult,
  onChangeParams,
}) => {
  const fmt = (n: number) => Math.round(n).toLocaleString();

  // 異なる保有年数（5年、10年、15年、20年、25年、30年）でのExit試算
  const milestoneYears = [5, 10, 15, 20, 25, 30].filter((y) => y <= params.loanTermYears);
  const milestones = milestoneYears.map((yr) => {
    const customParams: SimulationParams = {
      ...params,
      exitYear: yr,
      // 5年超は長期譲渡税率20.315%、5年以下は短期39.63%
      capitalGainTaxRate: yr <= 5 ? 39.63 : 20.315,
    };
    return calculateExitAnalysis(customParams, annualList);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIカード群 */}
      <div className="summary-grid">
        {/* 1. 内部収益率 (IRR) */}
        <div className="kpi-card accent-indigo">
          <div className="kpi-header">
            <span>内部収益率（IRR）</span>
            <Tooltip content="初期投資額（頭金）に対する、運用中CFと売却手残り額を含めた年平均利回り。" />
          </div>
          <div className="kpi-value positive" style={{ fontSize: '1.8rem' }}>
            <Percent size={20} />
            {exitResult.irr !== null ? `${exitResult.irr.toFixed(2)}` : '算出不能'}
            <span className="kpi-unit">% / 年</span>
          </div>
          <div className="kpi-subtitle">
            {exitResult.exitYear}年後に売却した場合の総合収益性
          </div>
        </div>

        {/* 2. 総手残り額 (Total Net Return) */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>総手残り現金（累計CF＋売却手残り）</span>
            <Tooltip content="保有期間中の累計フリーCFと、売却時に借入を全額返済し税金を払った後の最終手残り額の合算。" />
          </div>
          <div className="kpi-value positive">
            <DollarSign size={20} />
            {fmt(exitResult.totalReturnCash)}
            <span className="kpi-unit">万円</span>
          </div>
          <div className="kpi-subtitle">
            投下自己資金 {fmt(exitResult.initialEquity)} 万円 に対する回収
          </div>
        </div>

        {/* 3. 売却時手残り額 (Net Cash) */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>売却時手残り額 (Exit Net Cash)</span>
            <Tooltip content="想定売却価格から、ローン残債一括返済・売却諸経費・譲渡所得税を控除した実効手残り現金額。" />
          </div>
          <div className="kpi-value">
            <DollarSign size={20} />
            {fmt(exitResult.netCashAtExit)}
            <span className="kpi-unit">万円</span>
          </div>
          <div className="kpi-subtitle">
            売却時ローン残高: {fmt(exitResult.loanBalanceAtExit)} 万円
          </div>
        </div>

        {/* 4. 想定売却価格 */}
        <div className="kpi-card accent-indigo">
          <div className="kpi-header">
            <span>想定売却価格 (Exit Cap: {params.exitCapRate}%)</span>
            <Tooltip content="売却年の満室家賃収入 ÷ 出口想定利回り（Cap Rate）によって算出した予想成約価格。" />
          </div>
          <div className="kpi-value">
            {fmt(exitResult.expectedSalePrice)}
            <span className="kpi-unit">万円</span>
          </div>
          <div className="kpi-subtitle">
            購入価格比: {((exitResult.expectedSalePrice / params.price) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 売却時収支の内訳ウォーターフォール表示 */}
      <div className="panel">
        <div className="panel-title">
          <TrendingUp size={18} color="var(--brand-primary)" />
          {exitResult.exitYear}年目 売却（Exit）収支・税金・手残り詳細内訳
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              売却価格と簿価
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>想定売却価格</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{fmt(exitResult.expectedSalePrice)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>売却諸経費 ({params.exitCostRatio}%)</span>
              <span style={{ color: '#f87171' }}>- {fmt(exitResult.saleExpenses)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>土地簿価</span>
              <span>{fmt(exitResult.landValue)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>建物簿価（償却後）</span>
              <span>{fmt(exitResult.buildingBookValue)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>売却時総簿価</span>
              <span style={{ fontWeight: 600 }}>{fmt(exitResult.totalBookValue)} 万円</span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              譲渡所得税・ローン返済
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>課税譲渡益</span>
              <span style={{ fontWeight: 600, color: exitResult.capitalGain > 0 ? '#34d399' : '#94a3b8' }}>
                {fmt(exitResult.capitalGain)} 万円
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>譲渡所得税 ({params.capitalGainTaxRate}%)</span>
              <span style={{ color: '#f87171' }}>- {fmt(exitResult.capitalGainTax)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>売却時ローン残高</span>
              <span style={{ color: '#f87171' }}>- {fmt(exitResult.loanBalanceAtExit)} 万円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>売却手残り額 (Net Cash)</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '1.05rem' }}>
                {fmt(exitResult.netCashAtExit)} 万円
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 保有年数別 Exit比較テーブル */}
      <div className="table-container">
        <div className="table-header-bar">
          <div style={{ fontWeight: 600 }}>保有期間別 売却シミュレーション比較（5年〜30年推移）</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ※5年以内は短期譲渡所得税率（39.63%）、5年超は長期（20.315%）を自動適用
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>保有期間</th>
                <th>想定売却価格</th>
                <th>ローン残債</th>
                <th>建物簿価</th>
                <th>譲渡益</th>
                <th>譲渡税</th>
                <th>売却手残り額</th>
                <th>運用累計CF</th>
                <th>総手残り額</th>
                <th>IRR（年利回り）</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const isSelected = m.exitYear === params.exitYear;
                return (
                  <tr
                    key={m.exitYear}
                    style={{
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : undefined,
                    }}
                  >
                    <td>
                      <strong>{m.exitYear}年後</strong> {isSelected && '(選択中)'}
                    </td>
                    <td>{fmt(m.expectedSalePrice)}万</td>
                    <td style={{ color: '#f87171' }}>{fmt(m.loanBalanceAtExit)}万</td>
                    <td>{fmt(m.buildingBookValue)}万</td>
                    <td>{fmt(m.capitalGain)}万</td>
                    <td>{fmt(m.capitalGainTax)}万</td>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{fmt(m.netCashAtExit)}万</td>
                    <td>{fmt(m.cumulativeFcfUntilExit)}万</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>{fmt(m.totalReturnCash)}万</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>
                      {m.irr !== null ? `${m.irr.toFixed(2)}%` : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onChangeParams({ ...params, exitYear: m.exitYear })}
                      >
                        この年を選択
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
