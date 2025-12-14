import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// 1. Import Sonner
import { Toaster, toast } from "sonner";

// Import UI components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";

// --- SCHEMA VALIDATION ---
const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." }).max(16, { message: "Mật khẩu phải có ít hơn 16 ký tự." }),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo Form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // --- XỬ LÝ SUBMIT VỚI DỮ LIỆU GIẢ ---
  const onSubmit = async (values) => {
    setLoginError("");
    setIsLoading(true);
    try {
      const res = await authService.login(values.email, values.password)
      console.log("res : ",res);
      
      if (res && res.data.success) {
        let data = res.data.data
        let user = data.user
        let token = data.token
        login(user, token);
        
        toast.success(`Chào mừng  ${user.last_name} ${user.first_name} quay trở lại!`, {
          description: "Đăng nhập thành công",
          position: "top-center",
        });

        setTimeout(() => {
          if (user.role === "ADMIN") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        }, 1000);
      } else {
        toast.error("Đăng nhập thất bại", { description: res.data.message });
        setLoginError(res.data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error("Đăng nhập thất bại", { description: "Lỗi đăng nhập" });
      setLoginError("Lỗi đăng nhập");

    } finally {
      setIsLoading(false);
    }
    
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 px-4 relative">
      {/* <Toaster richColors /> */}

      {/* Card Container */}
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-xl border border-gray-100 ">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="text-sm text-gray-500 mt-2">
            Chào mừng bạn trở lại hệ thống quản lý trọ
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {loginError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md text-center animate-in fade-in zoom-in-95 duration-200">
                {loginError}
              </div>
            )}

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold flex">
                    Email <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      {...field}
                      className="h-11 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold flex">
                    Mật khẩu <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="h-11 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-black hover:bg-gray-800 text-white font-bold text-base shadow-md transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý...</span>
                </div>
              ) : "Đăng nhập"}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          Bạn chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-bold text-black hover:underline ml-1"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}