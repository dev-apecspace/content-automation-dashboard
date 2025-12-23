import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Account, AccountPlatform, Project } from "@/lib/types";
import { AccountService } from "@/lib/services/account-service";
import { toast } from "sonner";
import { getProjects } from "@/lib/api"; // Ensure this exists or mock if needed
import {
  Facebook,
  Youtube,
  Video,
  Hash,
  User,
  Key,
  CheckCircle,
  Folder,
  Link,
} from "lucide-react"; // Icons

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editAccount: Account | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAccount,
}) => {
  const [formData, setFormData] = useState<Partial<Account>>({
    platform: "Facebook",
    channelId: "",
    channelName: "",
    accessToken: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    if (editAccount) {
      setFormData({
        ...editAccount,
      });
    } else {
      setFormData({
        platform: "Facebook",
        channelId: "",
        channelName: "",
        accessToken: "",
        isActive: true,
      });
    }
  }, [editAccount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editAccount) {
        await AccountService.updateAccount(editAccount.id, {
          platform: formData.platform,
          channelId: formData.channelId,
          channelName: formData.channelName,
          channelLink: formData.channelLink,
          accessToken: formData.accessToken,
          projectId: formData.projectId,
          projectName: formData.projectName,
          isActive: formData.isActive,
        });
        toast.success("Cập nhật tài khoản thành công!");
      } else {
        await AccountService.createAccount(formData as any);
        toast.success("Thêm tài khoản thành công!");
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case "Facebook":
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case "Youtube":
        return <Youtube className="w-5 h-5 text-red-600" />;
      case "Tiktok":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-black"
          >
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        ); // Using Video icon as placeholder or appropriate one
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[24px] p-0 overflow-y-auto">
        {/* Vibrant Gradient Background Layer */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#a8c0ff]/40 via-[#3f2b96]/10 to-[#ffafbd]/40 blur-3xl pointer-events-none" />

        <DialogHeader className="border-b border-white/40 pb-5 pt-6 px-6 bg-white/40 sticky top-0 z-10 backdrop-blur-md">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 tracking-wide">
            {editAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản liên kết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Project */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Folder className="w-4 h-4 text-blue-500" /> Dự án
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(val) => {
                const project = projects.find((p) => p.id === val);
                setFormData({
                  ...formData,
                  projectId: val,
                  projectName: project?.name,
                });
              }}
            >
              <SelectTrigger className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm">
                <SelectValue placeholder="Chọn dự án (Tùy chọn)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl">
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              Nền tảng <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.platform}
              onValueChange={(val: AccountPlatform) =>
                setFormData({ ...formData, platform: val })
              }
            >
              <SelectTrigger className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm">
                <SelectValue placeholder="Chọn nền tảng" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl">
                <SelectItem value="Facebook">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                  </div>
                </SelectItem>
                <SelectItem value="Youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" /> Youtube
                  </div>
                </SelectItem>
                <SelectItem value="Tiktok">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-black"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>{" "}
                    Tiktok
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <User className="w-4 h-4 text-gray-500" /> Tên kênh / Page{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.channelName}
              onChange={(e) =>
                setFormData({ ...formData, channelName: e.target.value })
              }
              placeholder="Ví dụ: Apec Group Official"
              required
              className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm"
            />
          </div>

          {/* Channel ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Hash className="w-4 h-4 text-gray-500" /> ID Kênh{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.channelId}
              onChange={(e) =>
                setFormData({ ...formData, channelId: e.target.value })
              }
              placeholder="Nhập ID kênh..."
              required
              className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm font-mono text-sm"
            />
          </div>

          {/* Channel Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Link className="w-4 h-4 text-gray-500" /> Link Kênh{" "}
              <span className="text-xs text-slate-400 font-normal">
                (Tùy chọn)
              </span>
            </Label>
            <Input
              value={formData.channelLink || ""}
              onChange={(e) =>
                setFormData({ ...formData, channelLink: e.target.value })
              }
              placeholder="https://..."
              className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm text-sm"
            />
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Key className="w-4 h-4 text-gray-500" /> Access Token{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="password"
              value={formData.accessToken}
              onChange={(e) =>
                setFormData({ ...formData, accessToken: e.target.value })
              }
              placeholder={
                editAccount ? "Mã hoá (Nhập để thay đổi)" : "Nhập token..."
              }
              required={!editAccount} // Required only on create
              className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm font-mono text-sm"
            />
            <p className="text-xs text-slate-500 italic">
              Token sẽ được mã hoá bảo mật trước khi lưu.
            </p>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
            <Label
              className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
              htmlFor="active-mode"
            >
              <CheckCircle className="w-4 h-4 text-green-500" /> Hoạt động
            </Label>
            <Switch
              id="active-mode"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border-white/60 bg-white/50 hover:bg-white/80"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white rounded-xl shadow-md border-0"
            >
              {isLoading
                ? "Đang lưu..."
                : editAccount
                ? "Cập nhật"
                : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
