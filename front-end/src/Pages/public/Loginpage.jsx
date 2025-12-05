import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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

// --- SCHEMA VALIDATION ---
const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState(""); // State báo lỗi

  // Khởi tạo Form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // Xử lý Submit
  function onSubmit(values) {
    setLoginError(""); // Reset lỗi cũ

    // --- LOGIC GIẢ LẬP LOGIN ---
    // (Sau này thay bằng API call thực tế)
    if (values.email === "admin@gmail.com" && values.password === "123456") {
      const adminData = {
        id: 1, name: "Admin Code", role: "admin", avatar: "https://github.com/shadcn.png"
      };
      login(adminData);
      navigate("/admin/dashboard");
    } 
    else if (values.email === "user@gmail.com" && values.password === "123456") {
      const userData = {
        id: 2, name: "Khách thuê A", role: "user", avatar: "https://github.com/shadcn.png"
      };
      login(userData);
      navigate("/");
    } 
    else {
      setLoginError("Email hoặc mật khẩu không chính xác!");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 px-4">
      {/* Card Container */}
      <div className="w-full  max-w-md bg-white p-6 rounded-xl shadow-xl border border-gray-100 ">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="text-sm text-gray-500 mt-2">Chào mừng bạn trở lại hệ thống quản lý trọ</p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Error Alert */}
            {loginError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md text-center">
                {loginError}
              </div>
            )}

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold flex">Email <span className="text-red-500 ml-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="admin@gmail.com" {...field} className="h-11 bg-slate-50" />
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
                  <FormLabel className="font-semibold flex">Mật khẩu <span className="text-red-500 ml-1">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-11 bg-black hover:bg-gray-800 text-white font-bold text-base shadow-md transition-all">
              Đăng nhập
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-black hover:underline ml-1">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
}