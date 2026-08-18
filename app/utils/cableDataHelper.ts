import { cableData } from "~/utils/cableData";

export interface DropdownOption {
    label: string;
    value: string;
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
