import { ComboBox } from '@frontend/components/ui/combobox';
import type { PaginatedResponse } from '@frontend/types/pagination';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

export type FilterComboboxProps<TItem> = {
  label: string;
  queryKey: (params: { page: number; search?: string }) => readonly unknown[];
  queryFn: (params: {
    page: number;
    search?: string;
  }) => Promise<PaginatedResponse<TItem>>;
  getItemValue: (item: TItem) => string;
  getItemLabel: (item: TItem) => string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  width?: string;
};

export function DataTableFilterCombobox<TItem>({
  label,
  queryKey,
  queryFn,
  getItemValue,
  getItemLabel,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  width = 'w-[200px]',
}: FilterComboboxProps<TItem>) {
  const [search, setSearch] = useState('');

  const debouncedSetSearch = useDebounceCallback(setSearch, 300);

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: [...queryKey({ page: 1, search }), search],
    queryFn: async ({ pageParam = 1 }) => {
      return queryFn({ page: pageParam, search: search || undefined });
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pageInfo;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten all pages into a single array and convert to options
  const options = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((item) => ({
      value: getItemValue(item),
      label: getItemLabel(item),
    }));
  }, [data, getItemValue, getItemLabel]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}:</span>
      <ComboBox
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        disabled={disabled}
        width={width}
        allowClear={true}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={fetchNextPage}
        onSearchChange={debouncedSetSearch}
        shouldFilter={false}
      />
    </div>
  );
}
