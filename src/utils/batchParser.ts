import * as XLSX from 'xlsx';
import { BatchParseResult, BatchPropertyInput, BatchValidationError } from '../types/batch';
import { DEFAULT_PARAMS } from './calculation';
import { RepaymentMethod, SimulationParams } from '../types/simulation';

export const TEMPLATE_COLUMNS = [
  { key: 'propertyId', label: '物件ID' },
  { key: 'propertyName', label: '物件名称' },
  { key: 'price', label: '物件価格(万円)' },
  { key: 'buildingRatio', label: '建物価格割合(%)' },
  { key: 'usefulLife', label: '建物法定耐用年数(年)' },
  { key: 'grossYield', label: '想定表面利回り(%)' },
  { key: 'repaymentMethod', label: '返済方式' },
  { key: 'downPaymentRatio', label: '頭金割合(%)' },
  { key: 'interestRate', label: '借入金利(%)' },
  { key: 'loanTermYears', label: '借入期間(年)' },
  { key: 'vacancyRate', label: '想定空室率(%)' },
  { key: 'rentDropRate', label: '家賃下落率(%/年)' },
  { key: 'managementCostRatio', label: '運営管理費率(%)' },
  { key: 'otherCostRatio', label: 'その他経費率(%)' },
  { key: 'exitYear', label: '保有・売却予定年数(年)' },
  { key: 'exitCapRate', label: '売却時想定出口利回り(%)' },
];

/**
 * 標準Excel入力テンプレートの生成 & ダウンロード
 */
export function generateAndDownloadTemplate(filename: string = '複数物件シミュレーション_入力テンプレート.xlsx'): void {
  const headers = TEMPLATE_COLUMNS.map((col) => col.label);

  const sampleRows = [
    [
      'PROP-001',
      '島根ハイツ (サンプル1)',
      10000,
      50,
      7,
      9.0,
      '元利均等',
      5,
      3.3,
      35,
      5.0,
      1.0,
      15.0,
      5.0,
      10,
      9.5,
    ],
    [
      'PROP-002',
      '横浜レジデンス (サンプル2)',
      18000,
      60,
      15,
      7.5,
      '元利均等',
      10,
      2.5,
      30,
      4.0,
      0.8,
      12.0,
      4.0,
      12,
      8.0,
    ],
  ];

  // ワークブック作成
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 列幅の調整
  ws['!cols'] = [
    { wch: 14 }, // 物件ID
    { wch: 28 }, // 物件名称
    { wch: 16 }, // 物件価格
    { wch: 18 }, // 建物価格割合
    { wch: 22 }, // 耐用年数
    { wch: 18 }, // 表面利回り
    { wch: 14 }, // 返済方式
    { wch: 14 }, // 頭金割合
    { wch: 14 }, // 借入金利
    { wch: 14 }, // 借入期間
    { wch: 16 }, // 想定空室率
    { wch: 18 }, // 家賃下落率
    { wch: 18 }, // 運営管理費率
    { wch: 16 }, // その他経費率
    { wch: 24 }, // 保有・売却予定年数
    { wch: 26 }, // 売却時想定出口利回り
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Property_List');
  XLSX.writeFile(wb, filename);
}

/**
 * アップロードされたExcelファイルを解析・バリデーション
 */
export async function parseBatchExcelFile(file: File): Promise<BatchParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // シートの特定（Property_List を優先、なければ先頭シート）
  const sheetName = workbook.SheetNames.includes('Property_List')
    ? 'Property_List'
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Excelファイル内に有効なシートが見つかりませんでした。');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawRows.length <= 1) {
    throw new Error('Excelファイルにデータ行が含まれていません（2行目以降に物件データを入力してください）。');
  }

  const headerRow = rawRows[0].map((h) => String(h || '').trim());
  const validProperties: BatchPropertyInput[] = [];
  const errors: BatchValidationError[] = [];
  const seenIds = new Set<string>();

  // 列インデックスのマッピング
  const colIndex: { [key: string]: number } = {};
  TEMPLATE_COLUMNS.forEach((col) => {
    const idx = headerRow.findIndex((h) => h.includes(col.label) || h.includes(col.key));
    if (idx !== -1) {
      colIndex[col.key] = idx;
    }
  });

  // 必須列の存在チェック
  const requiredKeys = ['propertyId', 'propertyName', 'price', 'usefulLife', 'grossYield', 'interestRate', 'loanTermYears'];
  const missingHeaders = requiredKeys.filter((k) => colIndex[k] === undefined);
  if (missingHeaders.length > 0) {
    // 順序ベース（A〜P）フォールバック
    TEMPLATE_COLUMNS.forEach((col, idx) => {
      if (colIndex[col.key] === undefined) {
        colIndex[col.key] = idx;
      }
    });
  }

  // 2行目以降のデータパース
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const rowNumber = r + 1;

    // 全て空行ならスキップ
    if (row.every((cell) => cell === '' || cell === null || cell === undefined)) {
      continue;
    }

    const getVal = (key: string) => {
      const idx = colIndex[key];
      return idx !== undefined && row[idx] !== undefined ? row[idx] : '';
    };

    const rawId = String(getVal('propertyId')).trim();
    const rawName = String(getVal('propertyName')).trim();
    const rawPrice = getVal('price');
    const rawBuildingRatio = getVal('buildingRatio');
    const rawUsefulLife = getVal('usefulLife');
    const rawGrossYield = getVal('grossYield');
    const rawRepaymentMethod = String(getVal('repaymentMethod')).trim();
    const rawDownPaymentRatio = getVal('downPaymentRatio');
    const rawInterestRate = getVal('interestRate');
    const rawLoanTermYears = getVal('loanTermYears');
    const rawVacancyRate = getVal('vacancyRate');
    const rawRentDropRate = getVal('rentDropRate');
    const rawManagementCostRatio = getVal('managementCostRatio');
    const rawOtherCostRatio = getVal('otherCostRatio');
    const rawExitYear = getVal('exitYear');
    const rawExitCapRate = getVal('exitCapRate');

    let rowHasError = false;

    // 1. 物件ID
    if (!rawId) {
      errors.push({ rowNumber, column: '物件ID', message: '物件IDが入力されていません。' });
      rowHasError = true;
    } else if (seenIds.has(rawId)) {
      errors.push({ rowNumber, propertyId: rawId, column: '物件ID', message: `物件ID「${rawId}」が他の行と重複しています。` });
      rowHasError = true;
    } else {
      seenIds.add(rawId);
    }

    // 2. 物件名称
    if (!rawName) {
      errors.push({ rowNumber, propertyId: rawId, column: '物件名称', message: '物件名称が入力されていません。' });
      rowHasError = true;
    }

    // 3. 物件価格
    const price = Number(rawPrice);
    if (rawPrice === '' || isNaN(price) || price <= 0) {
      errors.push({ rowNumber, propertyId: rawId, propertyName: rawName, column: '物件価格', message: '物件価格は正の数値を入力してください。' });
      rowHasError = true;
    }

    // 4. 耐用年数
    const usefulLife = Number(rawUsefulLife);
    if (rawUsefulLife === '' || isNaN(usefulLife) || usefulLife < 1 || usefulLife > 50) {
      errors.push({ rowNumber, propertyId: rawId, propertyName: rawName, column: '建物法定耐用年数', message: '耐用年数は1〜50の数値を入力してください。' });
      rowHasError = true;
    }

    // 5. 想定表面利回り
    const grossYield = Number(rawGrossYield);
    if (rawGrossYield === '' || isNaN(grossYield) || grossYield <= 0) {
      errors.push({ rowNumber, propertyId: rawId, propertyName: rawName, column: '想定表面利回り', message: '表面利回りは正の数値を入力してください。' });
      rowHasError = true;
    }

    // 6. 借入金利
    const interestRate = Number(rawInterestRate);
    if (rawInterestRate === '' || isNaN(interestRate) || interestRate < 0) {
      errors.push({ rowNumber, propertyId: rawId, propertyName: rawName, column: '借入金利', message: '借入金利は0以上の数値を入力してください。' });
      rowHasError = true;
    }

    // 7. 借入期間
    const loanTermYears = Number(rawLoanTermYears);
    if (rawLoanTermYears === '' || isNaN(loanTermYears) || loanTermYears < 1 || loanTermYears > 50) {
      errors.push({ rowNumber, propertyId: rawId, propertyName: rawName, column: '借入期間', message: '借入期間は1〜50の数値を入力してください。' });
      rowHasError = true;
    }

    // 任意項目のデフォルト補完
    const buildingRatio = rawBuildingRatio !== '' && !isNaN(Number(rawBuildingRatio)) ? Number(rawBuildingRatio) : 50;
    const downPaymentRatio = rawDownPaymentRatio !== '' && !isNaN(Number(rawDownPaymentRatio)) ? Number(rawDownPaymentRatio) : 0;
    const vacancyRate = rawVacancyRate !== '' && !isNaN(Number(rawVacancyRate)) ? Number(rawVacancyRate) : 5.0;
    const rentDropRate = rawRentDropRate !== '' && !isNaN(Number(rawRentDropRate)) ? Number(rawRentDropRate) : 1.0;
    const managementCostRatio = rawManagementCostRatio !== '' && !isNaN(Number(rawManagementCostRatio)) ? Number(rawManagementCostRatio) : 15.0;
    const otherCostRatio = rawOtherCostRatio !== '' && !isNaN(Number(rawOtherCostRatio)) ? Number(rawOtherCostRatio) : 5.0;
    const exitYear = rawExitYear !== '' && !isNaN(Number(rawExitYear)) ? Math.max(1, Math.min(35, Number(rawExitYear))) : 10;
    const exitCapRate = rawExitCapRate !== '' && !isNaN(Number(rawExitCapRate)) && Number(rawExitCapRate) > 0 ? Number(rawExitCapRate) : Math.max(0.1, grossYield + 0.5);

    let repaymentMethod: RepaymentMethod = 'equal-payment';
    if (rawRepaymentMethod.includes('元金均等') || rawRepaymentMethod === 'equal-principal') {
      repaymentMethod = 'equal-principal';
    }

    if (!rowHasError) {
      const rawParams: SimulationParams = {
        ...DEFAULT_PARAMS,
        price,
        buildingRatio,
        usefulLife,
        grossYield,
        repaymentMethod,
        downPaymentRatio,
        interestRate,
        loanTermYears,
        vacancyRate,
        rentDropRate,
        managementCostRatio,
        otherCostRatio,
        exitYear,
        exitCapRate,
      };

      validProperties.push({
        rowNumber,
        propertyId: rawId,
        propertyName: rawName,
        price,
        buildingRatio,
        usefulLife,
        grossYield,
        repaymentMethodText: repaymentMethod === 'equal-payment' ? '元利均等' : '元金均等',
        downPaymentRatio,
        interestRate,
        loanTermYears,
        vacancyRate,
        rentDropRate,
        managementCostRatio,
        otherCostRatio,
        exitYear,
        exitCapRate,
        rawParams,
      });
    }
  }

  // 最大50件制限のチェック
  if (validProperties.length > 50) {
    throw new Error(`一度に処理できる物件数は最大50件までです（読み込まれた有効物件数: ${validProperties.length}件）。`);
  }

  return {
    validProperties,
    errors,
    totalRows: rawRows.length - 1,
  };
}

/**
 * ファイル名サニタイズ（/ \ : * ? " < > | を置換）
 */
export function sanitizeFilename(str: string): string {
  return str.replace(/[\\/:*?"<>|]/g, '_').trim();
}
