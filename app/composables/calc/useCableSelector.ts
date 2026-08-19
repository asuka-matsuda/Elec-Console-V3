import { computed, type Ref } from 'vue';
import type { CableData } from '~/types/database';
import { formatCableName } from '~/utils/calc/cableHelpers';

export function useCableSelector(
  cableData: CableData[],
  selectedCategory: Ref<string>,
  selectedSize: Ref<string>
) {
  // 利用可能なカテゴリ一覧
  const categories = computed(() => {
    const cats = [...new Set(cableData.map((c) => c.category))];
    return cats.map((c) => ({ label: c, value: c }));
  });

  // 選択されたカテゴリに基づくサイズ一覧（重複排除＆ソート）
  const availableSizes = computed(() => {
    if (!selectedCategory.value) return [];
    
    const sizes = [
      ...new Set(
        cableData
          .filter((c) => c.category === selectedCategory.value)
          .map((c) => c.size)
      )
    ];

    // 数値としてソート（一部文字列サイズが混ざる可能性を考慮）
    sizes.sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    return sizes.map((size) => ({ label: String(size), value: String(size) }));
  });

  // 選択されたカテゴリとサイズに基づく芯線数一覧
  const availableCores = computed(() => {
    if (!selectedCategory.value || !selectedSize.value) return [];
    
    const cables = cableData.filter(
      (c) =>
        c.category === selectedCategory.value &&
        c.size === selectedSize.value
    );
    
    const coreOptions = cables.map((c) => {
      let label = '';
      if (c.cores && c.cores !== '-') {
        label = c.cores.includes('C') || c.cores.includes('c') ? c.cores : `${c.cores}C`;
      } else {
        label = '指定なし';
      }
      return {
        label,
        value: c.cores || '-'
      };
    });

    // 芯数でソート（数値化できるものは数値で比較）
    coreOptions.sort((a, b) => {
      const getNum = (str: string) => parseFloat(str.replace(/[^0-9.]/g, ''));
      const numA = getNum(a.label);
      const numB = getNum(b.label);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.label.localeCompare(b.label);
    });

    // '-'（指定なし）は先頭に
    const withCores = coreOptions.filter(o => o.value !== '-');
    const withoutCores = coreOptions.filter(o => o.value === '-');
    return [...withoutCores, ...withCores];
  });

  // Category -> Size/Cores combined options (e.g., for AppCableRowCard)
  const combinedSpecOptions = computed(() => {
    if (!selectedCategory.value) return [];
    const filtered = cableData.filter(c => c.category === selectedCategory.value);
    
    // Sort logic
    filtered.sort((a, b) => {
      const numA = parseFloat(a.size);
      const numB = parseFloat(b.size);
      if (numA !== numB) return numA - numB;
      
      const getCoreNum = (c: string) => parseFloat(c.replace(/[^0-9.]/g, '')) || 0;
      return getCoreNum(a.cores || '') - getCoreNum(b.cores || '');
    });

    return filtered.map(c => {
      return {
        value: `${c.size}|${c.cores || '-'}`,
        label: formatCableName(c, false, true)
      };
    });
  });

  return {
    categories,
    availableSizes,
    availableCores,
    combinedSpecOptions
  };
}
