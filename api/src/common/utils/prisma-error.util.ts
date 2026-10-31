/** Structural Prisma error guards compatible with Prisma's generated client. */
type PrismaErrorWithCode = { code?: unknown };

function hasPrismaCode(error: unknown, code: string): error is PrismaErrorWithCode {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as PrismaErrorWithCode).code === code;
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return hasPrismaCode(error, 'P2002');
}

export function isPrismaTransactionConflict(error: unknown): boolean {
  return hasPrismaCode(error, 'P2034');
}
