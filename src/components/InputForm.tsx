import React from 'react';
import { SimulationParams } from '../types/simulation';
import { Tooltip } from './Tooltip';
import { Building, Landmark, SlidersHorizontal, DoorOpen, DollarSign } from 'lucide-react';

interface InputFormProps {
  params: SimulationParams;
  onChange: (updated: SimulationParams) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ params, onChange }) => {
  const updateNumber = (key: keyof SimulationParams, val: string | number, min?: number, max?: number) => {
    let num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) num = 0;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    onChange({ ...params, [key]: num });
  };

  const landPrice = Math.round(params.price * (1 - params.buildingRatio / 100));
  const buildingPrice = Math.round(params.price * (params.buildingRatio / 100));
  const downPayment = Math.round(params.price * (params.downPaymentRatio / 100));
  const loanTotal = Math.max(0, params.price - downPayment);

  return (
    <aside className="panel input-panel">
      <div className="panel-title">
        <SlidersHorizontal size={18} color="var(--brand-primary)" />
        シミュレーション入力パラメータ
      </div>

      {/* 1. 物件情報 */}
      <div className="form-section">
        <div className="section-label">
          <Building size={14} /> 物件情報
        </div>

        {/* 物件価格 */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label-title">
              物件価格
              <Tooltip content="購入予定の物件総額（消費税込または非課税土地＋建物税込）を入力します。" />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              頭金 {downPayment.toLocaleString()}万 / 借入 {loanTotal.toLocaleString()}万
            </span>
          </div>
          <div className="form-input-wrapper">
            <input
              type="number"
              className="form-input"
              value={params.price || ''}
              min={1}
              step={100}
              onChange={(e) => updateNumber('price', e.target.value, 1)}
            />
            <span className="form-unit">万円</span>
          </div>
        </div>

        {/* 建物価格割合 */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label-title">
              建物価格割合
              <Tooltip content="物件価格のうち、減価償却対象となる建物の比率（固定資産税評価額比率等から算出）。" />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              建物 {buildingPrice.toLocaleString()}万 / 土地 {landPrice.toLocaleString()}万
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={params.buildingRatio}
              onChange={(e) => updateNumber('buildingRatio', e.target.value, 0, 100)}
            />
            <div className="form-input-wrapper" style={{ width: '85px' }}>
              <input
                type="number"
                className="form-input"
                value={params.buildingRatio}
                min={0}
                max={100}
                onChange={(e) => updateNumber('buildingRatio', e.target.value, 0, 100)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>

        {/* 耐用年数 & 想定表面利回り */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                法定耐用年数
                <Tooltip content="減価償却を行う残存年数（法定耐用年数 - 築年数×0.8等で計算）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.usefulLife || ''}
                min={1}
                max={50}
                onChange={(e) => updateNumber('usefulLife', e.target.value, 1, 50)}
              />
              <span className="form-unit">年</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                想定表面利回り
                <Tooltip content="想定満室年間家賃 ÷ 物件価格。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.grossYield}
                step={0.1}
                min={0.1}
                max={50}
                onChange={(e) => updateNumber('grossYield', e.target.value, 0.1, 50)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-subtle)' }} />

      {/* 2. 融資条件 */}
      <div className="form-section">
        <div className="section-label">
          <Landmark size={14} /> 融資条件
        </div>

        {/* 返済方式 */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label-title">
              返済方式
              <Tooltip content="元利均等：毎月の返済額が一定（初期は利息が多い）。元金均等：毎月の元本返済額が一定（初期返済が重いが総利息が少ない）。" />
            </span>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-control-btn ${params.repaymentMethod === 'equal-payment' ? 'active' : ''}`}
              onClick={() => onChange({ ...params, repaymentMethod: 'equal-payment' })}
            >
              元利均等返済
            </button>
            <button
              type="button"
              className={`segmented-control-btn ${params.repaymentMethod === 'equal-principal' ? 'active' : ''}`}
              onClick={() => onChange({ ...params, repaymentMethod: 'equal-principal' })}
            >
              元金均等返済
            </button>
          </div>
        </div>

        {/* 頭金割合 */}
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label-title">
              頭金割合
              <Tooltip content="自己資金として投入する割合（頭金＝物件価格×頭金割合）。" />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {downPayment.toLocaleString()} 万円
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={params.downPaymentRatio}
              onChange={(e) => updateNumber('downPaymentRatio', e.target.value, 0, 100)}
            />
            <div className="form-input-wrapper" style={{ width: '85px' }}>
              <input
                type="number"
                className="form-input"
                value={params.downPaymentRatio}
                min={0}
                max={100}
                onChange={(e) => updateNumber('downPaymentRatio', e.target.value, 0, 100)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>

        {/* 借入金利 & 期間 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                借入金利
                <Tooltip content="金融機関からの融資金利（年利）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.interestRate}
                step={0.05}
                min={0}
                max={15}
                onChange={(e) => updateNumber('interestRate', e.target.value, 0, 15)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                借入期間
                <Tooltip content="融資の返済年数（1〜50年）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.loanTermYears || ''}
                min={1}
                max={50}
                onChange={(e) => updateNumber('loanTermYears', e.target.value, 1, 50)}
              />
              <span className="form-unit">年</span>
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-subtle)' }} />

      {/* 3. 運用条件 */}
      <div className="form-section">
        <div className="section-label">
          <DollarSign size={14} /> 運用・経費条件
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                空室率
                <Tooltip content="想定される空室損失の割合。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.vacancyRate}
                step={0.5}
                min={0}
                max={100}
                onChange={(e) => updateNumber('vacancyRate', e.target.value, 0, 100)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                家賃下落率
                <Tooltip content="経年劣化による家賃の年間下落率（複利で適用）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.rentDropRate}
                step={0.1}
                min={0}
                max={10}
                onChange={(e) => updateNumber('rentDropRate', e.target.value, 0, 10)}
              />
              <span className="form-unit">%/年</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                運営管理費率
                <Tooltip content="PM/BM会社への管理委託料（家賃収入に対する%）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.managementCostRatio}
                step={0.5}
                min={0}
                max={100}
                onChange={(e) => updateNumber('managementCostRatio', e.target.value, 0, 100)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                その他経費率
                <Tooltip content="固定資産税・修繕積立金・火災保険等の諸経費割合。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.otherCostRatio}
                step={0.5}
                min={0}
                max={100}
                onChange={(e) => updateNumber('otherCostRatio', e.target.value, 0, 100)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                役員報酬
                <Tooltip content="法人保有を想定した場合の年間役員報酬（固定費）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.executiveSalary || ''}
                min={0}
                onChange={(e) => updateNumber('executiveSalary', e.target.value, 0)}
              />
              <span className="form-unit">万/年</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                法人税等実効税率
                <Tooltip content="黒字の税引前利益に課される実効税率（法人想定約23〜34%、中小特例など）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.taxRate}
                step={0.5}
                min={0}
                max={60}
                onChange={(e) => updateNumber('taxRate', e.target.value, 0, 60)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-subtle)' }} />

      {/* 4. 出口（売却）設定 */}
      <div className="form-section">
        <div className="section-label">
          <DoorOpen size={14} /> 出口（売却・Exit）設定
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                売却予定年数
                <Tooltip content="何年後に物件を売却するか想定保有期間を設定します。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.exitYear || ''}
                min={1}
                max={35}
                onChange={(e) => updateNumber('exitYear', e.target.value, 1, 35)}
              />
              <span className="form-unit">年後</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                想定出口利回り
                <Tooltip content="売却時の想定表面利回り（Cap Rate）。売却価格＝売却年家賃÷出口利回り。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.exitCapRate}
                step={0.1}
                min={1}
                max={30}
                onChange={(e) => updateNumber('exitCapRate', e.target.value, 1, 30)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                譲渡所得税率
                <Tooltip content="売却益にかかる税率。5年超の長期譲渡所得は20.315%、5年以内の短期は39.63%（個人の場合）。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.capitalGainTaxRate}
                step={0.1}
                min={0}
                max={60}
                onChange={(e) => updateNumber('capitalGainTaxRate', e.target.value, 0, 60)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <span className="form-label-title">
                売却経費率
                <Tooltip content="仲介手数料（売却価格×3%＋消費税等）や登記等の売却諸費用割合。" />
              </span>
            </div>
            <div className="form-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={params.exitCostRatio}
                step={0.5}
                min={0}
                max={20}
                onChange={(e) => updateNumber('exitCostRatio', e.target.value, 0, 20)}
              />
              <span className="form-unit">%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
