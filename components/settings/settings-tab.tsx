"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  RefreshCw,
  Link2,
  Bot,
  Bell,
  Shield,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSetting,
  getSettings,
  updateSetting,
  getAIConfig,
  updateAIConfig,
  getNotificationSettings,
  updateNotificationSettings,
  getAIModels,
  createAIModel,
  updateAIModel,
  deleteAIModel,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AIModel, ModelType } from "@/lib/types";

export function SettingsTab() {
  // Sheet Settings
  const [sheetUrl, setSheetUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("5");

  // AI Settings (Text Generation)
  const [aiModel, setAiModel] = useState("gpt-4");
  const [aiPrompt, setAiPrompt] = useState(
    "Bạn là chuyên gia sáng tạo nội dung video ngắn cho mạng xã hội..."
  );
  const [maxTokens, setMaxTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);

  // AI Settings (Media Models Registry)
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);

  // Model Dialog State
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [modelForm, setModelForm] = useState<Partial<AIModel>>({
    modelType: "video",
    name: "",
    costPerUnit: 0,
    unitType: "per_second",
  });

  // Notification Settings
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyOnApprove, setNotifyOnApprove] = useState(true);
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [notifyOnError, setNotifyOnError] = useState(true);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const [sheet, ai, notifications, modelRegistry] = await Promise.all([
        getSettings([
          "google_sheet_url",
          "google_api_key",
          "auto_sync_enabled",
          "sync_interval_minutes",
        ]),
        getAIConfig(),
        getNotificationSettings("user_1"),
        getAIModels(),
      ]);

      if (sheet) {
        setSheetUrl(sheet.google_sheet_url || "");
        setApiKey(sheet.google_api_key || "");
        setAutoSync(sheet.auto_sync_enabled === "true");
        setSyncInterval(sheet.sync_interval_minutes || "5");
      }

      if (ai) {
        setAiModel(ai.model_name);
        setAiPrompt(ai.system_prompt || "");
        setMaxTokens(ai.max_tokens);
        setTemperature(ai.temperature);
      }

      // Load Model Registry
      if (modelRegistry && modelRegistry.length > 0) {
        setModelsList(modelRegistry);
      } else {
        console.log("No registry found, using empty list");
        setModelsList([]);
      }
      setIsModelsLoaded(true);

      if (notifications && notifications.length > 0) {
        const notif = notifications[0];
        setNotifyEmail(notif.email);
        setNotifyOnApprove(notif.notify_on_approve);
        setNotifyOnPublish(notif.notify_on_publish);
        setNotifyOnError(notif.notify_on_error);
      }
    } catch (error) {
      toast.error("Failed to load settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSheetSettings = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        updateSetting("google_sheet_url", sheetUrl, "user_1"),
        updateSetting("google_api_key", apiKey, "user_1"),
        updateSetting(
          "auto_sync_enabled",
          autoSync ? "true" : "false",
          "user_1"
        ),
        updateSetting("sync_interval_minutes", syncInterval, "user_1"),
      ]);
      toast.success("Sheet settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAISettings = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        updateAIConfig({
          model_name: aiModel,
          system_prompt: aiPrompt,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      ]);
      toast.success("AI settings saved!");
    } catch (error) {
      toast.error("Failed to save AI settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      await updateNotificationSettings("user_1", notifyEmail, {
        notify_on_approve: notifyOnApprove,
        notify_on_publish: notifyOnPublish,
        notify_on_error: notifyOnError,
      });
      toast.success("Notification settings saved!");
    } catch (error) {
      toast.error("Failed to save notification settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Model Management Handlers ---
  const handleOpenModelDialog = (model?: AIModel) => {
    if (model) {
      setEditingModel(model);
      setModelForm(model);
    } else {
      setEditingModel(null);
      setModelForm({
        modelType: "video",
        name: "",
        costPerUnit: 0,
        unitType: "per_second",
      });
    }
    setIsModelDialogOpen(true);
  };

  const handleSaveModel = async () => {
    if (!modelForm.name || modelForm.costPerUnit === undefined) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const modelType = modelForm.modelType || "video";

      // If we are setting this model to Active (which is default for new, or potentially edited),
      // we need to deactivate others of same type.
      // Current logic for Create: isActive is hardcoded true.
      // Current logic for Edit: we are just updating fields, but we might want to expose isActive toggle in form later.
      // For now, let's assume Create always makes it active, so we deactivate others.

      if (editingModel) {
        // Edit logic
        const updated = await updateAIModel(editingModel.id, modelForm);
        setModelsList((prev) =>
          prev.map((m) => (m.id === editingModel.id ? updated : m))
        );
        toast.success("Cập nhật model thành công");
      } else {
        // Create logic
        // New items are inactive by default to preserve existing active model
        const newModelInput = {
          name: modelForm.name!,
          modelType: modelType,
          costPerUnit: Number(modelForm.costPerUnit),
          unitType: modelForm.unitType || "per_second",
          currency: modelForm.currency || "USD",
          isActive: false,
        } as Omit<AIModel, "id" | "createdAt" | "updatedAt">;

        const newModel = await createAIModel(newModelInput);
        setModelsList((prev) => [...prev, newModel]);
        toast.success("Thêm model thành công");
      }
      setIsModelDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lưu model");
    }
  };

  const handleSetActiveModel = async (model: AIModel) => {
    if (model.isActive) return;

    try {
      // Find currently active model of same type
      const currentActive = modelsList.find(
        (m) => m.modelType === model.modelType && m.isActive
      );

      // Updates to perform
      const updates = [];
      const newModelsList = [...modelsList];

      // 1. Deactivate current
      if (currentActive) {
        updates.push(updateAIModel(currentActive.id, { isActive: false }));
        const idx = newModelsList.findIndex((m) => m.id === currentActive.id);
        if (idx !== -1) {
          newModelsList[idx] = { ...newModelsList[idx], isActive: false };
        }
      }

      // 2. Activate new
      updates.push(updateAIModel(model.id, { isActive: true }));
      const idx = newModelsList.findIndex((m) => m.id === model.id);
      if (idx !== -1) {
        newModelsList[idx] = { ...newModelsList[idx], isActive: true };
      }

      // Optimistic update
      setModelsList(newModelsList);

      await Promise.all(updates);
      toast.success(`Đã kích hoạt model ${model.name}`);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thay đổi trạng thái model");
      // Revert on error (reload)
      loadSettings();
    }
  };

  const handleDeleteModel = async (id: number) => {
    // id is number now
    try {
      if (confirm("Bạn có chắc chắn muốn xóa model này?")) {
        await deleteAIModel(id);
        setModelsList((prev) => prev.filter((m) => m.id !== id));
        toast.success("Đã xóa model");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa model");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cài đặt</h2>
        <p className="text-muted-foreground">
          Cấu hình hệ thống tự động hóa nội dung
        </p>
      </div>

      <Tabs defaultValue="sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sheet" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Google Sheet</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Config</span>
          </TabsTrigger>
          <TabsTrigger value="notify" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Bảo mật</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sheet" className="space-y-4 mt-4">
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Kết nối Google Sheet</CardTitle>
              <CardDescription>
                Nhập URL Google Sheet để đồng bộ dữ liệu với hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheetUrl">URL Google Sheet</Label>
                <Input
                  id="sheetUrl"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Google API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tự động đồng bộ</Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động cập nhật dữ liệu từ Sheet
                  </p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
              {autoSync && (
                <div className="space-y-2">
                  <Label>Tần suất đồng bộ</Label>
                  <Select value={syncInterval} onValueChange={setSyncInterval}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Mỗi 1 phút</SelectItem>
                      <SelectItem value="5">Mỗi 5 phút</SelectItem>
                      <SelectItem value="15">Mỗi 15 phút</SelectItem>
                      <SelectItem value="30">Mỗi 30 phút</SelectItem>
                      <SelectItem value="60">Mỗi 1 giờ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={saveSheetSettings}
                  disabled={isSaving}
                  className="bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
                <Button variant="outline" disabled={isSaving}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Đồng bộ ngay
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cấu trúc Sheet</CardTitle>
              <CardDescription>
                Mapping các cột trong Google Sheet với hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột A:</span>
                    <span className="text-muted-foreground">Trạng thái</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột B:</span>
                    <span className="text-muted-foreground">Ý tưởng</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột C:</span>
                    <span className="text-muted-foreground">Dự án</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột D:</span>
                    <span className="text-muted-foreground">Nền tảng</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột E:</span>
                    <span className="text-muted-foreground">
                      Link video có sẵn
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột F:</span>
                    <span className="text-muted-foreground">
                      Thời lượng video
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột G:</span>
                    <span className="text-muted-foreground">Link ảnh</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột H:</span>
                    <span className="text-muted-foreground">Chủ đề</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột I:</span>
                    <span className="text-muted-foreground">
                      Đối tượng tiếp cận
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột J:</span>
                    <span className="text-muted-foreground">
                      Lưu ý nghiên cứu
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột K:</span>
                    <span className="text-muted-foreground">
                      Ngày đăng dự kiến
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">Cột L:</span>
                    <span className="text-muted-foreground">Giờ đăng</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Cấu hình Text AI</CardTitle>
              <CardDescription>
                Thiết lập AI để tự động tạo kịch bản và nội dung văn bản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Model AI</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Khuyến nghị)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">System Prompt</Label>
                <Textarea
                  id="aiPrompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Nhập prompt hệ thống cho AI..."
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Models Pricing Section */}
          <Card className="py-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cấu hình Media Models</CardTitle>
                <CardDescription>
                  Quản lý giá và thông tin các model tạo Video/Audio/Image
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenModelDialog()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Thêm Model
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tên Model</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Chi phí</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelsList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          Chưa có model nào. Hãy thêm model mới.
                        </TableCell>
                      </TableRow>
                    ) : (
                      modelsList.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium capitalize">
                            {model.modelType}
                          </TableCell>
                          <TableCell>{model.name}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleSetActiveModel(model)}
                              className="focus:outline-none"
                              title={
                                model.isActive
                                  ? "Đang sử dụng"
                                  : "Click để kích hoạt"
                              }
                            >
                              {model.isActive ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>${model.costPerUnit}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {model.unitType === "per_second"
                              ? "/ giây"
                              : model.unitType === "per_megapixel"
                              ? "/ MP"
                              : "/ lượt"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenModelDialog(model)}
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteModel(model.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={saveAISettings}
            disabled={isSaving}
            className="w-full bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Đang lưu..." : "Lưu tất cả cấu hình AI"}
          </Button>
        </TabsContent>

        <TabsContent value="notify" className="space-y-4 mt-4">
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>
                Cấu hình email và thông báo cho hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notifyEmail">Email nhận thông báo</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo khi phê duyệt</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi nội dung được phê duyệt
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnApprove}
                    onCheckedChange={setNotifyOnApprove}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo khi đăng bài</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi nội dung được đăng thành công
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnPublish}
                    onCheckedChange={setNotifyOnPublish}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo khi lỗi</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi xảy ra lỗi
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnError}
                    onCheckedChange={setNotifyOnError}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <Button
                onClick={saveNotificationSettings}
                disabled={isSaving}
                className="bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
              <CardDescription>
                Cài đặt bảo mật và quyền truy cập
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="bg-[#1a365d] hover:bg-[#2a4a7d]">
                <Save className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Add/Edit Model */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 shrink-0 text-left">
            <DialogTitle>
              {editingModel ? "Chỉnh sửa Model" : "Thêm Model Mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2 grid gap-4">
            <div className="space-y-2">
              <Label>Loại Model</Label>
              <Select
                value={modelForm.modelType}
                onValueChange={(val) =>
                  setModelForm({ ...modelForm, modelType: val as ModelType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tên Model</Label>
              <Input
                value={modelForm.name}
                onChange={(e) =>
                  setModelForm({ ...modelForm, name: e.target.value })
                }
                placeholder="Ví dụ: Kling 2.5 Turbo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chi phí ($)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={modelForm.costPerUnit}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      costPerUnit: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Đơn vị tính</Label>
                <Select
                  value={modelForm.unitType}
                  onValueChange={(val) =>
                    setModelForm({ ...modelForm, unitType: val as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_second">/ giây</SelectItem>
                    <SelectItem value="per_megapixel">/ Megapixel</SelectItem>
                    <SelectItem value="per_run">/ lượt (run)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModelDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveModel}>Lưu Model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
