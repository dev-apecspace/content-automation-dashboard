"use strict";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Prompt } from "@/lib/types";
import { useCreatePrompt, useUpdatePrompt } from "@/hooks/use-prompts";
import {
  Type,
  FileText,
  Code,
  CheckCircle,
  Info,
  FilePenLine,
  AlertTriangle,
} from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Tên prompt là bắt buộc"),
  type: z.string().min(1, "Loại prompt là bắt buộc"),
  template: z.string().min(1, "Template là bắt buộc"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: Prompt | null;
}

export function PromptFormModal({
  isOpen,
  onClose,
  prompt,
}: PromptFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      template: "",
      description: "",
      isActive: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (prompt) {
        form.reset({
          name: prompt.name,
          type: prompt.type,
          template: prompt.template,
          description: prompt.description || "",
          isActive: prompt.isActive,
        });
      } else {
        form.reset({
          name: "",
          type: "",
          template: "",
          description: "",
          isActive: false,
        });
      }
    }
  }, [isOpen, prompt, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (prompt) {
        await updatePrompt.mutateAsync({ id: prompt.id, data: values });
      } else {
        await createPrompt.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[750px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="border-b border-gray/70 py-4 px-6 bg-gray-100 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 tracking-wide">
            <FilePenLine className="w-5 h-5 text-indigo-600" />
            {prompt ? "Chỉnh sửa Prompt" : "Thêm mới Prompt"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <FileText className="w-4 h-4 text-blue-500" /> Tên Prompt
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên prompt..."
                        {...field}
                        className="bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <Type className="w-4 h-4 text-purple-500" /> Loại
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập loại (vd: idea, content, media)..."
                        {...field}
                        className="bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <Code className="w-4 h-4 text-amber-500" /> Template
                    </FormLabel>
                    <div className="flex items-start gap-2 p-3 mb-2 text-amber-600 bg-amber-50 rounded-lg border border-amber-100">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold block mb-0.5">
                          Lưu ý quan trọng:
                        </span>
                        Cẩn trọng khi chỉnh sửa format output (ví dụ JSON), nếu
                        sai cấu trúc sẽ gây lỗi hệ thống.
                      </div>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập nội dung prompt template..."
                        className="min-h-[200px] text-sm bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm custom-scrollbar"
                        spellCheck={false}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <Info className="w-4 h-4 text-slate-500" /> Ghi chú{" "}
                      <span className="text-slate-400 font-normal text-xs">
                        (Tùy chọn)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả công dụng của prompt..."
                        className="min-h-[80px] bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm resize-none text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Kích
                      hoạt
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 py-3 px-6 border-t border-gray/70 bg-gray-100 backdrop-blur-md shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border-white/60 bg-white/50 hover:bg-white/80"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white rounded-xl shadow-md border-0"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu Prompt"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
