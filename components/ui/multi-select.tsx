import React, { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, searchQuery]);

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeItem = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-white/50 hover:bg-white/80 h-auto min-h-[2.5rem] py-1.5 cursor-pointer border-slate-200",
            className
          )}
        >
          <div className="flex-1 flex flex-wrap gap-1 text-left items-center min-w-0">
            {selected.length === 0 && (
              <span className="text-slate-500 font-normal">{placeholder}</span>
            )}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.map((value) => {
                  const option = options.find((o) => o.value === value);
                  if (!option) return null;
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 gap-1 pr-1 py-0.5"
                    >
                      {option.icon}
                      {option.label}
                      <div
                        className="rounded-full hover:bg-slate-300 p-0.5 cursor-pointer"
                        onMouseDown={(e) => removeItem(e, value)}
                      >
                        <X className="h-3 w-3 text-slate-500" />
                      </div>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0"
        align="start"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <Command
          shouldFilter={false} // Handle filtering manually
          className="rounded-lg border shadow-md bg-white overflow-hidden"
        >
          <CommandInput
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-b border-transparent focus:border-transparent focus:ring-0"
          />
          <div className="p-1 border-b bg-slate-50/50">
            <div
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={handleSelectAll}
            >
              <Checkbox
                checked={
                  options.length > 0 && selected.length === options.length
                }
                className="data-[state=checked]:bg-blue-600 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Chọn tất cả
              </span>
            </div>
          </div>
          <CommandList className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 && (
              <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggleOption(option.value)}
                  className="cursor-pointer aria-selected:bg-blue-50"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span>{option.label}</span>
                  {option.icon && (
                    <span className="ml-auto flex items-center text-muted-foreground">
                      {option.icon}
                    </span>
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
