import { AnnualData, SimulationParams, SimulationSummary } from '../types/simulation';

export const DEFAULT_PARAMS: SimulationParams = {
  price: 10000,
  buildingRatio: 50,
  usefulLife: 7,
  grossYield: 9.0,
  downPaymentRatio: 5,
  interestRate: 3.3,
  loanTermYears: 35,
  repaymentMethod: 'equal-payment', // Phase 2: 初期値 元利均等返済
  vacancyRate: 5.0,
  rentDropRate: 1.0,
  managementCostRatio: 15.0,
  otherCostRatio: 5.0,
  executiveSalary: 0,
  taxRate: 23.0,
  exitYear: 10,
  exitCapRate: 9.5,
  capitalGainTaxRate: 20.315,
  exitCostRatio: 3.0,
};

/**
 * 融資の年次返済スケジュールを計算
 */
interface LoanYearSchedule {
  year: number;
  beginningBalance: number;
  principalRepayment: number;
  interestPayment: number;
  endingBalance: number;
}

export function calculateLoanSchedules(
  loanTotal: number,
  interestRatePct: number,
  loanTermYears: number,
  repaymentMethod: 'equal-principal' | 'equal-payment',
  maxYears: number = 35
): LoanYearSchedule[] {
  const schedules: LoanYearSchedule[] = [];
  const rAnnual = interestRatePct / 100;

  if (repaymentMethod === 'equal-principal') {
    // 元金均等返済
    const annualPrincipal = loanTermYears > 0 ? loanTotal / loanTermYears : 0;
    let currentBalance = loanTotal;

    for (let year = 1; year <= maxYears; year++) {
      if (year <= loanTermYears && currentBalance > 0.00001) {
        const beginning = currentBalance;
        const principal = Math.min(annualPrincipal, beginning);
        const interest = beginning * rAnnual;
        const ending = Math.max(0, beginning - principal);
        currentBalance = ending;

        schedules.push({
          year,
          beginningBalance: beginning,
          principalRepayment: principal,
          interestPayment: interest,
          endingBalance: ending,
        });
      } else {
        schedules.push({
          year,
          beginningBalance: 0,
          principalRepayment: 0,
          interestPayment: 0,
          endingBalance: 0,
        });
      }
    }
  } else {
    // 元利均等返済（月次計算の年次集計）
    const totalMonths = loanTermYears * 12;
    const monthlyRate = rAnnual / 12;
    let monthlyPayment = 0;

    if (totalMonths > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loanTotal / totalMonths;
      } else {
        const factor = Math.pow(1 + monthlyRate, totalMonths);
        monthlyPayment = (loanTotal * monthlyRate * factor) / (factor - 1);
      }
    }

    let monthBalance = loanTotal;
    let currentMonth = 0;

    for (let year = 1; year <= maxYears; year++) {
      const yearBeginningBalance = monthBalance;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        currentMonth++;
        if (currentMonth <= totalMonths && monthBalance > 0.00001) {
          const interestPart = monthBalance * monthlyRate;
          let principalPart = monthlyPayment - interestPart;
          if (principalPart > monthBalance) {
            principalPart = monthBalance;
          }
          monthBalance = Math.max(0, monthBalance - principalPart);
          yearPrincipal += principalPart;
          yearInterest += interestPart;
        }
      }

      schedules.push({
        year,
        beginningBalance: yearBeginningBalance,
        principalRepayment: yearPrincipal,
        interestPayment: yearInterest,
        endingBalance: monthBalance,
      });
    }
  }

  return schedules;
}

/**
 * 収支シミュレーション年次計算
 */
export function calculateSimulation(params: SimulationParams): {
  summary: SimulationSummary;
  annualList: AnnualData[];
} {
  const maxYears = Math.max(35, params.loanTermYears);
  const landPrice = params.price * (1 - params.buildingRatio / 100);
  const buildingPrice = params.price * (params.buildingRatio / 100);
  const downPayment = params.price * (params.downPaymentRatio / 100);
  const loanTotal = Math.max(0, params.price - downPayment);
  const annualDepreciation = params.usefulLife > 0 ? buildingPrice / params.usefulLife : 0;

  const loanSchedules = calculateLoanSchedules(
    loanTotal,
    params.interestRate,
    params.loanTermYears,
    params.repaymentMethod,
    maxYears
  );

  const annualList: AnnualData[] = [];
  let runningCumulativeFcf = 0;
  let firstDeadCrossYear: number | null = null;

  for (let year = 1; year <= maxYears; year++) {
    const loanInfo = loanSchedules[year - 1] || {
      beginningBalance: 0,
      principalRepayment: 0,
      interestPayment: 0,
      endingBalance: 0,
    };

    // 想定満室収入 = 物件価格 × 想定表面利回り × (1 - 家賃下落率)^(year - 1)
    const grossRent =
      params.price *
      (params.grossYield / 100) *
      Math.pow(1 - params.rentDropRate / 100, year - 1);

    // 実効家賃収入 = 想定満室収入 × (1 - 空室率)
    const effectiveRent = grossRent * (1 - params.vacancyRate / 100);

    // 運営管理費 & その他経費
    const managementCost = effectiveRent * (params.managementCostRatio / 100);
    const otherCost = effectiveRent * (params.otherCostRatio / 100);

    // 減価償却費
    const depreciation = year <= params.usefulLife ? annualDepreciation : 0;

    // 税引前利益 = 実効家賃 - (管理費 + その他経費 + 役員報酬 + 減価償却費 + 支払利息)
    const preTaxProfit =
      effectiveRent -
      (managementCost +
        otherCost +
        params.executiveSalary +
        depreciation +
        loanInfo.interestPayment);

    // 法人税等 = max(0, 税引前利益 × 実効税率)
    const corporateTax = Math.max(0, preTaxProfit * (params.taxRate / 100));

    // 税引後利益
    const postTaxProfit = preTaxProfit - corporateTax;

    // フリーキャッシュフロー (FCF) = 税引後利益 + 減価償却費 - 年間元本返済額
    const fcf = postTaxProfit + depreciation - loanInfo.principalRepayment;
    runningCumulativeFcf += fcf;

    // デッドクロス判定: 税引後利益 + 減価償却費 < 元本返済額
    // ※元本返済が残っている期間で、CFが税引後利益+非現金償却を下回る状態
    const isDeadCross =
      loanInfo.principalRepayment > 0.001 &&
      postTaxProfit + depreciation < loanInfo.principalRepayment;

    if (isDeadCross && firstDeadCrossYear === null) {
      firstDeadCrossYear = year;
    }

    annualList.push({
      year,
      beginningBalance: loanInfo.beginningBalance,
      grossRent,
      effectiveRent,
      managementCost,
      otherCost,
      executiveSalary: params.executiveSalary,
      depreciation,
      interestPayment: loanInfo.interestPayment,
      preTaxProfit,
      corporateTax,
      postTaxProfit,
      principalRepayment: loanInfo.principalRepayment,
      totalRepayment: loanInfo.principalRepayment + loanInfo.interestPayment,
      fcf,
      cumulativeFcf: runningCumulativeFcf,
      endingBalance: loanInfo.endingBalance,
      isDeadCross,
    });
  }

  const firstYearData = annualList[0];
  const summary: SimulationSummary = {
    landPrice,
    buildingPrice,
    initialDownPayment: downPayment,
    initialLoanAmount: loanTotal,
    annualDepreciation,
    firstYearFcf: firstYearData ? firstYearData.fcf : 0,
    firstYearMonthlyRepayment: firstYearData ? firstYearData.totalRepayment / 12 : 0,
    cumulativeFcf10: annualList[9] ? annualList[9].cumulativeFcf : 0,
    cumulativeFcf20: annualList[19] ? annualList[19].cumulativeFcf : 0,
    cumulativeFcf35: annualList[34] ? annualList[34].cumulativeFcf : 0,
    deadCrossYear: firstDeadCrossYear,
  };

  return { summary, annualList };
}
