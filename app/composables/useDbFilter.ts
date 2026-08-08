import { ref, computed } from "vue";

export interface FilterOptions<T> {
  data: T[];
  /**
   * Function to map an item to a searchable string.
   */
  searchMapper: (item: T) => string;
  /**
   * The field name or function to extract the category from an item.
   * By default, it expects a `category` property on the items.
   */
  categoryMapper?: (item: T) => string;
}

export function useDbFilter<T extends Record<string, unknown>>(
  options: FilterOptions<T>,
) {
  const { data, searchMapper } = options;
  const categoryMapper =
    options.categoryMapper || ((item: T) => item.category as string);

  const searchQuery = ref("");
  const activeCats = ref<string[]>([]);

  // Get unique categories
  const categoryOptions = computed(() => {
    const cats = data.map((item) => categoryMapper(item)).filter(Boolean);
    return Array.from(new Set(cats)).map((cat) => ({
      label: cat,
      value: cat,
    }));
  });

  // Filtered result
  const filteredData = computed(() => {
    let result = [...data];

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      result = result.filter((item) => {
        const searchStr = searchMapper(item).normalize("NFKC").toLowerCase();
        return searchStr.includes(q);
      });
    }

    if (activeCats.value.length > 0) {
      result = result.filter((item) =>
        activeCats.value.includes(categoryMapper(item)),
      );
    }

    return result;
  });

  return {
    searchQuery,
    activeCats,
    categoryOptions,
    filteredData,
  };
}
