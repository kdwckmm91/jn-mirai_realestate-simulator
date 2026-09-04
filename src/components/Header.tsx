import React, { useState, useRef, useEffect } from 'react';
import { Building2, Share2, Download, Printer, BookmarkPlus, FolderOpen, Trash2, Check } from 'lucide-react';
import { SavedPreset, SimulationParams } from '../types/simulation';
import { copyShareUrl } from '../utils/urlSync';

interface HeaderProps {
  params: SimulationParams;
  presets: SavedPreset[];
  onSelectPreset: (preset: SavedPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onExportCsv: () => void;
  onPrint: () => void;
  showToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onExportCsv,
  onPrint,
  showToast,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側クリックで閉じる
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresetDropdown(false);
      }
    };
    if (showPresetDropdown) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showPresetDropdown]);

  const handleCopyUrl = async () => {
    const ok = await copyShareUrl();
    if (ok) {
      showToast('シミュレーション条件の共有URLをコピーしました');
    } else {
      showToast('URLのコピーに失敗しました');
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;
    onSavePreset(presetNameInput.trim());
    setPresetNameInput('');
    setShowSaveModal(false);
    showToast('条件をブラウザに保存しました');
  };

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Building2 size={22} />
        </div>
        <div className="brand-info">
          <h1>不動産収支シミュレーター</h1>
          <div className="brand-tag">Real Estate Investment Analysis Pro</div>
        </div>
      </div>

      <div className="header-actions">
        {/* プリセット選択 */}
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              setShowPresetDropdown(!showPresetDropdown);
            }}
            title="保存した条件を読み込む"
          >
            <FolderOpen size={16} />
            プリセット ({presets.length})
          </button>
          {showPresetDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '8px',
                width: '300px',
                zIndex: 1000,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                padding: '0.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '0.35rem 0.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                保存済みシミュレーション (最大5件)
              </div>
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      flex: 1,
                    }}
                    onClick={() => {
                      onSelectPreset(preset);
                      setShowPresetDropdown(false);
                      showToast(`「${preset.name}」を読み込みました`);
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{preset.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {preset.savedAt}
                    </div>
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(preset.id);
                    }}
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 条件を保存 */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowSaveModal(true)}
          title="現在の入力条件を一時保存"
        >
          <BookmarkPlus size={16} />
          条件を保存
        </button>

        {/* URL共有 */}
        <button className="btn btn-secondary" onClick={handleCopyUrl} title="現在の条件URLをコピー">
          <Share2 size={16} />
          URL共有
        </button>

        {/* CSV出力 */}
        <button className="btn btn-secondary" onClick={onExportCsv} title="年次明細CSVをダウンロード">
          <Download size={16} />
          CSV
        </button>

        {/* 印刷・PDF */}
        <button className="btn btn-primary" onClick={onPrint} title="A4レポートとして印刷またはPDF保存">
          <Printer size={16} />
          レポート印刷 / PDF
        </button>
      </div>

      {/* プリセット保存モーダル */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>現在のシミュレーション条件を保存</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ブラウザのローカルストレージに最大5件まで保存できます。
            </p>
            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="例: 島根ハイツ (金利3.3% 35年)"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                autoFocus
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSaveModal(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
