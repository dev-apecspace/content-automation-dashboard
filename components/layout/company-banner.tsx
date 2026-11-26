"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, X } from "lucide-react";
import {
  getSelectedCompanyInfo,
  clearSelectedCompany,
} from "@/actions/business-action";
import { usePermissions } from "@/hooks/use-permissions";

/**
 * Banner hiển thị công ty đang quản lý (admin/nhân viên đã chọn công ty).
 * Các trang nghiệp vụ đang scope theo công ty này; "Thoát" để xem toàn bộ.
 */
export function CompanyBanner() {
  const router = useRouter();
  const { role } = usePermissions();
  const [company, setCompany] = useState<{ slug: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (role && role !== "customer") {
      getSelectedCompanyInfo()
        .then((c) =>
          setCompany(
            c?.slug ? { slug: c.slug, name: c.name ?? "" } : null,
          ),
        )
        .catch(() => setCompany(null));
    }
  }, [role]);

  if (!company) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <p className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
        <Building2 className="h-4 w-4" />
        Bạn đang ở công ty: <strong>{company.name}</strong>
        <span className="font-mono text-xs opacity-70">/{company.slug}</span>
        <span className="text-xs opacity-70">
          — dữ liệu nghiệp vụ đang lọc theo công ty này
        </span>
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-indigo-600 hover:text-indigo-700"
        onClick={async () => {
          await clearSelectedCompany();
          setCompany(null);
          router.refresh();
        }}
      >
        <X className="mr-1 h-3.5 w-3.5" /> Thoát xem công ty
      </Button>
    </div>
  );
}
