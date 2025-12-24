import React, { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Search,
  User,
  CheckCircle2,
} from "lucide-react";
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
import { Account } from "@/lib/types";

interface AccountSelectorProps {
  accounts: Account[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentProjectId?: string;
  placeholder?: string;
}

export function AccountSelector({
  accounts,
  selectedIds,
  onChange,
  currentProjectId,
  placeholder = "Chọn tài khoản...",
}: AccountSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to normalize string for search
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Manual Filter
  const filteredAccounts = React.useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const query = normalize(searchQuery);
    return accounts.filter((acc) => {
      const name = normalize(acc.channelName);
      const platform = normalize(acc.platform);
      return name.includes(query) || platform.includes(query);
    });
  }, [accounts, searchQuery]);

  // Group accounts: Current Project vs Other Projects
  const currentProjectAccounts = filteredAccounts.filter(
    (acc) => acc.projectId === currentProjectId
  );
  const otherAccounts = filteredAccounts.filter(
    (acc) => acc.projectId !== currentProjectId
  );

  // Limit rendering for performance (e.g. first 50 items)
  // Combine both groups to count total rendered, but split them for display.
  // Actually, simplest is to render all *filtered* items if the list isn't huge (e.g. < 100).
  // If > 100, we might want to slice.
  // Let's slice only if no search query OR if search result is still huge.
  // But slicing groups is tricky.
  // Let's simplify: Render everything if filtered.
  // If no filter (initial open), maybe limit?
  // User complained about lag, likely with NO filter (all accounts).

  const RENDER_LIMIT = 50;
  const totalFiltered = filteredAccounts.length;
  // We will simply slice the arrays for rendering.
  // Priority: Current Project -> Other Projects

  const renderedCurrentProject = currentProjectAccounts.slice(0, RENDER_LIMIT);
  const remainingLimit = Math.max(
    0,
    RENDER_LIMIT - renderedCurrentProject.length
  );
  const renderedOther = otherAccounts.slice(0, remainingLimit);

  const handleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      onChange([]); // Deselect all
    } else {
      onChange(accounts.map((a) => a.id)); // Select all
    }
  };

  const toggleAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white/50 border-white/60 hover:bg-white/80 h-auto min-h-[2.75rem] py-2"
        >
          <div className="flex flex-wrap gap-1 text-left">
            {selectedIds.length === 0 && (
              <span className="text-slate-500 font-normal">{placeholder}</span>
            )}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedIds.slice(0, 3).map((id) => {
                  const acc = accounts.find((a) => a.id === id);
                  if (!acc) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      {acc.channelName}
                    </Badge>
                  );
                })}
                {selectedIds.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600"
                  >
                    +{selectedIds.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <Command
          className="rounded-lg border shadow-md bg-white/95 backdrop-blur-xl overflow-hidden"
          shouldFilter={false} // IMPORTANT: We handle filtering manually
          filter={() => 1}
        >
          <div className="flex items-center border-b px-1">
            <CommandInput
              placeholder="Tìm kiếm tài khoản..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="p-2 border-b bg-slate-50/50">
            <div
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={handleSelectAll}
            >
              <Checkbox
                checked={
                  accounts.length > 0 && selectedIds.length === accounts.length
                }
                className="data-[state=checked]:bg-blue-600 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Chọn tất cả ({accounts.length})
              </span>
            </div>
          </div>

          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredAccounts.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy tài khoản.
              </div>
            )}

            {/* Current Project Group */}
            {renderedCurrentProject.length > 0 && (
              <CommandGroup
                heading="Dự án hiện tại"
                className="text-blue-600 font-semibold"
              >
                {renderedCurrentProject.map((acc) => (
                  <CommandItem
                    key={acc.id}
                    value={acc.channelName + " " + acc.platform}
                    onSelect={() => toggleAccount(acc.id)}
                    className={cn(
                      "flex items-center gap-2 m-1 rounded-lg cursor-pointer aria-selected:bg-blue-50",
                      selectedIds.includes(acc.id) ? "bg-blue-50" : ""
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.includes(acc.id)}
                      className="data-[state=checked]:bg-blue-600 border-slate-300"
                    />
                    <div className="flex flex-col flex-1 gap-0.5">
                      <span className="font-medium text-slate-900">
                        {acc.channelName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {acc.platform}
                      </span>
                    </div>
                    {selectedIds.includes(acc.id) && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {renderedCurrentProject.length > 0 && renderedOther.length > 0 && (
              <CommandSeparator />
            )}

            {/* Other Projects Group */}
            {renderedOther.length > 0 && (
              <CommandGroup heading="Dự án khác">
                {renderedOther.map((acc) => (
                  <CommandItem
                    key={acc.id}
                    value={acc.channelName + " " + acc.platform}
                    onSelect={() => toggleAccount(acc.id)}
                    className={cn(
                      "flex items-center gap-2 m-1 rounded-lg cursor-pointer aria-selected:bg-slate-50",
                      selectedIds.includes(acc.id) ? "bg-slate-50" : ""
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.includes(acc.id)}
                      className="data-[state=checked]:bg-slate-600 border-slate-300"
                    />
                    <div className="flex flex-col flex-1 gap-0.5">
                      <span className="font-medium text-slate-700">
                        {acc.channelName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {acc.platform}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 italic">
                          {acc.projectName || "Unknown Project"}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {totalFiltered > RENDER_LIMIT && (
              <div className="py-2 text-center text-xs text-slate-400 font-medium">
                Hãy tìm kiếm để thấy thêm ({totalFiltered - RENDER_LIMIT} kết
                quả ẩn)
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
