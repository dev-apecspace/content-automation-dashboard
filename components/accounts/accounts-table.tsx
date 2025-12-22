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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Facebook,
  Youtube,
  Video,
} from "lucide-react";
import { Account } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  onEdit,
  onDelete,
}) => {
  const getPlatformIcon = (platform: string) => {
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100 border-b border-gray-200">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[50px] font-semibold text-slate-700">
              Nền tảng
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Dự án
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Tên kênh
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              ID Kênh
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              Access Token
            </TableHead>
            <TableHead className="w-[100px] font-semibold text-slate-700">
              Trạng thái
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
                colSpan={7}
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
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {account.projectName}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Chưa gán
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {account.channelName}
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">
                  {account.channelId}
                </TableCell>
                <TableCell>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500">
                    {account.accessToken ? "******" : "Not Set"}
                  </code>
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit",
                      account.isActive
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
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
                  {account.createdAt
                    ? format(new Date(account.createdAt), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/50"
                      >
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[160px] bg-white/90 backdrop-blur-xl"
                    >
                      <DropdownMenuItem
                        onClick={() => onEdit(account)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(account.id)}
                        className="text-red-600 focus:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
