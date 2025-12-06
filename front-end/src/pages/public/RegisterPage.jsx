import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom"; // Import Link để chuyển trang

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
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  confirmPassword: z.string().min(6, { message: "Mật khẩu không khớp." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  // Khởi tạo Form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: "", firstName: "", email: "", password: "", confirmPassword: "",
    },
  });

  // Xử lý Submit
  function onSubmit(values) {
    console.log("Register Values:", values);
    // --- GỌI API ĐĂNG KÝ TẠI ĐÂY ---
    // Ví dụ: await authApi.register(values);
    
    alert(`Đăng ký thành công! Xin chào ${values.lastName} ${values.firstName}`);
    
    // Đăng ký xong chuyển về trang login
    navigate('/login');
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Đăng ký</h2>
          <p className="text-sm text-gray-500 mt-2">Tạo tài khoản để kết nối với chúng tôi</p>
        </div>

        {/* Form */}
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

            {/* Submit Button */}
            <Button type="submit" className="w-full h-11 bg-black hover:bg-gray-800 text-white font-bold text-base mt-2 shadow-md transition-all">
              Đăng ký ngay
            </Button>
          </form>
        </Form>

        {/* Footer */}
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