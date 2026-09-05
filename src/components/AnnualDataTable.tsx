import React, { useState } from 'react';
import { AnnualData } from '../types/simulation';
import { Table, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { TABLE_COLUMN_HELP } from '../constants/tableColumnHelp';

interface AnnualDataTableProps {
  annualList: AnnualData[];
}

const TABLE_COLUMNS = [
  { key: 'year', label: '年次' },
  { key: 'beginningBalance', label: '期首ローン残高' },
  { key: 'effectiveRent', label: '実効家賃収入' },
  { key: 'managementCost', label: '運営管理費' },
  { key: 'otherCost', label: 'その他経費' },
  { key: 'depreciation', label: '減価償却費' },
  { key: 'interestPayment', label: '支払利息' },
  { key: 'preTaxProfit', label: '税引前利益' },
  { key: 'corporateTax', label: '法人税等' },
  { key: 'postTaxProfit', label: '税引後利益' },
  { key: 'principalRepayment', label: '元本返済額' },
  { key: 'totalRepayment', label: '年間総返済額' },
  { key: 'fcf', label: 'フリーCF (FCF)' },
  { key: 'cumulativeFcf', label: '累計CF' },
  { key: 'endingBalance', label: '期末ローン残高' },
  { key: 'status', label: '状態' },
] as const;

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
              {TABLE_COLUMNS.map((col) => {
                const help = TABLE_COLUMN_HELP[col.key];
                return (
                  <th key={col.key}>
                    <div className="table-th-content">
                      <span>{col.label}</span>
                      {help && (
                        <Tooltip
                          title={help.label}
                          content={help.description}
                          formula={help.formula}
                          icon="info"
                          iconSize={13}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
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
