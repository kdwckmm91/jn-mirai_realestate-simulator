import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BatchPropertyInput } from '../types/batch';
import { SimulationResult } from '../types/simulation';

/**
 * 物件のA4分析レポートHTML要素を構築
 */
function createReportElement(input: BatchPropertyInput, result: SimulationResult): HTMLElement {
  const { summary, annualList, exitResult } = result;
  const p = input.rawParams;
  const fmt = (n: number) => Math.round(n).toLocaleString();

  const container = document.createElement('div');
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.minHeight = '1123px'; // A4 height at 96 DPI
  container.style.padding = '32px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = "'Noto Sans JP', 'Inter', sans-serif";
  container.style.boxSizing = 'border-box';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1000';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; color: #10b981; font-weight: bold; letter-spacing: 0.05em;">REAL ESTATE INVESTMENT ANALYSIS PRO</div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${input.propertyName}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">物件ID: ${input.propertyId} ｜ 作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #334155;">
          投資判断レポート（抜粋サマリー）
        </span>
      </div>
    </div>

    <!-- 1. 物件基本情報 & 融資条件 -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11px;">
      <div>物件価格: <strong style="color: #0f172a;">${fmt(p.price)} 万円</strong></div>
      <div>建物価格割合: <strong style="color: #0f172a;">${p.buildingRatio} %</strong></div>
      <div>耐用年数: <strong style="color: #0f172a;">${p.usefulLife} 年</strong></div>
      <div>想定表面利回り: <strong style="color: #0f172a;">${p.grossYield} %</strong></div>
      <div>頭金: <strong style="color: #0f172a;">${fmt(summary.initialDownPayment)} 万円 (${p.downPaymentRatio}%)</strong></div>
      <div>借入総額: <strong style="color: #0f172a;">${fmt(summary.initialLoanAmount)} 万円</strong></div>
      <div>借入金利: <strong style="color: #0f172a;">${p.interestRate} %</strong></div>
      <div>借入期間: <strong style="color: #0f172a;">${p.loanTermYears} 年 (${input.repaymentMethodText})</strong></div>
      <div>想定空室率: <strong style="color: #0f172a;">${p.vacancyRate} %</strong></div>
      <div>家賃下落率: <strong style="color: #0f172a;">${p.rentDropRate} %/年</strong></div>
      <div>管理＋経費率: <strong style="color: #0f172a;">${p.managementCostRatio + p.otherCostRatio} %</strong></div>
      <div>売却想定: <strong style="color: #0f172a;">${p.exitYear} 年後 (Cap ${p.exitCapRate}%)</strong></div>
    </div>

    <!-- 2. 主要財務指標 (KPI) -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
      <div style="border: 1px solid #cbd5e1; border-top: 3px solid #10b981; border-radius: 6px; padding: 10px; background: #ffffff; text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600;">初年度年間CF</div>
        <div style="font-size: 16px; font-weight: 800; color: ${summary.firstYearFcf >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">
          ${fmt(summary.firstYearFcf)} <span style="font-size: 10px; font-weight: 500;">万円/年</span>
        </div>
      </div>
      <div style="border: 1px solid #cbd5e1; border-top: 3px solid #6366f1; border-radius: 6px; padding: 10px; background: #ffffff; text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600;">10年累計CF</div>
        <div style="font-size: 16px; font-weight: 800; color: #4338ca; margin-top: 4px;">
          ${fmt(summary.cumulativeFcf10)} <span style="font-size: 10px; font-weight: 500;">万円</span>
        </div>
      </div>
      <div style="border: 1px solid #cbd5e1; border-top: 3px solid #0ea5e9; border-radius: 6px; padding: 10px; background: #ffffff; text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600;">内部収益率 (IRR)</div>
        <div style="font-size: 16px; font-weight: 800; color: #0284c7; margin-top: 4px;">
          ${exitResult.irr !== null ? `${exitResult.irr.toFixed(2)} %` : '-'}
        </div>
      </div>
      <div style="border: 1px solid #cbd5e1; border-top: 3px solid ${summary.deadCrossYear ? '#ef4444' : '#10b981'}; border-radius: 6px; padding: 10px; background: #ffffff; text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600;">デッドクロス</div>
        <div style="font-size: 15px; font-weight: 800; color: ${summary.deadCrossYear ? '#dc2626' : '#059669'}; margin-top: 4px;">
          ${summary.deadCrossYear ? `${summary.deadCrossYear}年目 到来` : '発生なし (安全)'}
        </div>
      </div>
    </div>

    <!-- 3. 出口戦略（売却）サマリー -->
    <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px; background: #f8fafc;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
        ■ ${p.exitYear}年後 売却時収支・手残りシミュレーション（Exit分析）
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 11px;">
        <div>想定売却価格: <strong>${fmt(exitResult.expectedSalePrice)} 万円</strong></div>
        <div>売却時ローン残高: <strong style="color: #dc2626;">- ${fmt(exitResult.loanBalanceAtExit)} 万円</strong></div>
        <div>譲渡所得税: <strong style="color: #dc2626;">- ${fmt(exitResult.capitalGainTax)} 万円</strong></div>
        <div>売却時手残り (Net): <strong style="color: #059669; font-size: 13px;">${fmt(exitResult.netCashAtExit)} 万円</strong></div>
      </div>
    </div>

    <!-- 4. 詳細年次収支一覧表（1〜15年） -->
    <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
      ■ 年次収支・キャッシュフロー推移表（1年目〜15年目抜粋）
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: right;">
      <thead>
        <tr style="background: #e2e8f0; color: #334155;">
          <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">年次</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">実効家賃</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">経費計</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">減価償却</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">支払利息</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">税引後利益</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">元本返済</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1; background: #dcfce7; color: #166534; font-weight: bold;">フリーCF</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">累計CF</th>
          <th style="padding: 5px; border: 1px solid #cbd5e1;">期末残高</th>
        </tr>
      </thead>
      <tbody>
        ${annualList
          .slice(0, 15)
          .map(
            (row) => `
          <tr style="border-bottom: 1px solid #e2e8f0; ${row.isDeadCross ? 'background: #fef2f2;' : ''}">
            <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.year}年</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0; color: #0284c7;">${fmt(row.effectiveRent)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0;">${fmt(row.managementCost + row.otherCost)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0;">${fmt(row.depreciation)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0;">${fmt(row.interestPayment)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0; color: ${row.postTaxProfit < 0 ? '#dc2626' : '#1e293b'};">${fmt(row.postTaxProfit)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0;">${fmt(row.principalRepayment)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0; font-weight: bold; color: ${row.fcf < 0 ? '#dc2626' : '#059669'}; background: ${row.fcf < 0 ? '#fee2e2' : '#f0fdf4'};">${fmt(row.fcf)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0; font-weight: 600;">${fmt(row.cumulativeFcf)}</td>
            <td style="padding: 4px; border: 1px solid #e2e8f0;">${fmt(row.endingBalance)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="margin-top: 16px; font-size: 9px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      ※本シミュレーションは入力値に基づく概算値であり、将来の確定的な収支を保証するものではありません。
    </div>
  `;

  return container;
}

/**
 * 1物件ごとのPDFドキュメントを生成（Uint8Arrayを返却）
 */
export async function generatePropertyPdf(
  input: BatchPropertyInput,
  result: SimulationResult
): Promise<Uint8Array> {
  const element = createReportElement(input, result);
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 高解像度
      useCORS: true,
      logging: false,
    } as any);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(297, imgHeight));

    const arrayBuffer = pdf.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  } finally {
    document.body.removeChild(element);
  }
}
