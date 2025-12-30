"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      toast.success("Đăng nhập thành công");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      let message = error.message;
      if (message === "Invalid credentials") {
        message = "Email hoặc mật khẩu không chính xác";
      } else if (message === "Email and password are required") {
        message = "Vui lòng nhập đầy đủ email và mật khẩu";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] bg-gradient-to-br from-indigo-900/20 via-slate-900 to-indigo-900/20">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-400">Đăng nhập vào tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Mật khẩu
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 h-11"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
