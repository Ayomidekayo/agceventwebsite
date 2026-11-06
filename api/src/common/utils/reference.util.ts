import { randomUUID } from 'node:crypto';


export function createReference(prefix: ReferencePrefix): string {
  return `${prefix}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}



export type ReferencePrefix =
  | 'AGN'
  | 'REG'
  | 'SPN'
  | 'VOL'
  | 'AGNP'
  | 'AGNV'
  | 'AGNS'
  | 'AGN27';