import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  ACCOUNT_PLATFORMS_LIST,
  AccountPlatform,
  Account,
  Project,
} from "@/lib/types";
import { accountPlatformIcons } from "@/components/shared/platform-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { Link } from "lucide-react";

interface AccountsTableProps {
  accounts: Account[];
  projects?: Project[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  projects = [],
  onEdit,
  onDelete,
}) => {
  const { hasPermission } = usePermissions();

  const getPlatformIcon = (platform: string) => {
    return accountPlatformIcons[platform as AccountPlatform];
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100 border-b border-gray-200">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[60px] font-semibold text-slate-700">
              Nền tảng
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Dự án
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Tên kênh
            </TableHead>
            <TableHead className="w-[100px] font-semibold text-slate-700">
              Trạng thái
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Hết hạn
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Ngày tạo
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-slate-500"
              >
                Chưa có tài khoản nào được kết nối.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow
                key={account.id}
                className="hover:bg-white/30 border-white/10 transition-colors"
              >
                <TableCell>
                  <div className="p-2 bg-white/60 rounded-lg shadow-sm w-fit">
                    {getPlatformIcon(account.platform)}
                  </div>
                </TableCell>
                <TableCell>
                  {account.projectName ? (
                    <span
                      style={{
                        backgroundColor: projects.find(
                          (p) => p.id === account.projectId,
                        )?.color
                          ? `${
                              projects.find((p) => p.id === account.projectId)
                                ?.color
                            }15`
                          : undefined,
                        color: projects.find((p) => p.id === account.projectId)
                          ?.color,
                        borderColor: projects.find(
                          (p) => p.id === account.projectId,
                        )?.color
                          ? `${
                              projects.find((p) => p.id === account.projectId)
                                ?.color
                            }40`
                          : undefined,
                      }}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                    >
                      {account.projectName}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Chưa gán
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {account.channelLink ? (
                    <a
                      href={account.channelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-blue-600 hover:underline transition-all group w-fit"
                    >
                      {account.channelName}
                      <Link className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity text-blue-500" />
                    </a>
                  ) : (
                    account.channelName
                  )}
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit",
                      account.isActive
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200",
                    )}
                  >
                    {account.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {account.expires_in || "-"}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {account.createdAt
                    ? format(new Date(account.createdAt), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasPermission("accounts.edit") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(account)}
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission("accounts.delete") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(account.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
