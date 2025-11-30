import { cn } from '@frontend/lib/utils';
import { type Column } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  const { label = '', center = false } = column.columnDef.meta || {};

  return (
    <div
      className={cn(
        'flex items-center',
        center ? 'justify-center' : 'justify-start',
      )}
      onClick={
        canSort
          ? () => {
              if (!sorted) {
                column.toggleSorting(false);
              } else if (sorted === 'asc') {
                column.toggleSorting(true);
              } else {
                column.clearSorting();
              }
            }
          : undefined
      }
    >
      {label}
      {column.getCanSort() &&
        (sorted === 'asc' ? (
          <ArrowUpIcon className="ml-2 h-4 w-4" />
        ) : sorted === 'desc' ? (
          <ArrowDownIcon className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
        ))}
    </div>
  );
}
