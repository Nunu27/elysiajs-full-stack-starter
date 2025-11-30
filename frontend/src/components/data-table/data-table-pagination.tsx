import { Label } from '@frontend/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@frontend/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import type { PageInfo } from '@frontend/types/pagination';

type DataTablePaginationProps = {
  pageInfo?: PageInfo;
  isLoading?: boolean;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function DataTablePagination({
  pageInfo,
  isLoading = false,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const { page = 1, perPage = 10, total = 0, totalPages = 0 } = pageInfo ?? {};

  const from = Math.min((page - 1) * perPage + 1, total);
  const to = Math.min(page * perPage, total);

  const canGoPrev = page > 1 && !isLoading;
  const canGoNext = page < totalPages && !isLoading;
  const canGoFirst = page > 1 && !isLoading;
  const canGoLast = page < totalPages && !isLoading;

  const showLeftEllipsis = page > 2;
  const showRightEllipsis = page < totalPages - 1;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Label htmlFor="rows-per-page" className="text-sm font-medium">
          Rows per page
        </Label>
        <Select
          value={`${perPage}`}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={isLoading}
        >
          <SelectTrigger size="sm" className="w-20" id="rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem className="text-sm text-muted-foreground">
            {from ?? '?'}-{to ?? '?'} of {total ?? '?'}
          </PaginationItem>

          <PaginationItem>
            <PaginationFirst
              onClick={canGoFirst ? () => onPageChange(1) : undefined}
              className={canGoFirst ? undefined : 'opacity-50'}
              aria-label="Go to first page"
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              onClick={canGoPrev ? () => onPageChange(page - 1) : undefined}
              className={canGoPrev ? undefined : 'opacity-50'}
              aria-label="Go to previous page"
            />
          </PaginationItem>

          {showLeftEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {page > 1 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(page - 1)}
                aria-label={`Go to page ${page - 1}`}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              disabled
              aria-label={`Current page ${page}`}
              aria-current="page"
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {page < totalPages && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(page + 1)}
                aria-label={`Go to page ${page + 1}`}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {showRightEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={canGoNext ? () => onPageChange(page + 1) : undefined}
              className={
                canGoNext ? 'cursor-pointer' : 'pointer-events-none opacity-50'
              }
              aria-label="Go to next page"
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLast
              onClick={canGoLast ? () => onPageChange(totalPages) : undefined}
              className={
                canGoLast ? 'cursor-pointer' : 'pointer-events-none opacity-50'
              }
              aria-label="Go to last page"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
