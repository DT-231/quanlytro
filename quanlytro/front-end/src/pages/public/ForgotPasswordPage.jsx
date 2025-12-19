import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";

// Import UI
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

// --- SCHEMA ---
const step1Schema = z.object({
  email: z.string().email({ message: "Email không đúng định dạng." }),
  otp: z.string().min(4, { message: "Mã xác thực không được để trống." }),
});

const step2Schema = z.object({
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  confirmPassword: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp.",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Form
  const form = useForm({
    resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  // Gửi mã OTP giả lập
  const handleGetCode = async () => {
    const isEmailValid = await form.trigger("email");
    if (isEmailValid) {
      const email = form.getValues("email");
      alert(`Đã gửi mã OTP đến ${email}`);
      setIsCodeSent(true);
    }
  };

  // Submit
  const onSubmit = (values) => {
    if (step === 1) {
      // --- API CHECK OTP ---
      console.log("OTP:", values.otp);
      setStep(2); // Chuyển sang bước đổi pass
    } else {
      // --- API CHANGE PASS ---
      console.log("New Pass:", values.password);
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h2>
          <p className="text-xs text-gray-500 mt-1">
            {step === 1 
              ? "Nhập email liên kết để khôi phục mật khẩu" 
              : "Thiết lập mật khẩu mới cho tài khoản"}
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Gmail</FormLabel>
                      <FormControl><Input placeholder="m@example.com" {...field} /></FormControl>
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

                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Mã xác thực <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="1234" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Mật khẩu mới</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Nhập lại mật khẩu</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white mt-4">
              {step === 1 ? "Tiếp tục" : "Xác nhận đổi mật khẩu"}
            </Button>

          </form>
        </Form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-black hover:underline">
            Đăng ký
          </Link>
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
}