"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

interface ProjectQuantity {
  projectId: string;
  quantity: number;
}

interface AiIdeaModalProps {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  /** Called with the list of { projectId, quantity } when the user confirms */
  onConfirm: (payload: ProjectQuantity[]) => void;
}

export function AiIdeaModal({
  open,
  projects,
  onClose,
  onConfirm,
}: AiIdeaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectQuantities, setProjectQuantities] = useState<
    Record<string, number>
  >({});

  if (!open) return null;

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setProjectQuantities((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: 5 };
    });
  };

  const changeQty = (id: string, delta: number) =>
    setProjectQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(50, (prev[id] ?? 5) + delta)),
    }));

  const handleConfirm = () => {
    const payload = selectedProjectIds.map((id) => ({
      projectId: id,
      quantity: projectQuantities[id] ?? 5,
    }));
    onConfirm(payload);
    // reset
    setSelectedProjectIds([]);
    setProjectQuantities({});
  };

  const totalIdeas = selectedProjectIds.reduce(
    (sum, id) => sum + (projectQuantities[id] ?? 5),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node))
          onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-900">
              ✨ AI Tạo Ý Tưởng
            </h2>
            <p className="text-xs text-amber-700 mt-0.5">
              Chọn dự án và số lượng ý tưởng muốn tạo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-1">
            Chọn dự án (có thể chọn nhiều):
          </p>
          {projects.length === 0 && (
            <p className="text-sm text-slate-400 italic">
              Không có dự án nào.
            </p>
          )}
          {projects.map((project) => {
            const isSelected = selectedProjectIds.includes(project.id);
            return (
              <div
                key={project.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-amber-400 bg-amber-50 shadow-sm"
                    : "border-slate-200 hover:border-amber-200 hover:bg-amber-50/30"
                }`}
                onClick={() => toggleProject(project.id)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-amber-400 border-amber-400"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 12 10"
                      fill="none"
                    >
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Color dot + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || "#6B7280" }}
                  />
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {project.name}
                  </span>
                </div>

                {/* Quantity stepper */}
                {isSelected && (
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-6 h-6 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center transition-colors"
                      onClick={() => changeQty(project.id, -1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={projectQuantities[project.id] ?? 5}
                      onChange={(e) =>
                        setProjectQuantities((prev) => ({
                          ...prev,
                          [project.id]: Math.max(
                            1,
                            Math.min(50, Number(e.target.value) || 1)
                          ),
                        }))
                      }
                      className="w-10 text-center text-sm font-semibold border border-amber-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      className="w-6 h-6 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center transition-colors"
                      onClick={() => changeQty(project.id, 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {selectedProjectIds.length === 0
              ? "Chưa chọn dự án nào"
              : `${selectedProjectIds.length} dự án • ${totalIdeas} ý tưởng`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Huỷ
            </Button>
            <Button
              size="sm"
              disabled={selectedProjectIds.length === 0}
              onClick={handleConfirm}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-900 border-0 shadow-md"
            >
              ✨ Tạo ý tưởng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
