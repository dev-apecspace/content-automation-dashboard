import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "@/lib/api/prompts";
import { Prompt } from "@/lib/types";
import { toast } from "sonner";

export const usePrompts = () => {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: getPrompts,
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Tạo prompt thành công");
    },
    onError: (error) => {
      toast.error("Lỗi khi tạo prompt: " + error.message);
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Prompt> }) =>
      updatePrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Cập nhật prompt thành công");
    },
    onError: (error) => {
      toast.error("Lỗi khi cập nhật prompt: " + error.message);
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Xóa prompt thành công");
    },
    onError: (error) => {
      toast.error("Lỗi khi xóa prompt: " + error.message);
    },
  });
};
