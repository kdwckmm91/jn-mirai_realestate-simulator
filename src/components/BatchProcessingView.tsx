import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Play,
  CheckCircle2,
  Download,
  Loader2,
  FolderArchive,
} from 'lucide-react';
import { BatchParseResult, BatchPropertyInput, BatchSimulationItem } from '../types/batch';
import { generateAndDownloadTemplate, parseBatchExcelFile } from '../utils/batchParser';
import { calculateSimulation } from '../utils/calculation';
import { calculateExitAnalysis } from '../utils/exitCalculation';
import { exportBatchSimulationZip } from '../utils/batchZipExporter';

interface BatchProcessingViewProps {
  showToast: (msg: string) => void;
}

export const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({ showToast }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<BatchParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // 処理ステータス
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPropName, setCurrentPropName] = useState('');
  const [completedItems, setCompletedItems] = useState<BatchSimulationItem[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // テンプレートダウンロード
  const handleDownloadTemplate = () => {
    generateAndDownloadTemplate();
    showToast('Excel入力テンプレートをダウンロードしました');
  };

  // ファイル読み込みハンドラ
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setCompletedItems(null);

    try {
      const result = await parseBatchExcelFile(file);
      setParseResult(result);
      if (result.errors.length > 0) {
        showToast(`注意: ${result.errors.length}件の入力不備が検出されました`);
      } else {
        showToast(`${result.validProperties.length}件の物件データを正常に読み込みました`);
      }
    } catch (err: any) {
      setParseError(err.message || 'ファイルの読み込みに失敗しました。');
      showToast('エラー: ファイルを解析できませんでした');
    } finally {
      setIsParsing(false);
    }
  };

  // ドラッグ＆ドロップイベント
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleFileChange(file);
      } else {
        setParseError('Excelファイル（.xlsx または .xls）を選択してください。');
      }
    }
  };

  // 一括シミュレーション実行
  const handleRunBatchSimulation = async () => {
    if (!parseResult || parseResult.validProperties.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalCount(parseResult.validProperties.length);

    try {
      // 1. 各物件の計算
      const items: BatchSimulationItem[] = parseResult.validProperties.map((input: BatchPropertyInput) => {
        const sim = calculateSimulation(input.rawParams);
        const exitResult = calculateExitAnalysis(input.rawParams, sim.annualList);
        return {
          input,
          result: {
            params: input.rawParams,
            summary: sim.summary,
            annualList: sim.annualList,
            exitResult,
          },
        };
      });

      // 2. PDF・CSV生成 & ZIPエクスポート
      await exportBatchSimulationZip(items, (current, _total, name) => {
        setProcessedCount(current);
        setCurrentPropName(name);
      });

      setCompletedItems(items);
      showToast('全物件の分析レポート・CSV・サマリーのZIP出力を完了しました！');
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || '一括処理中にエラーが発生しました。');
      showToast('エラー: 一括処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 画面ヘッダー説明 */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FolderArchive size={22} color="var(--brand-primary)" />
              複数物件一括シミュレーション & 帳票一括出力
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Excelシートに入力した複数物件（最大50件）を一括で高速計算し、各物件の「分析レポートPDF」「詳細年次CSV」および「全物件集計サマリーExcel」をZIP形式でまとめてダウンロードします。
            </p>
          </div>

          <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
            <FileSpreadsheet size={16} color="var(--brand-primary)" />
            Excelテンプレートをダウンロード
          </button>
        </div>
      </div>

      {/* ステップ1〜2: アップロードエリア */}
      <div className="panel">
        <div className="panel-title">
          <UploadCloud size={18} color="var(--brand-primary)" />
          Step 1 & 2: 物件データ入力済みExcelファイルのアップロード
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.2)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: isDragging ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.4)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            {isParsing ? <Loader2 size={28} className="spin" /> : <UploadCloud size={28} />}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {selectedFile ? selectedFile.name : 'Excelファイルをここにドラッグ＆ドロップ'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              またはクリックしてファイルを選択（.xlsx / .xls 最大50件）
            </div>
          </div>
        </div>

        {/* パースエラー表示 */}
        {parseError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>ファイル読み込みエラー:</strong> {parseError}
            </div>
          </div>
        )}
      </div>

      {/* ステップ3: バリデーション結果 ＆ 物件一覧プレビュー */}
      {parseResult && (
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="panel-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <FileCheck2 size={18} color="var(--brand-primary)" />
              Step 3: 読み込み結果プレビュー（有効: {parseResult.validProperties.length} 件 / 不備: {parseResult.errors.length} 件）
            </div>

            <button
              className="btn btn-primary"
              disabled={parseResult.validProperties.length === 0 || isProcessing}
              onClick={handleRunBatchSimulation}
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spin" />
                  一括生成処理中 ({processedCount}/{totalCount})...
                </>
              ) : (
                <>
                  <Play size={18} />
                  一括シミュレーション & ZIP生成を実行 ({parseResult.validProperties.length}物件)
                </>
              )}
            </button>
          </div>

          {/* バリデーションエラー一覧 */}
          {parseResult.errors.length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.825rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                以下の行で入力不備が見つかりました（該当行はスキップされます）：
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: '#fef08a', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.rowNumber}行目</strong> {err.propertyId ? `[${err.propertyId}]` : ''}: {err.column} - {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 有効な物件データ一覧テーブル */}
          <div className="table-container">
            <div className="table-scroll" style={{ maxHeight: '350px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>物件ID</th>
                    <th>物件名称</th>
                    <th>価格</th>
                    <th>建物割合</th>
                    <th>耐用年数</th>
                    <th>表面利回り</th>
                    <th>頭金</th>
                    <th>金利</th>
                    <th>期間</th>
                    <th>返済方式</th>
                    <th>空室率</th>
                    <th>売却想定</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.validProperties.map((prop) => (
                    <tr key={prop.propertyId}>
                      <td><strong>{prop.propertyId}</strong></td>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>{prop.propertyName}</td>
                      <td style={{ color: '#38bdf8' }}>{fmt(prop.price)}万円</td>
                      <td>{prop.buildingRatio}%</td>
                      <td>{prop.usefulLife}年</td>
                      <td style={{ color: '#34d399', fontWeight: 600 }}>{prop.grossYield}%</td>
                      <td>{prop.downPaymentRatio}%</td>
                      <td>{prop.interestRate}%</td>
                      <td>{prop.loanTermYears}年</td>
                      <td>{prop.repaymentMethodText}</td>
                      <td>{prop.vacancyRate}%</td>
                      <td>{prop.exitYear}年後 (Cap {prop.exitCapRate}%)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ステップ4: 処理進捗 ＆ 完了サマリー */}
      {isProcessing && (
        <div className="panel" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={24} className="spin" color="var(--brand-primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                一括計算 & 帳票（PDF/CSV）生成中: {processedCount} / {totalCount} 件
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                処理中の物件: {currentPropName || '準備中...'}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', background: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '0.75rem' }}>
            <div
              style={{
                width: `${totalCount > 0 ? (processedCount / totalCount) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #10b981, #38bdf8)',
                height: '100%',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 完了結果表示 */}
      {completedItems && (
        <div
          className="panel"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={28} color="var(--brand-primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
                  一括シミュレーション & 帳票生成が完了しました！ ({completedItems.length} 物件)
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  各物件の「PDF分析レポート」「年次明細CSV」および「全物件集計サマリー.xlsx」がZIPに同梱されています。
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleRunBatchSimulation}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Download size={18} />
              ZIPファイルを再ダウンロード
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
