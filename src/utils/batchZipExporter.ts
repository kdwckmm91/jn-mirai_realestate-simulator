import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { BatchSimulationItem } from '../types/batch';
import { generatePropertyPdf } from './batchPdfGenerator';
import { sanitizeFilename } from './batchParser';

/**
 * 1物件ごとの年次明細CSV文字列（UTF-8 BOM付き）を生成
 */
export function generatePropertyDetailCsvContent(item: BatchSimulationItem): string {
  const { input, result } = item;
  const { annualList } = result;
  const p = input.rawParams;

  const headers = [
    '年次',
    '期首ローン残高(万円)',
    '想定満室家賃(万円)',
    '実効家賃収入(万円)',
    '運営管理費(万円)',
    'その他経費(万円)',
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

  const metaLines = [
    [`# 物件詳細収支明細レポート: ${input.propertyName} (${input.propertyId})`],
    ['物件価格(万円)', p.price, '建物価格割合(%)', p.buildingRatio],
    ['耐用年数(年)', p.usefulLife, '想定表面利回り(%)', p.grossYield],
    ['頭金割合(%)', p.downPaymentRatio, '借入金利(%)', p.interestRate],
    ['借入期間(年)', p.loanTermYears, '返済方式', input.repaymentMethodText],
    ['想定空室率(%)', p.vacancyRate, '家賃下落率(%/年)', p.rentDropRate],
    ['売却予定年(年)', p.exitYear, '想定出口利回り(%)', p.exitCapRate],
    [],
  ];

  return (
    '\uFEFF' +
    metaLines.map((row) => row.map((val) => `"${val ?? ''}"`).join(',')).join('\n') +
    '\n' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n')
  );
}

/**
 * 全物件サマリーExcel（.xlsx）のバイナリ（Uint8Array）を生成
 */
export function generateSummaryExcelBinary(items: BatchSimulationItem[]): Uint8Array {
  const headers = [
    '物件ID',
    '物件名称',
    '物件価格(万円)',
    '表面利回り(%)',
    '頭金割合(%)',
    '借入金利(%)',
    '借入期間(年)',
    '返済方式',
    '空室率(%)',
    '初年度年間CF(万円)',
    '10年累計CF(万円)',
    '20年累計CF(万円)',
    '35年累計CF(万円)',
    'デッドクロス発生年',
    '売却想定年(年後)',
    '想定売却価格(万円)',
    '売却時手残り額(万円)',
    '総手残り額(万円)',
    '内部収益率IRR(%)',
  ];

  const rows = items.map(({ input, result }) => {
    const { summary, exitResult } = result;
    const p = input.rawParams;
    return [
      input.propertyId,
      input.propertyName,
      p.price,
      p.grossYield,
      p.downPaymentRatio,
      p.interestRate,
      p.loanTermYears,
      input.repaymentMethodText,
      p.vacancyRate,
      Math.round(summary.firstYearFcf),
      Math.round(summary.cumulativeFcf10),
      Math.round(summary.cumulativeFcf20),
      Math.round(summary.cumulativeFcf35),
      summary.deadCrossYear ? `${summary.deadCrossYear}年目` : '発生なし',
      p.exitYear,
      Math.round(exitResult.expectedSalePrice),
      Math.round(exitResult.netCashAtExit),
      Math.round(exitResult.totalReturnCash),
      exitResult.irr !== null ? `${exitResult.irr.toFixed(2)}%` : '-',
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = [
    { wch: 14 }, // 物件ID
    { wch: 28 }, // 物件名称
    { wch: 15 }, // 価格
    { wch: 14 }, // 利回り
    { wch: 12 }, // 頭金
    { wch: 12 }, // 金利
    { wch: 12 }, // 期間
    { wch: 14 }, // 返済方式
    { wch: 12 }, // 空室率
    { wch: 18 }, // 初年度CF
    { wch: 16 }, // 10年累計
    { wch: 16 }, // 20年累計
    { wch: 16 }, // 35年累計
    { wch: 18 }, // デッドクロス
    { wch: 16 }, // 売却年
    { wch: 18 }, // 売却価格
    { wch: 18 }, // 売却手残り
    { wch: 18 }, // 総手残り
    { wch: 16 }, // IRR
  ];

  XLSX.utils.book_append_sheet(wb, ws, '全物件サマリー');
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbOut);
}

/**
 * 全物件のCSV/PDF/サマリーをZIPアーカイブ化してダウンロード
 */
export async function exportBatchSimulationZip(
  items: BatchSimulationItem[],
  onProgress?: (current: number, total: number, propertyName: string) => void
): Promise<void> {
  const zip = new JSZip();
  const total = items.length;

  const pdfFolder = zip.folder('01_PDF_Reports');
  const csvFolder = zip.folder('02_CSV_Details');

  // 各物件のPDF & CSV生成
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { input, result } = item;
    const baseName = sanitizeFilename(`${input.propertyId}_${input.propertyName}`);

    if (onProgress) {
      onProgress(i + 1, total, input.propertyName);
    }

    // 1. PDF生成
    const pdfBytes = await generatePropertyPdf(input, result);
    pdfFolder?.file(`${baseName}_分析レポート.pdf`, pdfBytes);

    // 2. CSV生成
    const csvContent = generatePropertyDetailCsvContent(item);
    csvFolder?.file(`${baseName}_年次明細.csv`, csvContent);
  }

  // 3. 全物件一覧サマリー（.xlsx）
  const summaryXlsxBytes = generateSummaryExcelBinary(items);
  zip.file('全物件一覧サマリー.xlsx', summaryXlsxBytes);

  // ZIPファイルのビルド
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // ダウンロードトリガー
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const zipFilename = `simulation_results_${dateStr}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
