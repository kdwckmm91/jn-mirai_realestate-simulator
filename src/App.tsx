import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TabNav, TabType } from './components/TabNav';
import { InputForm } from './components/InputForm';
import { SummaryCards } from './components/SummaryCards';
import { SimulationCharts } from './components/SimulationCharts';
import { AnnualDataTable } from './components/AnnualDataTable';
import { ExitAnalysisView } from './components/ExitAnalysisView';
import { PatternComparisonView } from './components/PatternComparisonView';
import { SensitivityMatrixView } from './components/SensitivityMatrixView';
import { BatchProcessingView } from './components/BatchProcessingView';
import { PrintReport } from './components/PrintReport';

import { SimulationParams, SavedPreset } from './types/simulation';
import { calculateSimulation } from './utils/calculation';
import { calculateExitAnalysis } from './utils/exitCalculation';
import { exportAnnualDataToCsv } from './utils/exportCsv';
import { getParamsFromUrl, syncParamsToUrl } from './utils/urlSync';
import { getSavedPresets, savePreset, deletePreset } from './utils/storage';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // 初期パラメータ（URLパラメータを優先読込）
  const [params, setParams] = useState<SimulationParams>(() => getParamsFromUrl());
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [presets, setPresets] = useState<SavedPreset[]>(() => getSavedPresets());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // パラメータが変更されたらURLクエリを同期
  useEffect(() => {
    syncParamsToUrl(params);
  }, [params]);

  // トースト表示タイマー
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // リアルタイム計算
  const { summary, annualList } = useMemo(() => {
    return calculateSimulation(params);
  }, [params]);

  // 出口戦略計算
  const exitResult = useMemo(() => {
    return calculateExitAnalysis(params, annualList);
  }, [params, annualList]);

  // プリセット操作
  const handleSelectPreset = (preset: SavedPreset) => {
    setParams(preset.params);
  };

  const handleSavePreset = (name: string) => {
    const updated = savePreset(name, params);
    setPresets(updated);
  };

  const handleDeletePreset = (id: string) => {
    const updated = deletePreset(id);
    setPresets(updated);
    showToast('プリセットを削除しました');
  };

  // CSVダウンロード
  const handleExportCsv = () => {
    exportAnnualDataToCsv(
      params,
      annualList,
      `不動産収支シミュレーション_${params.price}万円_${params.interestRate}pct.csv`
    );
    showToast('年次明細CSVをダウンロードしました');
  };

  // 印刷・PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <Header
        params={params}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        showToast={showToast}
      />

      {/* タブナビゲーション */}
      <TabNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* メインレイアウト */}
      {activeTab === 'batch' ? (
        <BatchProcessingView showToast={showToast} />
      ) : (
        <div className="main-layout">
          {/* 左カラム：入力パラメータフォーム */}
          <InputForm params={params} onChange={setParams} />

          {/* 右カラム：タブごとの詳細ビュー */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            {activeTab === 'basic' && (
              <>
                <SummaryCards summary={summary} />
                <SimulationCharts params={params} annualList={annualList} />
                <AnnualDataTable annualList={annualList} />
              </>
            )}

            {activeTab === 'exit' && (
              <ExitAnalysisView
                params={params}
                annualList={annualList}
                exitResult={exitResult}
                onChangeParams={setParams}
              />
            )}

            {activeTab === 'compare' && (
              <PatternComparisonView
                baseParams={params}
                onApplyPatternToBase={(newParams) => {
                  setParams(newParams);
                  showToast('選択したパターンを基本パラメータに反映しました');
                }}
              />
            )}

            {activeTab === 'sensitivity' && (
              <SensitivityMatrixView baseParams={params} />
            )}
          </main>
        </div>
      )}

      {/* 印刷・PDF出力用A4コンポーネント（通常非表示、print時のみ描画） */}
      <PrintReport
        params={params}
        summary={summary}
        annualList={annualList}
        exitResult={exitResult}
      />

      {/* トースト通知 */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} color="var(--brand-primary)" />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
