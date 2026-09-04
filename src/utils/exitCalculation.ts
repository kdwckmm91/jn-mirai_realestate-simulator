import { AnnualData, ExitAnalysisResult, SimulationParams } from '../types/simulation';

/**
 * 内部収益率（IRR）の二分法計算
 * cashFlows: [CF0, CF1, CF2, ..., CFn]
 * CF0: 初期投資額（通常マイナス）
 */
export function calculateIRR(cashFlows: number[], maxIterations: number = 1000, tolerance: number = 1e-6): number | null {
  if (cashFlows.length < 2) return null;

  // すべて同符号の場合はIRR解なし
  const hasPositive = cashFlows.some((cf) => cf > 0);
  const hasNegative = cashFlows.some((cf) => cf < 0);
  if (!hasPositive || !hasNegative) return null;

  // NPV関数
  const npv = (rate: number): number => {
    return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
  };

  // 探索範囲: -90% 〜 1000%
  let low = -0.9;
  let high = 10.0;
  let npvLow = npv(low);
  let npvHigh = npv(high);

  if (npvLow * npvHigh > 0) {
    // 範囲を少し広げて再チェック
    low = -0.99;
    high = 50.0;
    npvLow = npv(low);
    npvHigh = npv(high);
    if (npvLow * npvHigh > 0) return null;
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid * 100; // パーセントで返却
    }

    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return ((low + high) / 2) * 100;
}

/**
 * 売却時（Exit）シミュレーション計算
 */
export function calculateExitAnalysis(
  params: SimulationParams,
  annualList: AnnualData[]
): ExitAnalysisResult {
  const exitYear = Math.max(1, Math.min(params.exitYear, annualList.length));
  const exitAnnualData = annualList[exitYear - 1];

  const landPrice = params.price * (1 - params.buildingRatio / 100);
  const buildingPrice = params.price * (params.buildingRatio / 100);
  const initialEquity = params.price * (params.downPaymentRatio / 100);

  // 売却年の想定家賃収入
  const grossRentAtExit = exitAnnualData ? exitAnnualData.grossRent : 0;

  // 想定売却価格 = 想定家賃収入 / 想定出口利回り
  const capRate = params.exitCapRate > 0 ? params.exitCapRate / 100 : 0.095;
  const expectedSalePrice = grossRentAtExit / capRate;

  // 累計減価償却費
  let cumulativeDepreciation = 0;
  for (let y = 0; y < exitYear; y++) {
    cumulativeDepreciation += annualList[y]?.depreciation || 0;
  }
  const buildingBookValue = Math.max(0, buildingPrice - cumulativeDepreciation);
  const totalBookValue = landPrice + buildingBookValue;

  // 売却経費
  const saleExpenses = expectedSalePrice * (params.exitCostRatio / 100);

  // 譲渡益 = 想定売却価格 - (売却時総簿価 + 売却経費)
  const capitalGain = expectedSalePrice - (totalBookValue + saleExpenses);

  // 譲渡所得税 = max(0, 譲渡益 × 譲渡所得税率)
  const capitalGainTax = Math.max(0, capitalGain * (params.capitalGainTaxRate / 100));

  // 売却時ローン残高
  const loanBalanceAtExit = exitAnnualData ? exitAnnualData.endingBalance : 0;

  // 売却時手残り額 (Net Cash) = 想定売却価格 - 売却経費 - 売却時ローン残高 - 譲渡所得税
  const netCashAtExit = expectedSalePrice - saleExpenses - loanBalanceAtExit - capitalGainTax;

  // 保有期間中の累計FCF
  const cumulativeFcfUntilExit = exitAnnualData ? exitAnnualData.cumulativeFcf : 0;

  // 総手残り額 = 累計FCF + 売却時手残り額
  const totalReturnCash = cumulativeFcfUntilExit + netCashAtExit;

  // IRR計算用のキャッシュフロー作成
  // 0年目: -初期投資 (頭金)
  // 1 〜 (exitYear-1)年目: 各年のFCF
  // exitYear年目: その年のFCF + 売却時手残り額
  const cashFlows: number[] = [-initialEquity];
  for (let y = 1; y < exitYear; y++) {
    cashFlows.push(annualList[y - 1]?.fcf || 0);
  }
  const finalYearAnnualFcf = exitAnnualData ? exitAnnualData.fcf : 0;
  cashFlows.push(finalYearAnnualFcf + netCashAtExit);

  const irr = calculateIRR(cashFlows);

  return {
    exitYear,
    grossRentAtExit,
    expectedSalePrice,
    buildingBookValue,
    landValue: landPrice,
    totalBookValue,
    saleExpenses,
    capitalGain,
    capitalGainTax,
    loanBalanceAtExit,
    netCashAtExit,
    cumulativeFcfUntilExit,
    totalReturnCash,
    initialEquity,
    irr,
  };
}
