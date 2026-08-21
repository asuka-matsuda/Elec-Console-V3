import type { CableData } from '~/types/database';

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
