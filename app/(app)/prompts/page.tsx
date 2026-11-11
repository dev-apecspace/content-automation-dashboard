"use strict";
"use client";

import { useState } from "react";
import { Plus, Search, Sparkles, RefreshCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PromptFormModal } from "@/components/prompts/prompt-form-modal";
import { PromptsTable } from "@/components/prompts/prompts-table";
import { usePrompts } from "@/hooks/use-prompts";
import { usePermissions } from "@/hooks/use-permissions";
import { Prompt } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PromptsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { data: prompts, isLoading, refetch } = usePrompts();
  const { hasPermission } = usePermissions();

  const handleCreate = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const uniqueTypes = prompts
    ? Array.from(new Set(prompts.map((p) => p.type)))
    : [];

  const filteredPrompts = prompts
    ? prompts.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = selectedType === "all" || p.type === selectedType;

        return matchesSearch && matchesType;
      })
    : [];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
            Cấu hình Prompts
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Quản lý các prompt dùng cho AI (tạo ý tưởng, nội dung, media...)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="bg-white/50 border-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-600"
            title="Tải lại"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          {hasPermission("prompts.create") && (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm mới
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white/40 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium px-2">
          <Filter className="w-4 h-4 text-indigo-500" /> Bộ lọc:
        </div>

        <div className="relative w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/60 border-white/40 rounded-lg focus:ring-indigo-100 h-9"
          />
        </div>

        <Select
          value={selectedType}
          onValueChange={(val) => setSelectedType(val)}
        >
          <SelectTrigger className="w-[180px] bg-white/60 border-white/40 rounded-lg focus:ring-indigo-100 h-9">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pb-6">
        <PromptsTable
          prompts={filteredPrompts}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      </div>

      <PromptFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        prompt={editingPrompt}
      />
    </div>
  );
}
