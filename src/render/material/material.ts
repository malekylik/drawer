import { createUniqeIdGenerator } from '../../utils/uniqeId';

export interface Material<T> {
  bind(): void;

  getId(): number;

  getMaterialData(): T;
}

export const getNewMaterialId = createUniqeIdGenerator(0);
