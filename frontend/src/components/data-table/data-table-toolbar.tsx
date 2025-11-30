import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { MultiComboBox } from '@frontend/components/ui/multi-combobox';
import { type Table as TanStackTable } from '@tanstack/react-table';
import { LayoutListIcon, RefreshCwIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

type DataTableToolbarProps<TData> = {
  table: TanStackTable<TData>;
  searchValue?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  filters?: React.ReactNode;
};

export function DataTableToolbar<TData>({
  table,
  searchValue,
  searchPlaceholder = 'Search...',
  isLoading = false,
  onSearchChange,
  onRefresh,
  filters,
}: DataTableToolbarProps<TData>) {
  const debouncedSearch = useDebounceCallback(onSearchChange, 500);

  const hideableColumns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide(),
        ),
    [table],
  );

  const columnOptions = hideableColumns.map((column) => ({
    value: column.id,
    label: column.columnDef.meta?.label || column.id,
    checked: column.getIsVisible(),
  }));

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.toggleVisibility(checked);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-2">
        <Input
          type="search"
          placeholder={searchPlaceholder}
          defaultValue={searchValue}
          onChange={(e) => debouncedSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCwIcon className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {filters}
        {!!hideableColumns.length && (
          <MultiComboBox
            options={columnOptions}
            onChange={handleColumnToggle}
            placeholder="Select columns..."
            emptyMessage="No columns found."
            icon={<LayoutListIcon />}
            label="Columns"
            width="w-[200px]"
          />
        )}
      </div>
    </div>
  );
}
