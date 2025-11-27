import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Import components từ shadcn
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

// 1. Schema Validation (Bắt buộc Email & Password)
const formSchema = z.object({
  email: z.string().email({
    message: "Email không hợp lệ.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
})

export function LoginForm({ onClose, onSwitchToRegister, onSwitchToForgot }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values) {
    console.log("Login Values:", values)
    alert(`Đăng nhập với Email: ${values.email}`)
    // Gọi API login ở đây...
    if (onClose) onClose()
  }

  return (
    <div className="w-full">
      {/* --- HEADER FORM --- */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>
        <p className="text-sm text-gray-500 mt-1">Chào mừng bạn trở lại với chúng tôi</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* FIELD: EMAIL */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold flex">
                  Email <span className="text-red-500 ml-1">*</span>
                </FormLabel>
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
                <FormLabel className="font-semibold flex">
                  Mật khẩu <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="*************" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* QUÊN MẬT KHẨU */}
          <div className="text-right">
            <button
              type="button"
              onClick={onSwitchToForgot} 
              className="text-xs text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* NÚT SUBMIT */}
          <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-black text-white font-medium text-base mt-2">
            Đăng nhập
          </Button>
        </form>
      </Form>

    
      {/* --- FOOTER --- */}
      <div className="text-center mt-6 text-sm text-gray-600">
        Bạn chưa đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-black hover:underline hover:text-gray-700 transition-colors"
        >
          Đăng ký
        </button>
      </div>
    </div>
  )
}