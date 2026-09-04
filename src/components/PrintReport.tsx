import React from 'react';
import { AnnualData, ExitAnalysisResult, SimulationParams, SimulationSummary } from '../types/simulation';

interface PrintReportProps {
  params: SimulationParams;
  summary: SimulationSummary;
  annualList: AnnualData[];
  exitResult: ExitAnalysisResult;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  params,
  summary,
  annualList,
  exitResult,
}) => {
  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="print-report-container" style={{ display: 'none' }}>
      <style>{`
        @media print {
          .print-report-container {
            display: block !important;
            padding: 20px;
            background: white !important;
            color: black !important;
            font-family: sans-serif;
            font-size: 11px;
          }
          .print-header {
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .print-title {
            font-size: 18px;
            font-weight: bold;
          }
          .print-meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
            border: 1px solid #ccc;
            padding: 8px;
          }
          .print-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }
          .print-kpi-box {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          .print-kpi-title {
            font-size: 10px;
            color: #555;
          }
          .print-kpi-val {
            font-size: 16px;
            font-weight: bold;
            margin-top: 4px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 10px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            text-align: right;
          }
          .print-table th {
            background-color: #f0f0f0;
            text-align: center;
          }
          .print-table th:first-child, .print-table td:first-child {
            text-align: center;
          }
        }
      `}</style>

      <div className="print-header">
        <div>
          <div className="print-title">不動産収支シミュレーション 投資判断レポート</div>
          <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
            出力日時: {new Date().toLocaleString('ja-JP')}
          </div>
        </div>
        <div style={{ fontWeight: 'bold' }}>Real Estate Investment Pro</div>
      </div>

      {/* 物件基本パラメータ */}
      <div className="print-meta-grid">
        <div>物件価格: <strong>{fmt(params.price)} 万円</strong></div>
        <div>建物価格割合: <strong>{params.buildingRatio} %</strong></div>
        <div>法定耐用年数: <strong>{params.usefulLife} 年</strong></div>
        <div>想定表面利回り: <strong>{params.grossYield} %</strong></div>
        <div>頭金割合: <strong>{params.downPaymentRatio} %</strong></div>
        <div>借入金利: <strong>{params.interestRate} %</strong></div>
        <div>借入期間: <strong>{params.loanTermYears} 年</strong></div>
        <div>返済方式: <strong>{params.repaymentMethod === 'equal-payment' ? '元利均等' : '元金均等'}</strong></div>
        <div>空室率: <strong>{params.vacancyRate} %</strong></div>
        <div>家賃下落率: <strong>{params.rentDropRate} %/年</strong></div>
        <div>管理費＋その他: <strong>{params.managementCostRatio + params.otherCostRatio} %</strong></div>
        <div>売却予定年: <strong>{params.exitYear} 年後</strong> (Cap: {params.exitCapRate}%)</div>
      </div>

      {/* 主要財務指標 KPI */}
      <div className="print-kpi-grid">
        <div className="print-kpi-box">
          <div className="print-kpi-title">初年度年間CF</div>
          <div className="print-kpi-val">{fmt(summary.firstYearFcf)} 万円</div>
        </div>
        <div className="print-kpi-box">
          <div className="print-kpi-title">10年累計CF</div>
          <div className="print-kpi-val">{fmt(summary.cumulativeFcf10)} 万円</div>
        </div>
        <div className="print-kpi-box">
          <div className="print-kpi-title">内部収益率 (IRR)</div>
          <div className="print-kpi-val">{exitResult.irr !== null ? `${exitResult.irr.toFixed(2)}%` : '-'}</div>
        </div>
        <div className="print-kpi-box">
          <div className="print-kpi-title">デッドクロス発生年</div>
          <div className="print-kpi-val">{summary.deadCrossYear ? `${summary.deadCrossYear}年目` : 'なし'}</div>
        </div>
      </div>

      {/* 出口戦略サマリー */}
      <div style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '14px', fontSize: '10px' }}>
        <strong>【{params.exitYear}年後 売却時収支シミュレーション】</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
          <div>想定売却価格: {fmt(exitResult.expectedSalePrice)} 万円</div>
          <div>売却時ローン残高: {fmt(exitResult.loanBalanceAtExit)} 万円</div>
          <div>譲渡所得税: {fmt(exitResult.capitalGainTax)} 万円</div>
          <div>売却手残り額 (Net): <strong>{fmt(exitResult.netCashAtExit)} 万円</strong></div>
        </div>
      </div>

      {/* 簡易年次推移表（10年間） */}
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>年次収支推移表（抜粋）</div>
      <table className="print-table">
        <thead>
          <tr>
            <th>年次</th>
            <th>期首残高</th>
            <th>実効家賃</th>
            <th>経費計</th>
            <th>減価償却</th>
            <th>支払利息</th>
            <th>税引後利益</th>
            <th>元本返済</th>
            <th>フリーCF</th>
            <th>累計CF</th>
            <th>期末残高</th>
          </tr>
        </thead>
        <tbody>
          {annualList.slice(0, 15).map((row) => (
            <tr key={row.year}>
              <td>{row.year}年</td>
              <td>{fmt(row.beginningBalance)}</td>
              <td>{fmt(row.effectiveRent)}</td>
              <td>{fmt(row.managementCost + row.otherCost)}</td>
              <td>{fmt(row.depreciation)}</td>
              <td>{fmt(row.interestPayment)}</td>
              <td>{fmt(row.postTaxProfit)}</td>
              <td>{fmt(row.principalRepayment)}</td>
              <td style={{ fontWeight: 'bold' }}>{fmt(row.fcf)}</td>
              <td>{fmt(row.cumulativeFcf)}</td>
              <td>{fmt(row.endingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
