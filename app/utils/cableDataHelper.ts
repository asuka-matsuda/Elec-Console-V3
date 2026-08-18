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
 * 指定されたカテゴリ（cableType）と芯数（cores）に存在するサイズ（size）のリストを取得する
 */
export function getAvailableSizes(category: string, coreVal?: string): DropdownOption[] {
    if (!category) return [];

    let candidates = cableData.filter((c) => c.category === category);

    if (coreVal && coreVal !== "-") {
        // "3C" のような形式が cableData に登録されているか確認し、フィルタリングする
        // ユーザーが選ぶのは "3" なので、"3C" 等にマッチするか確認
        candidates = candidates.filter((c) => c.cores === `${coreVal}C` || c.cores === coreVal || c.cores === "-");
    }

    // サイズ、単位、許容電流のペアを抽出
    const sizeMap = new Map<string, { unit: string; ampacity: string }>(); // key: size
    candidates.forEach((c) => {
        if (!sizeMap.has(c.size)) {
            sizeMap.set(c.size, { unit: c.unit, ampacity: c.ampacity });
        }
    });

    const sizes = Array.from(sizeMap.entries()).map(([size, data]) => ({
        size: parseFloat(size),
        sizeStr: size,
        unit: data.unit || "sq",
        ampacity: data.ampacity
    }));

    // サイズ順にソート
    sizes.sort((a, b) => a.size - b.size);

    return sizes.map((item) => {
        const ampStr = item.ampacity !== "-" ? ` (許容電流: ${item.ampacity}A)` : "";
        return {
            label: `${item.sizeStr} ${item.unit}${ampStr}`,
            value: item.sizeStr,
        };
    });
}
