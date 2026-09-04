import React from 'react';
import { LayoutDashboard, TrendingUp, Layers, Activity, FolderArchive } from 'lucide-react';

export type TabType = 'basic' | 'exit' | 'compare' | 'sensitivity' | 'batch';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="tabs-nav">
      <button
        className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
        onClick={() => onChangeTab('basic')}
      >
        <LayoutDashboard size={16} />
        基本シミュレーション
      </button>

      <button
        className={`tab-btn ${activeTab === 'exit' ? 'active' : ''}`}
        onClick={() => onChangeTab('exit')}
      >
        <TrendingUp size={16} />
        売却・IRR分析（出口戦略）
      </button>

      <button
        className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
        onClick={() => onChangeTab('compare')}
      >
        <Layers size={16} />
        複数条件比較（A/B/C）
      </button>

      <button
        className={`tab-btn ${activeTab === 'sensitivity' ? 'active' : ''}`}
        onClick={() => onChangeTab('sensitivity')}
      >
        <Activity size={16} />
        感度分析（ストレスチェック）
      </button>

      <button
        className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
        onClick={() => onChangeTab('batch')}
      >
        <FolderArchive size={16} color={activeTab === 'batch' ? '#34d399' : undefined} />
        複数物件一括出力 (Excel)
      </button>
    </nav>
  );
};
