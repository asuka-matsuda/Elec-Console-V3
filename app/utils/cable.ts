import { cableData } from "~/constants/data/cableData";
import type { CableData } from "~/types/database";

export interface DropdownOption {
    label: string;
    value: string;
}

/**
 * 重複のないケーブルカテゴリ（種類）のリストを取得する
 */
export function getCableCategories(): DropdownOption[] {
    const cats = [...new Set(cableData.map(c => c.category))];
    return cats.map(c => ({ label: c, value: c }));
}

/**
 * 指定されたカテゴリ（cableType）に存在するケーブルのリストを取得する
 */
export function getAvailableSizes(category: string): DropdownOption[] {
    if (!category) return [];

    // 元の配列におけるインデックスを保持したままフィルタリングする
    const candidates = cableData
        .map((cable, index) => ({ cable, index }))
        .filter((item) => item.cable.category === category);

    return candidates.map((item) => {
        const c = item.cable;
        // nameプロパティが存在する場合はそれを利用し、なければフォールバック
        const label = c.name || `${c.size} ${c.unit}`;
        
        return {
            label,
            value: `idx_${item.index}`,
        };
    });
}

export function formatCableName(
  cable: CableData | { category: string; size: string; cores: string },
  includeSize = true,
  includeCores = true
): string {
  if (!cable) return '';
  let name = cable.category;

  if (includeSize && cable.size && cable.size !== '-') {
    name += ` ${cable.size}`;
  }

  if (includeCores && cable.cores && cable.cores !== '1') {
    if (cable.cores.includes('P') || cable.cores.includes('C')) {
      name += ` ${cable.cores}`;
    } else {
      name += ` ${cable.cores}C`;
    }
  }

  return name;
}
