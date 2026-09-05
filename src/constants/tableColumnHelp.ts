export interface ColumnHelpInfo {
  label: string;
  description: string;
  formula: string;
}

export const TABLE_COLUMN_HELP: Record<string, ColumnHelpInfo> = {
  year: {
    label: '年次',
    description: '物件取得・運用開始からの経過年数（1〜35年間）。',
    formula: '1, 2, 3 ... 運用年数',
  },
  beginningBalance: {
    label: '期首ローン残高',
    description: '当該年度の開始時点における融資（借入金）の残高。初年度は初期借入総額となります。',
    formula: '前年度の期末ローン残高（1年目は借入総額）',
  },
  effectiveRent: {
    label: '実効家賃収入',
    description: '想定満室賃料から経年劣化による家賃下落と空室リスク損失を控除した実際の手取り賃料収入。',
    formula: '想定満室家賃 × (1 - 家賃下落率)^(年数-1) × (1 - 空室率)',
  },
  managementCost: {
    label: '運営管理費',
    description: '賃貸管理会社（PM/BM）への集金代行・入退去管理・日常巡回清掃等の委託費用。',
    formula: '実効家賃収入 × 運営管理費率(%)',
  },
  otherCost: {
    label: 'その他経費',
    description: '固定資産税・都市計画税、火災保険料、共用部電気水道代、定期修繕積立金等の諸経費。',
    formula: '実効家賃収入 × その他経費率(%)',
  },
  depreciation: {
    label: '減価償却費',
    description: '建物部分の取得費用を法定耐用年数にわたり按分して経費計上する非現金支出費用。耐用年数経過後は0になります。',
    formula: '耐用年数期間中: 建物価格 ÷ 法定耐用年数（経過後は 0）',
  },
  interestPayment: {
    label: '支払利息',
    description: '年間借入返済額のうち金融機関へ支払う利息部分（全額経費計上可能）。元本の返済が進むにつれ減少します。',
    formula: '期首ローン残高 × 借入金利（返済スケジュールに基づく）',
  },
  preTaxProfit: {
    label: '税引前利益',
    description: '実効家賃収入からすべての必要経費（管理費・その他経費・役員報酬・減価償却費・支払利息）を控除した事業損益。',
    formula: '実効家賃 - (運営管理費 + その他経費 + 役員報酬 + 減価償却費 + 支払利息)',
  },
  corporateTax: {
    label: '法人税等',
    description: '税引前利益が黒字の場合に課される法人税・地方法人税・住民税等の実効課税額（赤字の場合は0円）。',
    formula: 'MAX(0, 税引前利益 × 実効税率(%))',
  },
  postTaxProfit: {
    label: '税引後利益',
    description: '税引前利益から法人税等を納付した後に会計上残る当期純利益。',
    formula: '税引前利益 - 法人税等',
  },
  principalRepayment: {
    label: '元本返済額',
    description: '年間返済総額のうち借入金の借金を減らす元本部分（会計上の費用・経費には計上されません）。',
    formula: '年間総返済額 - 支払利息',
  },
  totalRepayment: {
    label: '年間総返済額',
    description: '当該年度に金融機関へ実際にキャッシュで支払う返済総額（元本返済額＋支払利息）。',
    formula: '元本返済額 + 支払利息（毎月返済額 × 12ヶ月）',
  },
  fcf: {
    label: 'フリーCF (FCF)',
    description: '経費・税金・融資元本返済をすべて差し引いた後、投資家自身の手元に最終的に残る現金手残り（正味キャッシュ）。',
    formula: '税引後利益 + 減価償却費 - 年間元本返済額',
  },
  cumulativeFcf: {
    label: '累計CF',
    description: '物件運用開始（1年目）から当該年度末までに手元に蓄積されたフリーキャッシュフローの累積合計金額。',
    formula: '前年までの累計CF + 当年フリーCF',
  },
  endingBalance: {
    label: '期末ローン残高',
    description: '当該年度末の元本返済終了時点における金融機関への借入金残高。',
    formula: '期首ローン残高 - 当年元本返済額',
  },
  status: {
    label: '状態（デッドクロス）',
    description: '減価償却費の減少や元本返済額の増加により、会計上の税金負担が手元現金を上回る「デッドクロス」発生リスクの監視ステータス。',
    formula: '税引後利益 + 減価償却費 < 元本返済額 の場合「デッドクロス」',
  },
};
