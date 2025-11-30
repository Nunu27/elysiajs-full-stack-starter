/**
 * Generic pagination response types
 */

export type PageInfo = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  pageInfo: PageInfo;
};

export type SortOrder = 'asc' | 'desc';

export type PaginationParams<
  TSortBy extends string,
  TFilters extends Array<unknown>,
> = {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: TSortBy;
  sortOrder: SortOrder;
  filters?: TFilters;
};

export type PaginationHandlers<
  TFields extends string,
  TFilters extends Array<unknown>,
> = {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: TFields | undefined, sortOrder: SortOrder) => void;
  onFilterChange: (filters: TFilters) => void;
  onRefresh: () => void;
};
