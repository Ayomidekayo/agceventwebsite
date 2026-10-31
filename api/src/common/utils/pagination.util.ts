export interface PaginationOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(pageValue?: string, limitValue?: string): PaginationOptions {
  const parsedPage = Number.parseInt(pageValue ?? '1', 10);
  const parsedLimit = Number.parseInt(limitValue ?? '25', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 100)
    : 25;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
