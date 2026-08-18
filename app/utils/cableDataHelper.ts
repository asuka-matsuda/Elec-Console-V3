import { cableData } from "~/utils/data/cableData";

export interface DropdownOption {
    label: string;
    value: string;
}

/**
 * 指定されたカテゴリ（cableType）に存在する芯数（cores）のリストを取得する
 */
export function getAvailableCores(category: string): DropdownOption[] {
    if (!category) return [];

    const candidates = cableData.filter((c) => c.category === category);
    const uniqueCores = Array.from(new Set(candidates.map((c) => c.cores)));

    // 該当するケーブルが「-」しか持たない場合（CVTなど）
    if (uniqueCores.length === 1 && uniqueCores[0] === "-") {
        return [{ label: "指定なし（共通）", value: "-" }];
    }

    return uniqueCores
        .filter((core) => core !== "-") // もし「-」と「2C」などが混在していれば「-」を除外
        .sort()
        .map((core) => {
            const count = core.replace(/\D/g, "");
            return {
                label: `${count}芯${core.includes("C") ? "" : " " + core}`,
                value: core.replace("C", ""), // "3" などの値として返す
            };
        });
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
