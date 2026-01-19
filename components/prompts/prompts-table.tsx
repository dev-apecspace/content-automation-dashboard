"use strict";
import { useState } from "react";
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
import { Prompt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePrompt } from "@/hooks/use-prompts";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PromptsTableProps {
  prompts: Prompt[];
  onEdit: (prompt: Prompt) => void;
}

export function PromptsTable({ prompts, onEdit }: PromptsTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deletePrompt = useDeletePrompt();
  const { hasPermission } = usePermissions();

  const handleDelete = async () => {
    if (deleteId) {
      await deletePrompt.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100 border-b border-gray-200">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[80px] font-semibold text-slate-700">
                ID
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Tên Prompt
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Loại
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Mô tả
              </TableHead>
              <TableHead className="w-[120px] font-semibold text-slate-700">
                Trạng thái
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Ngày tạo
              </TableHead>
              <TableHead className="w-[100px] text-right font-semibold text-slate-700">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-slate-500"
                >
                  Chưa có prompt nào.
                </TableCell>
              </TableRow>
            ) : (
              prompts.map((prompt) => (
                <TableRow
                  key={prompt.id}
                  className="hover:bg-white/30 border-white/10 transition-colors"
                >
                  <TableCell className="font-mono text-slate-500 text-xs">
                    #{prompt.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {prompt.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-white/60 text-slate-600 border-slate-200 font-normal"
                    >
                      {prompt.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[300px] truncate text-slate-600"
                    title={prompt.description}
                  >
                    {prompt.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit",
                        prompt.isActive
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200",
                      )}
                    >
                      {prompt.isActive ? (
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
                    {prompt.createdAt
                      ? format(new Date(prompt.createdAt), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasPermission("prompts.edit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(prompt)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("prompts.delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(prompt.id)}
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Prompt này sẽ bị xóa vĩnh viễn
              khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
