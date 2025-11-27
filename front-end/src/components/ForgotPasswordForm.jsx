import React, { useState } from "react"
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

// --- SCHEMA BƯỚC 1: EMAIL & OTP ---
const step1Schema = z.object({
  email: z.string().email({ message: "Email không đúng định dạng." }),
  otp: z.string().min(4, { message: "Mã xác thực không được để trống." }),
})

// --- SCHEMA BƯỚC 2: MẬT KHẨU MỚI ---
const step2Schema = z.object({
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  confirmPassword: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp.",
  path: ["confirmPassword"],
});

export function ForgotPasswordForm({ onSwitchToRegister, onSwitchToLogin }) {
  // State quản lý bước hiện tại (1: Nhập OTP, 2: Đổi mật khẩu)
  const [step, setStep] = useState(1);
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Khởi tạo form
  const form = useForm({
    resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate ngay khi nhập để mượt hơn
  })

  // Xử lý gửi mã OTP
  const handleGetCode = async () => {
    const isEmailValid = await form.trigger("email");
    if (isEmailValid) {
      const email = form.getValues("email");
      alert(`Đã gửi mã đến ${email}`);
      setIsCodeSent(true);
    }
  };

  // Xử lý nút Submit chung
  const onSubmit = (values) => {
    if (step === 1) {
      // --- LOGIC BƯỚC 1: XÁC THỰC OTP ---
      console.log("Xác thực OTP:", values.otp);
      
      // Giả lập check OTP thành công -> Chuyển sang Bước 2
      setStep(2); 
    } else {
      // --- LOGIC BƯỚC 2: ĐỔI MẬT KHẨU ---
      console.log("Đổi mật khẩu thành công:", values.password);
      alert("Mật khẩu đã được thay đổi! Vui lòng đăng nhập lại.");
      
      // Xong xuôi thì chuyển về trang đăng nhập
      if(onSwitchToLogin) onSwitchToLogin();
    }
  };

  return (
    <div className="w-full">
      {/* --- HEADER --- */}
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h2>
        <p className="text-xs text-gray-500 mt-1">
          {step === 1 
            ? "Nhập email liên kết để khôi phục mật khẩu của bạn" 
            : "Thiết lập mật khẩu mới cho tài khoản của bạn"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          
          {/* ============ BƯỚC 1: EMAIL & OTP ============ */}
          {step === 1 && (
            <>
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-semibold text-sm">Gmail</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <p className="text-xs text-gray-500 pt-1">Vào gmail của bạn lấy mã xác thực</p>

              {/* Nút Lấy mã */}
              <Button 
                type="button" 
                onClick={handleGetCode}
                className="w-full h-9 bg-gray-900 hover:bg-black text-white text-sm"
              >
                {isCodeSent ? "Gửi lại mã" : "Lấy mã xác thực"}
              </Button>

              {/* OTP */}
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="space-y-1 pt-2">
                    <FormLabel className="font-semibold text-sm flex">
                      Nhập mã xác thực <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="1234" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* ============ BƯỚC 2: MẬT KHẨU MỚI ============ */}
          {step === 2 && (
            <>
              {/* Mật khẩu mới */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-semibold text-sm flex">
                      Nhập mật khẩu mới <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="**************" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Nhập lại mật khẩu */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-semibold text-sm flex">
                      Nhập lại mật khẩu mới <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="**************" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* NÚT SUBMIT (Thay đổi text theo bước) */}
          <Button type="submit" className="w-full h-9 bg-gray-900 hover:bg-black text-white text-sm mt-2">
            {step === 1 ? "Tiếp tục" : "Lấy lại mật khẩu"}
          </Button>

        </form>
      </Form>

      {/* --- FOOTER --- */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Bạn chưa đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-black hover:underline"
        >
          Đăng ký
        </button>
      </div>
    </div>
  )
}