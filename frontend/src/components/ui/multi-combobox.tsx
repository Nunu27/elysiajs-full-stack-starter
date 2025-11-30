'use client';

import * as React from 'react';

import { Button } from '@frontend/components/ui/button';
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
import { cn } from '@frontend/lib/utils';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  checked: boolean;
};

type MultiComboBoxProps = {
  options: Option[];
  onChange: (value: string, checked: boolean) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  width?: string;
  icon?: React.ReactNode;
  label?: string;
};

export function MultiComboBox({
  options,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  disabled = false,
  width = 'w-auto',
  icon,
  label,
}: MultiComboBoxProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: string, checked: boolean) => {
    onChange(value, checked);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
        >
          {icon}
          {label && <span className="hidden lg:inline">{label}</span>}
          {!label && <span className="truncate">{placeholder}</span>}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(width, 'p-0')} align="end">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    handleToggle(option.value, !option.checked);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.checked && (
                    <CheckIcon size={16} className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
