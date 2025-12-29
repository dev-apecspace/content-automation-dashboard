"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import { Account, AccountPlatform, Project } from "@/lib/types";
import { AccountService } from "@/lib/services/account-service";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountFormModal } from "@/components/accounts/account-form-modal";
import { toast } from "sonner";
import { getProjects } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { hasPermission } = usePermissions();

  // Filters
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<
    AccountPlatform | "all"
  >("all");

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const [accountsData, projectsData] = await Promise.all([
        AccountService.getAccounts(),
        getProjects(),
      ]);
      setAccounts(accountsData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await AccountService.deleteAccount(id);
        toast.success("Đã xóa tài khoản");
        fetchAccounts();
      } catch (error) {
        toast.error("Xóa thất bại");
      }
    }
  };

  const handleSave = () => {
    fetchAccounts();
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesProject =
      selectedProject === "all" || acc.projectId === selectedProject;
    const matchesPlatform =
      selectedPlatform === "all" || acc.platform === selectedPlatform;
    return matchesProject && matchesPlatform;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
            Kho Tài Khoản
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Quản lý các tài khoản mạng xã hội được kết nối.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAccounts}
            className="bg-white/50 border-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-600"
            title="Tải lại"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          {hasPermission("accounts.create") && (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm tài khoản
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white/40 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium px-2">
          <Filter className="w-4 h-4 text-indigo-500" /> Bộ lọc:
        </div>

        <Select
          value={selectedPlatform}
          onValueChange={(val: any) => setSelectedPlatform(val)}
        >
          <SelectTrigger className="w-[180px] bg-white/60 border-white/40 rounded-lg focus:ring-indigo-100">
            <SelectValue placeholder="Tất cả nền tảng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nền tảng</SelectItem>
            <SelectItem value="Facebook">Facebook</SelectItem>
            <SelectItem value="Youtube">Youtube</SelectItem>
            <SelectItem value="Tiktok">Tiktok</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[220px] bg-white/60 border-white/40 rounded-lg focus:ring-indigo-100">
            <SelectValue placeholder="Tất cả dự án" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dự án</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pb-6">
        <AccountsTable
          accounts={filteredAccounts}
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editAccount={editingAccount}
      />
    </div>
  );
}
