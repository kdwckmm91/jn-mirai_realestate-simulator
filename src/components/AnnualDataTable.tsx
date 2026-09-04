import React, { useState } from 'react';
import { AnnualData } from '../types/simulation';
import { Table, ChevronDown, ChevronUp } from 'lucide-react';

interface AnnualDataTableProps {
  annualList: AnnualData[];
}

export const AnnualDataTable: React.FC<AnnualDataTableProps> = ({ annualList }) => {
  const [showAllYears, setShowAllYears] = useState(false);

  // デフォルトでは10年分、展開時は全35年表示
  const displayedList = showAllYears ? annualList : annualList.slice(0, 10);

  const fmt = (num: number) => Math.round(num).toLocaleString();

  return (
    <div className="table-container">
      <div className="table-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Table size={18} color="var(--brand-primary)" />
          詳細年次収支明細テーブル
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            （金額単位: 万円）
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowAllYears(!showAllYears)}
        >
          {showAllYears ? (
            <>
              <ChevronUp size={14} /> 10年分のみ表示
            </>
          ) : (
            <>
              <ChevronDown size={14} /> 全35年分を展開 ({annualList.length}年間)
            </>
          )}
        </button>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>年次</th>
              <th>期首ローン残高</th>
              <th>実効家賃収入</th>
              <th>運営管理費</th>
              <th>その他経費</th>
              <th>減価償却費</th>
              <th>支払利息</th>
              <th>税引前利益</th>
              <th>法人税等</th>
              <th>税引後利益</th>
              <th>元本返済額</th>
              <th>年間総返済額</th>
              <th>フリーCF (FCF)</th>
              <th>累計CF</th>
              <th>期末ローン残高</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {displayedList.map((row) => {
              const isProfitNeg = row.preTaxProfit < 0;
              const isFcfNeg = row.fcf < 0;

              return (
                <tr key={row.year} className={row.isDeadCross ? 'dead-cross-row' : ''}>
                  <td>{row.year}年目</td>
                  <td>{fmt(row.beginningBalance)}</td>
                  <td style={{ color: '#38bdf8' }}>{fmt(row.effectiveRent)}</td>
                  <td>{fmt(row.managementCost)}</td>
                  <td>{fmt(row.otherCost)}</td>
                  <td>{fmt(row.depreciation)}</td>
                  <td>{fmt(row.interestPayment)}</td>
                  <td style={{ color: isProfitNeg ? '#f87171' : '#cbd5e1' }}>
                    {fmt(row.preTaxProfit)}
                  </td>
                  <td>{fmt(row.corporateTax)}</td>
                  <td style={{ color: row.postTaxProfit < 0 ? '#f87171' : '#cbd5e1' }}>
                    {fmt(row.postTaxProfit)}
                  </td>
                  <td>{fmt(row.principalRepayment)}</td>
                  <td>{fmt(row.totalRepayment)}</td>
                  <td
                    style={{
                      color: isFcfNeg ? '#f87171' : '#34d399',
                      fontWeight: 700,
                    }}
                  >
                    {fmt(row.fcf)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmt(row.cumulativeFcf)}</td>
                  <td>{fmt(row.endingBalance)}</td>
                  <td>
                    {row.isDeadCross ? (
                      <span className="badge-deadcross">デッドクロス</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>正常</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
