import type { cableData } from '~/utils/data/cableData';
import type { conduitData } from '~/utils/data/conduitData';
import type { drumData } from '~/utils/data/drumData';

export type CableData = (typeof cableData)[number] & {
  name?: string;
  [key: string]: any;
};

export type ConduitData = (typeof conduitData)[number] & {
  [key: string]: any;
};

export type DrumData = (typeof drumData)[number] & {
  [key: string]: any;
};
