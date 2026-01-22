import { TableRow, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface TableLoadingProps {
  colSpan?: number;
}

export function TableLoading({ colSpan = 1 }: TableLoadingProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mr-2" />
          <span className="text-slate-600 font-medium">
            Đang tải dữ liệu...
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
