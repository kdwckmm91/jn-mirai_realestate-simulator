import { AnnualData, SimulationParams } from '../types/simulation';

export function exportAnnualDataToCsv(
  params: SimulationParams,
  annualList: AnnualData[],
  filename: string = 'real_estate_simulation.csv'
): void {
  const headers = [
    '年次',
    '期首ローン残高(万円)',
    '想定満室家賃(万円)',
    '実効家賃収入(万円)',
    '運営管理費(万円)',
    'その他経費(万円)',
    '役員報酬(万円)',
    '減価償却費(万円)',
    '支払利息(万円)',
    '税引前利益(万円)',
    '法人税等(万円)',
    '税引後利益(万円)',
    '元本返済額(万円)',
    '年間総返済額(万円)',
    'フリーCF(万円)',
    '累計CF(万円)',
    '期末ローン残高(万円)',
    'デッドクロス',
  ];

  const rows: (string | number)[][] = annualList.map((row) => [
    `${row.year}年目`,
    Math.round(row.beginningBalance),
    Math.round(row.grossRent),
    Math.round(row.effectiveRent),
    Math.round(row.managementCost),
    Math.round(row.otherCost),
    Math.round(row.executiveSalary),
    Math.round(row.depreciation),
    Math.round(row.interestPayment),
    Math.round(row.preTaxProfit),
    Math.round(row.corporateTax),
    Math.round(row.postTaxProfit),
    Math.round(row.principalRepayment),
    Math.round(row.totalRepayment),
    Math.round(row.fcf),
    Math.round(row.cumulativeFcf),
    Math.round(row.endingBalance),
    row.isDeadCross ? '該当' : '-',
  ]);

  // 物件基本情報ヘッダー
  const metaLines = [
    ['# 不動産収支シミュレーション年次明細レポート'],
    ['物件価格(万円)', params.price, '建物価格割合(%)', params.buildingRatio],
    ['耐用年数(年)', params.usefulLife, '想定表面利回り(%)', params.grossYield],
    ['頭金割合(%)', params.downPaymentRatio, '借入金利(%)', params.interestRate],
    ['借入期間(年)', params.loanTermYears, '返済方式', params.repaymentMethod === 'equal-payment' ? '元利均等返済' : '元金均等返済'],
    ['空室率(%)', params.vacancyRate, '家賃下落率(%/年)', params.rentDropRate],
    [],
  ];

  const csvContent =
    '\uFEFF' + // BOM for Excel
    metaLines.map((row) => row.map((val) => `"${val ?? ''}"`).join(',')).join('\n') +
    '\n' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
