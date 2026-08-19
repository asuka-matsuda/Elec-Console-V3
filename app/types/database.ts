import { cableData } from '~/utils/data/cableData';
import { conduitData } from '~/utils/data/conduitData';
import { drumData } from '~/utils/data/drumData';

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
