import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
} from "lucide-react";
import { Account } from "@/lib/types";
import { AccountService } from "@/lib/services/account-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { accountPlatformIcons } from "@/components/shared/platform-icons";

interface ParameterManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountIds: string[];
  accounts: Account[];
  onAccountsUpdated: () => void; // Refresh accounts
}

export const ParameterManagerDialog: React.FC<ParameterManagerDialogProps> = ({
  isOpen,
  onClose,
  selectedAccountIds,
  accounts,
  onAccountsUpdated,
}) => {
  const selectedAccounts = accounts.filter((a) =>
    selectedAccountIds.includes(a.id)
  );

  const [addingToAccountId, setAddingToAccountId] = useState<string | null>(
    null
  );
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamValue, setNewParamValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Helper to save parameter
  const handleSaveParam = async (account: Account) => {
    if (!newParamKey.trim() || !newParamValue.trim()) {
      toast.error("Vui lòng nhập cả Mã và Giá trị");
      return;
    }

    setIsSaving(true);
    try {
      const currentFields = account.customFields || {};
      const updatedFields = {
        ...currentFields,
        [newParamKey.trim()]: newParamValue.trim(),
      };

      await AccountService.updateAccount(account.id, {
        customFields: updatedFields,
      });

      toast.success("Đã thêm tham số mới");
      setAddingToAccountId(null);
      setNewParamKey("");
      setNewParamValue("");
      onAccountsUpdated();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu tham số");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAdd = (accountId: string) => {
      setAddingToAccountId(accountId);
      setNewParamKey("");
      setNewParamValue("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0 bg-white border-b z-10">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Quản lý tham số cá nhân hóa
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Xem và thêm nhanh tham số cho các tài khoản đang chọn.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {selectedAccounts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">
              Vui lòng chọn ít nhất một tài khoản để quản lý tham số.
            </div>
          ) : (
            selectedAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {accountPlatformIcons[acc.platform]}
                    <span className="font-medium text-slate-700">
                      {acc.channelName}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({acc.platform})
                    </span>
                  </div>
                  {addingToAccountId !== acc.id && (
                     <Button
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        onClick={() => handleStartAdd(acc.id)}
                     >
                         <Plus className="w-3.5 h-3.5 mr-1"/> Thêm tham số
                     </Button>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Parameter List */}
                  <div className="flex flex-wrap gap-2">
                    {(!acc.customFields ||
                      Object.keys(acc.customFields).length === 0) && (
                      <span className="text-xs text-slate-400 italic">
                        Chưa có tham số nào.
                      </span>
                    )}

                    {acc.customFields &&
                      Object.entries(acc.customFields).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs group hover:border-slate-300 transition-colors"
                          title={`Giá trị: ${v}`}
                        >
                          <span className="font-mono font-semibold text-slate-600">
                            [{k}]
                          </span>
                          <span className="text-slate-400">=</span>
                          <span className="text-slate-800 max-w-[150px] truncate">
                            {v}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Add Form */}
                  {addingToAccountId === acc.id && (
                    <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 mb-2">
                            Thêm tham số mới
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Mã (vd: phone)" 
                                    className="h-8 text-xs bg-white"
                                    value={newParamKey}
                                    onChange={e => setNewParamKey(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex-[2]">
                                <Input 
                                    placeholder="Giá trị (vd: 0912...)" 
                                    className="h-8 text-xs bg-white"
                                    value={newParamValue}
                                    onChange={e => setNewParamValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveParam(acc);
                                    }}
                                />
                            </div>
                            <Button 
                                size="sm" 
                                className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleSaveParam(acc)}
                                disabled={isSaving}
                            >
                                <Save className="w-3.5 h-3.5"/>
                            </Button>
                             <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                onClick={() => setAddingToAccountId(null)}
                            >
                                <X className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>  
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t bg-white flex justify-end">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
