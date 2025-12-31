"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Mouse move effect for subtle background parallax or spotlight could go here
  // For now, we use CSS animations for reliability

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
    <div className="relative flex items-center justify-center min-h-screen bg-[#0a0a0a] overflow-hidden selection:bg-indigo-500/30">
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Deep Space Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[70%] -left-[10%] w-[80vw] h-[70vw] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[25s]"></div>
        <div className="absolute top-[5%] right-[5%] w-[40vw] h-[30vw] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[30s]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-12 space-y-8 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        {/* Header */}
        <div className="text-center space-y-3 relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 mb-6 border border-white/10 shadow-inner group overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
            <Lock className="w-7 h-7 text-indigo-300 relative z-10 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Đăng nhập để vào hệ thống
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-300 text-xs font-semibold uppercase tracking-wider ml-1"
              >
                Email
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 z-10">
                  <Mail className="h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-400 drop-shadow-md" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-12 h-12 bg-black/40 border-white/5 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-2xl shadow-inner backdrop-blur-sm"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label
                  htmlFor="password"
                  className="text-slate-300 text-xs font-semibold uppercase tracking-wider"
                >
                  Mật khẩu
                </Label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-400 drop-shadow-md" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 bg-black/40 border-white/5 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-2xl shadow-inner backdrop-blur-sm"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-indigo-300 transition-colors focus:outline-none z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="group relative w-full h-12 overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] transition-all duration-300 hover:scale-[1.02] border border-white/10 cursor-pointer"
            disabled={loading}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập ngay"
              )}
            </span>
          </Button>
        </form>

        {/* Footer/Copyright */}
        <p className="text-center text-[10px] text-slate-600 font-medium tracking-widest uppercase opacity-60">
          SECURED BY APEC GLOBAL
        </p>
      </div>
    </div>
  );
}
