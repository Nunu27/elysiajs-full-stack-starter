'use client';

import * as React from 'react';

import { Button, buttonVariants } from '@frontend/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@frontend/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@frontend/components/ui/popover';
import { Spinner } from '@frontend/components/ui/spinner';
import { cn } from '@frontend/lib/utils';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type ComboBoxProps = {
  options?: Option[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  width?: string;
  allowClear?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSearchChange?: (search: string) => void;
  shouldFilter?: boolean;
};

export function ComboBox({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No option found.',
  disabled = false,
  width = 'w-[150px]',
  allowClear = false,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSearchChange,
  shouldFilter = true,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const searchRef = React.useRef('');

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === value) || null;
  }, [options, value]);

  const handleSelect = (currentValue: string) => {
    if (currentValue === value) {
      onChange?.(undefined);
    } else {
      onChange?.(currentValue);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(undefined);
  };

  const handleSearchChange = (newSearch: string) => {
    searchRef.current = newSearch;
    onSearchChange?.(newSearch);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(width, 'justify-between cursor-pointer!')}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <div className="flex items-center">
            {allowClear && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                  'size-6 m-2',
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear(e);
                }}
              >
                <XIcon className="opacity-50 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDownIcon className="opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(width, 'p-0')} align="start">
        <OptionList
          options={options}
          value={value}
          onSelect={handleSelect}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onSearchChange={handleSearchChange}
          shouldFilter={shouldFilter}
        />
      </PopoverContent>
    </Popover>
  );
}

function OptionList({
  options,
  value,
  onSelect,
  searchPlaceholder,
  emptyMessage,
  isLoading,
  hasMore,
  onLoadMore,
  onSearchChange,
  shouldFilter,
}: {
  options: Option[];
  value?: string;
  onSelect: (value: string) => void;
  searchPlaceholder: string;
  emptyMessage: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore?: () => void;
  onSearchChange: (search: string) => void;
  shouldFilter: boolean;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom) {
      onLoadMore();
    }
  };

  return (
    <Command shouldFilter={shouldFilter}>
      <CommandInput
        placeholder={searchPlaceholder}
        onValueChange={onSearchChange}
      />
      <CommandList ref={listRef} onScroll={handleScroll}>
        <CommandEmpty>
          {isLoading ? <Spinner className="size-6 py-3" /> : emptyMessage}
        </CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={onSelect}
            >
              <span className="truncate">{option.label}</span>
              <CheckIcon
                className={cn(
                  'ml-auto',
                  value === option.value ? 'opacity-100' : 'opacity-0',
                )}
              />
            </CommandItem>
          ))}
          {hasMore && isLoading && (
            <div className="flex items-center justify-center py-2">
              <Spinner className="size-4" />
            </div>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
