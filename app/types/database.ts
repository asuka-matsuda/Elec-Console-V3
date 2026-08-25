import type { cableData } from '~/constants/data/cableData';
import type { conduitData } from '~/constants/data/conduitData';
import type { drumData } from '~/constants/data/drumData';

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
