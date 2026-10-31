import { randomUUID } from 'node:crypto';

export type ReferencePrefix = 'AGN27' | 'AGNV' | 'AGNS';

export function createReference(prefix: ReferencePrefix): string {
  return `${prefix}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}
