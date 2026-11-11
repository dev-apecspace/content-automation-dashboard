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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* Flying Particles Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Helper style for the animation */}
        <style jsx>{`
          @keyframes float-up {
            0% {
              transform: translateY(120vh) translateX(-10vw) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.8;
            }
            90% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(-20vh) translateX(10vw) rotate(180deg);
              opacity: 0;
            }
          }
        `}</style>

        {/* Deep atmospheric glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-indigo-950/20 to-black z-0" />

        {/* Particles - Client Side Only to avoid mismatch */}
        {mounted &&
          Array.from({ length: 30 }).map((_, i) => {
            const colors = [
              "#6366f1",
              "#8b5cf6",
              "#ec4899",
              "#3b82f6",
              "#14b8a6",
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <div
                key={i}
                className="absolute rounded-full mix-blend-screen filter blur-[1px]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 6 + 3}px`,
                  height: `${Math.random() * 6 + 3}px`,
                  backgroundColor: color,
                  opacity: Math.random() * 0.5 + 0.3,
                  animation: `float-up ${
                    Math.random() * 15 + 10
                  }s linear infinite`,
                  animationDelay: `-${Math.random() * 20}s`,
                  boxShadow: `0 0 ${Math.random() * 10 + 5}px ${color}`,
                }}
              />
            );
          })}
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-12 space-y-8 bg-white/5 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
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
                  className="pl-12 h-12 bg-black/40 border-white/20 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-2xl shadow-inner backdrop-blur-sm"
                  placeholder="Nhập email"
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
                  className="pl-12 pr-12 h-12 bg-black/40 border-white/20 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-2xl shadow-inner backdrop-blur-sm"
                  placeholder="Nhập mật khẩu"
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
      </div>
    </div>
  );
}
