import type { TreatyResponse } from '@frontend/lib/api-types';
import { getErrorMessage, getErrorMessageFromApi } from '@frontend/lib/utils';
import type {
  PaginatedResponse,
  PaginationHandlers,
  PaginationParams,
  SortOrder,
} from '@frontend/types/pagination';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  createParser,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const filtersParser = createParser({
  parse: (value: string) => {
    if (value === '[object Object]') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const filtersParam = urlParams.get('filters');

        if (filtersParam) {
          const parsed = JSON.parse(decodeURIComponent(filtersParam));
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.error('Failed to parse filters from URL', e);
        toast.error('Failed to parse filters from URL');
      }

      return [];
    }

    if (typeof value !== 'string') return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse filters from URL', e);
      toast.error('Failed to parse filters from URL');

      return [];
    }
  },
  eq: (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
  serialize: JSON.stringify,
});
export type UsePaginationConfig<
  TData,
  TFields extends string,
  TFilters extends Array<unknown>,
  TParams extends PaginationParams<TFields, TFilters> = PaginationParams<
    TFields,
    TFilters
  >,
> = {
  queryKey: (params: TParams) => readonly unknown[];
  queryFn: (
    params: TParams,
  ) => Promise<TreatyResponse<{ data: PaginatedResponse<TData> }>>;
  defaultSortBy?: TFields;
  defaultSortOrder?: SortOrder;
  defaultPerPage?: number;
  staleTime?: number;
  gcTime?: number;
  transformParams?: (params: PaginationParams<TFields, TFilters>) => TParams;
};

export type UsePaginationResult<
  TData,
  TFields extends string,
  TFilters extends Array<unknown>,
> = {
  data: PaginatedResponse<TData> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  query: UseQueryResult<PaginatedResponse<TData>>;
  params: PaginationParams<TFields, TFilters>;
  handlers: PaginationHandlers<TFields, TFilters>;
};

/**
 * Reusable hook for paginated data with URL state management
 */
export function usePagination<
  TData,
  TFields extends string,
  TFilters extends Array<unknown>,
  TParams extends PaginationParams<TFields, TFilters> = PaginationParams<
    TFields,
    TFilters
  >,
>(
  config: UsePaginationConfig<TData, TFields, TFilters>,
): UsePaginationResult<TData, TFields, TFilters> {
  const {
    queryKey,
    queryFn,
    defaultSortBy = 'id',
    defaultSortOrder = 'desc',
    defaultPerPage = 10,
    staleTime = 1000 * 60 * 5, // 5 minutes
    gcTime = 1000 * 60 * 10, // 10 minutes
    transformParams,
  } = config;

  const [{ page, perPage }, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(defaultPerPage),
  });
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [{ sortBy, sortOrder }, setSorting] = useQueryStates({
    sortBy: parseAsString.withDefault(defaultSortBy),
    sortOrder: parseAsString.withDefault(defaultSortOrder),
  });
  const [filters, setFilters] = useQueryState(
    'filters',
    filtersParser.withDefault([] as unknown as TFilters),
  );

  // Transform params for API
  const apiParams = useMemo(() => {
    const baseParams: PaginationParams<TFields, TFilters> = {
      page,
      perPage,
      search: search || undefined,
      sortBy: sortBy as TFields,
      sortOrder: sortOrder as SortOrder,
      filters: filters as TFilters,
    };

    return transformParams
      ? transformParams(baseParams)
      : (baseParams as TParams);
  }, [page, perPage, search, sortBy, sortOrder, filters, transformParams]);

  const query = useQuery({
    queryKey: queryKey(apiParams),
    queryFn: async () => {
      const response = await queryFn(apiParams);

      if (response.error) {
        throw new Error(getErrorMessageFromApi(response.error.value));
      }

      return response.data!.data;
    },
    gcTime,
    staleTime,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handlers: PaginationHandlers<TFields, TFilters> = useMemo(
    () => ({
      onPageChange: (newPage: number) => {
        setPagination((state) => ({ ...state, page: newPage }));
      },
      onPageSizeChange: (newPerPage: number) => {
        setPagination({ page: 1, perPage: newPerPage });
      },
      onSearchChange: (newSearch: string) => {
        setSearch(newSearch);
        setPagination((state) => ({ ...state, page: 1 }));
      },
      onSortChange: (
        newSortBy: TFields | undefined,
        newSortOrder: SortOrder,
      ) => {
        const newState = newSortBy
          ? {
              sortBy: newSortBy,
              sortOrder: newSortOrder,
            }
          : {
              sortBy: defaultSortBy,
              sortOrder: defaultSortOrder,
            };

        setSorting(newState);
        setPagination((state) => ({
          ...state,
          page: 1,
        }));
      },
      onFilterChange: (newFilters: TFilters) => {
        setFilters(newFilters);
        setPagination((state) => ({ ...state, page: 1 }));
      },
      onRefresh: () => {
        query.refetch();
      },
    }),
    [
      setPagination,
      setSearch,
      setSorting,
      setFilters,
      query,
      defaultSortBy,
      defaultSortOrder,
    ],
  );

  useEffect(() => {
    if (query.error) {
      toast.error(getErrorMessage(query.error));
    }
  }, [query.error]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    query,
    params: apiParams,
    handlers,
  };
}
