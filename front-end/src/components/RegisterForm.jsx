import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// 1. Cập nhật Schema: Tách Họ và Tên riêng biệt
const formSchema = z.object({
  lastName: z.string().min(1, {
    message: "Họ không được để trống.",
  }),
  firstName: z.string().min(1, {
    message: "Tên không được để trống.",
  }),
  email: z.string().email({
    message: "Email không hợp lệ.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
});

export function RegisterForm({ onSwitchToLogin }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: "",  // Default value cho Họ
      firstName: "", // Default value cho Tên
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(values) {
    console.log("Register Values:", values)
    alert(`Đăng ký thành công: ${values.lastName} ${values.firstName}`)
    // Gọi API đăng ký ở đây...
  }

  return (
    <div className="w-full">
      {/* --- HEADER --- */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Đăng ký</h2>
        <p className="text-sm text-gray-500 mt-1">Đăng ký để kết nối với chúng tôi</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* HÀNG ĐẦU TIÊN: HỌ VÀ TÊN (Layout Flexbox) */}
          <div className="flex gap-3">
            
            {/* Cột Trái: HỌ */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="flex-1"> {/* flex-1 để chiếm 50% */}
                  <FormLabel className="font-semibold">Họ</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cột Phải: TÊN */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="flex-1"> {/* flex-1 để chiếm 50% */}
                  <FormLabel className="font-semibold">Tên</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* FIELD: EMAIL */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* FIELD: PASSWORD */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="*************" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* FIELD: CONFIRM PASSWORD */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nhập lại mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="*************" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NÚT SUBMIT */}
          <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-black text-white font-medium text-base mt-2">
            Đăng ký
          </Button>
        </form>
      </Form>

      {/* --- FOOTER --- */}
      <div className="text-center mt-6 text-sm text-gray-600">
        Bạn đã có tài khoản?{" "}
        <button 
          type="button"
          onClick={onSwitchToLogin} 
          className="font-semibold text-black hover:text-gray-700 hover:underline"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  )
}