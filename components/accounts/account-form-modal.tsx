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
import {
  ACCOUNT_PLATFORMS_LIST,
  AccountPlatform,
  Account,
  Project,
} from "@/lib/types";
import { accountPlatformIcons } from "@/components/shared/platform-icons";
import { AccountService } from "@/lib/services/account-service";
import { toast } from "sonner";
import { getProjects } from "@/lib/api"; // Ensure this exists or mock if needed
import {
  Hash,
  User,
  Key,
  CheckCircle,
  Folder,
  Link,
  Youtube,
  Eye,
  EyeOff,
} from "lucide-react"; // Icons
import { BackgroundStyle } from "../ui/background-style";

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
    token: "",
    clientId: "",
    clientSecret: "",
    isActive: true,
  });
  const [showToken, setShowToken] = useState(false);
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
        token: "",
        clientId: "",
        clientSecret: "",
        isActive: true,
      });
    }
  }, [editAccount, isOpen]);

  const handleGetOAuthToken = () => {
    if (!formData.clientId || !formData.clientSecret) {
      toast.error("Vui lòng nhập Client ID và Client Secret trước.");
      return;
    }

    // Store credentials for callback
    sessionStorage.setItem("oauth_client_id", formData.clientId);
    sessionStorage.setItem("oauth_client_secret", formData.clientSecret);

    // Calculate window position
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let authUrl = "";
    if (formData.platform === "Youtube") {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${formData.clientId}&redirect_uri=${window.location.origin}/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube&access_type=offline&prompt=consent`;
      sessionStorage.setItem("oauth_platform", "google");
    } else if (formData.platform === "X") {
      // X (Twitter) OAuth 2.0
      // Scopes: tweet.read tweet.write users.read offline.access like.read media.write
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${formData.clientId}&redirect_uri=${window.location.origin}/oauth/callback&scope=tweet.read%20tweet.write%20users.read%20offline.access%20like.read%20media.write&state=state&code_challenge=challenge&code_challenge_method=plain`;
      sessionStorage.setItem("oauth_platform", "x");
    } else {
      toast.error("Nền tảng này chưa hỗ trợ lấy token tự động");
      return;
    }

    const popup = window.open(
      authUrl,
      "Youtube OAuth",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_SUCCESS") {
        const { accessToken, refreshToken } = event.data.payload;

        if (!refreshToken) {
          toast.error(
            "Không tìm thấy Refresh Token. Vui lòng thử lại và cấp quyền truy cập."
          );
          return;
        }

        setFormData((prev) => ({
          ...prev,
          token: refreshToken, // Strictly Refresh Token
        }));
        toast.success("Lấy token thành công!");
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

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
          token: formData.token,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[600px] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-white/40 pb-5 pt-6 px-6 bg-gray-200/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 tracking-wide">
            {editAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản liên kết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                  {ACCOUNT_PLATFORMS_LIST.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center gap-2">
                        {accountPlatformIcons[platform]} {platform}
                      </div>
                    </SelectItem>
                  ))}
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

            {/* OAuth Fields for Youtube & X */}
            {(formData.platform === "Youtube" || formData.platform === "X") && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-medium">
                    Client ID{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      ({formData.platform})
                    </span>
                  </Label>
                  <Input
                    value={formData.clientId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    placeholder="Nhập Client ID..."
                    className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-medium">
                    Client Secret{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      ({formData.platform})
                    </span>
                  </Label>
                  <Input
                    type="password"
                    value={formData.clientSecret || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, clientSecret: e.target.value })
                    }
                    placeholder="Nhập Client Secret..."
                    className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm font-mono text-sm"
                  />
                </div>
              </>
            )}

            {/* Access Token */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  {formData.platform === "Youtube" || formData.platform === "X"
                    ? "Refresh Token"
                    : "Access Token"}{" "}
                  <span className="text-red-500">*</span>
                </div>
                {(formData.platform === "Youtube" ||
                  formData.platform === "X") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetOAuthToken}
                    className="h-7 text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  >
                    Lấy Token
                  </Button>
                )}
              </Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={formData.token}
                  onChange={(e) =>
                    setFormData({ ...formData, token: e.target.value })
                  }
                  placeholder={
                    editAccount
                      ? "Mã hoá (Nhập để thay đổi)"
                      : formData.platform === "Youtube" ||
                        formData.platform === "X"
                      ? "Refresh Token..."
                      : "Access Token..."
                  }
                  required={!editAccount} // Required only on create
                  className="bg-white/50 border-white/60 focus:bg-white/80 rounded-xl shadow-sm font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
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
          </div>

          <div className="flex justify-end gap-3 pt-6 p-6 border-t border-white/40 bg-white/50 backdrop-blur-md shrink-0">
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
