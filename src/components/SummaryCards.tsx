import React from 'react';
import { SimulationSummary } from '../types/simulation';
import { Tooltip } from './Tooltip';
import { DollarSign, Calendar, AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';

interface SummaryCardsProps {
  summary: SimulationSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const fcfFormatted = Math.round(summary.firstYearFcf).toLocaleString();
  const fcfPositive = summary.firstYearFcf >= 0;

  const monthlyRepayFormatted = Math.round(summary.firstYearMonthlyRepayment * 10) / 10;
  const c10Formatted = Math.round(summary.cumulativeFcf10).toLocaleString();
  const c20Formatted = Math.round(summary.cumulativeFcf20).toLocaleString();
  const c35Formatted = Math.round(summary.cumulativeFcf35).toLocaleString();

  return (
    <div className="summary-grid">
      {/* 1. 初年度年間CF */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span>初年度年間キャッシュフロー</span>
          <Tooltip content="税金・元本返済・経費をすべて差し引いた後に手元に残る手残り現金（1年目）。" />
        </div>
        <div className={`kpi-value ${fcfPositive ? 'positive' : 'negative'}`}>
          <DollarSign size={20} />
          {fcfFormatted}
          <span className="kpi-unit">万円 / 年</span>
        </div>
        <div className="kpi-subtitle">
          月額換算: 約 {Math.round(summary.firstYearFcf / 12).toLocaleString()} 万円 / 月
        </div>
      </div>

      {/* 2. 毎月のローン返済額 */}
      <div className="kpi-card accent-indigo">
        <div className="kpi-header">
          <span>毎月のローン返済額</span>
          <Tooltip content="初年度の月平均返済額（元本＋利息）。" />
        </div>
        <div className="kpi-value">
          <CreditCard size={20} />
          {monthlyRepayFormatted}
          <span className="kpi-unit">万円 / 月</span>
        </div>
        <div className="kpi-subtitle">
          借入総額 {Math.round(summary.initialLoanAmount).toLocaleString()} 万円
        </div>
      </div>

      {/* 3. 累計キャッシュフロー（10年 / 20年 / 35年） */}
      <div className="kpi-card accent-indigo">
        <div className="kpi-header">
          <span>累計キャッシュフロー推移</span>
          <Tooltip content="各保有期間終了時における手残り現金の累計額（売却手残りを含まない運用CF累計）。" />
        </div>
        <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
          <Calendar size={18} />
          10年: {c10Formatted}
          <span className="kpi-unit">万円</span>
        </div>
        <div className="kpi-subtitle" style={{ display: 'flex', gap: '0.75rem' }}>
          <span>20年: {c20Formatted}万</span>
          <span>35年: {c35Formatted}万</span>
        </div>
      </div>

      {/* 4. デッドクロス発生年 */}
      <div className={`kpi-card ${summary.deadCrossYear ? 'accent-danger' : ''}`}>
        <div className="kpi-header">
          <span>デッドクロス発生年数</span>
          <Tooltip content="減価償却費が減少し「税引後利益＋減価償却費 ＜ 元本返済額」となり、利益があるのに現金が持ち出しになるリスク期間。" />
        </div>
        {summary.deadCrossYear ? (
          <>
            <div className="kpi-value negative">
              <AlertTriangle size={20} />
              {summary.deadCrossYear}
              <span className="kpi-unit">年目 に到来</span>
            </div>
            <div className="kpi-subtitle" style={{ color: '#f87171' }}>
              ※事前の繰上返済や売却計画等の対策が推奨されます
            </div>
          </>
        ) : (
          <>
            <div className="kpi-value positive">
              <ShieldCheck size={20} />
              発生なし
            </div>
            <div className="kpi-subtitle" style={{ color: '#34d399' }}>
              返済期間を通じて健全なキャッシュフローを維持
            </div>
          </>
        )}
      </div>
    </div>
  );
};
