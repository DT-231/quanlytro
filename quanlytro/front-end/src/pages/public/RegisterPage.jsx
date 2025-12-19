import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/authService";

// 1. Import Sonner
import { Toaster, toast } from "sonner";

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
  lastName: z.string().min(1, { message: "Họ không được để trống." }),
  firstName: z.string().min(1, { message: "Tên không được để trống." }),
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
    .regex(/[A-Z]/, { message: "Mật khẩu phải chứa ít nhất một chữ hoa." })
    .regex(/[a-z]/, { message: "Mật khẩu phải chứa ít nhất một chữ thường." })
    .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất một chữ số." })
    .regex(/[\W_]/, { message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt." }),
  confirmPassword: z.string().min(8, { message: "Mật khẩu không khớp." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); 

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: "", 
      firstName: "", 
      email: "", 
      password: "", 
      confirmPassword: "",
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    toast.dismiss();

    try {
      await authService.register(values);
      
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng đăng nhập để tiếp tục.",
        duration: 3000, 
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      console.error("Chi tiết lỗi:", error);

      let message = "Đăng ký thất bại. Vui lòng thử lại.";

      if (error.response && error.response.data) {
        const { detail } = error.response.data;

        if (Array.isArray(detail)) {
          message = detail.map(err => {
             // Map lỗi tiếng Việt
             if (err.loc.includes('email')) return `- Email không hợp lệ hoặc đã tồn tại`;
             if (err.loc.includes('password')) return `- Mật khẩu không đủ mạnh`;
             return `- ${err.msg}`;
          }).join("\n");
        } 
        else if (typeof detail === "string") {
          message = detail;
        }
      }

      toast.error("Đăng ký thất bại", {
        description: message,
        duration: 5000, 
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 px-4 relative">
      <Toaster richColors position="top-right" />

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Đăng ký</h2>
          <p className="text-sm text-gray-500 mt-2">Tạo tài khoản để kết nối với chúng tôi</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Họ & Tên */}
            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold">Họ</FormLabel>
                    <FormControl><Input placeholder="Last name" {...field} className="h-11 bg-slate-50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold">Tên</FormLabel>
                    <FormControl><Input placeholder="First name" {...field} className="h-11 bg-slate-50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Email</FormLabel>
                  <FormControl><Input placeholder="m@example.com" {...field} className="h-11 bg-slate-50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mật khẩu */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Mật khẩu</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nhập lại mật khẩu */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Nhập lại mật khẩu</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-11 bg-black hover:bg-gray-800 text-white font-bold text-base mt-2 shadow-md transition-all"
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký ngay"}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Bạn đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-black hover:underline ml-1">
            Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  )
}