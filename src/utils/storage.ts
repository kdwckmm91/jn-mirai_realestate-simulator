import { SavedPreset, SimulationParams } from '../types/simulation';
import { DEFAULT_PARAMS } from './calculation';

const STORAGE_KEY = 'real_estate_presets_v1';

export const INITIAL_PRESETS: SavedPreset[] = [
  {
    id: 'preset-shimane-default',
    name: '島根ハイツ（初期設定：1億円・9%）',
    savedAt: '2026/09/01',
    params: {
      ...DEFAULT_PARAMS,
      price: 10000,
      grossYield: 9.0,
      interestRate: 3.3,
      repaymentMethod: 'equal-payment',
    },
  },
  {
    id: 'preset-stress-check',
    name: 'ストレス検証（金利+1%・空室10%）',
    savedAt: '2026/09/01',
    params: {
      ...DEFAULT_PARAMS,
      price: 10000,
      grossYield: 9.0,
      interestRate: 4.3,
      vacancyRate: 10.0,
      repaymentMethod: 'equal-payment',
    },
  },
];

export function getSavedPresets(): SavedPreset[] {
  if (typeof window === 'undefined') return INITIAL_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESETS));
      return INITIAL_PRESETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRESETS;
  } catch {
    return INITIAL_PRESETS;
  }
}

export function savePreset(name: string, params: SimulationParams): SavedPreset[] {
  const current = getSavedPresets();
  const newPreset: SavedPreset = {
    id: `preset-${Date.now()}`,
    name: name.trim() || `シミュレーション ${new Date().toLocaleDateString('ja-JP')}`,
    savedAt: new Date().toLocaleDateString('ja-JP'),
    params: { ...params },
  };

  // 最大5件。古いものを落とすか先頭に追加
  const updated = [newPreset, ...current.filter((p) => p.id !== newPreset.id)].slice(0, 5);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return updated;
}

export function deletePreset(id: string): SavedPreset[] {
  const current = getSavedPresets();
  const updated = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete from localStorage', e);
  }
  return updated;
}
