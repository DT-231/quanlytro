import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Info, Image as ImageIcon, Loader2, X } from "lucide-react"; 
import { toast } from "sonner"; 

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { authService } from "@/services/authService"; 

// --- SCHEMA VALIDATION ---
const formSchema = z.object({
  lastName: z.string().min(1, "Họ không được để trống"), // Tách riêng Họ
  firstName: z.string().min(1, "Tên không được để trống"), // Tách riêng Tên
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"), 
  dob: z.string().optional(),
  cccd: z.string().min(9, "CCCD phải có ít nhất 9 số"),
  gender: z.string().optional(),
  hometown: z.string().optional(),
});

export default function AddTenantModal({ isOpen, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPass, setGeneratedPass] = useState("");

  const [frontImage, setFrontImage] = useState(null); 
  const [backImage, setBackImage] = useState(null);   
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: "", 
      firstName: "", 
      phone: "", email: "", dob: "", cccd: "", gender: "Nam", hometown: "",
    },
  });

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === "front") setFrontImage({ file, preview: previewUrl });
      else setBackImage({ file, preview: previewUrl });
    }
  };

  const removeImage = (type) => {
    if (type === "front") {
        setFrontImage(null);
        if(frontInputRef.current) frontInputRef.current.value = "";
    } else {
        setBackImage(null);
        if(backInputRef.current) backInputRef.current.value = "";
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
    //   const phoneSuffix = values.phone.slice(-4);
      const defaultPassword = `12345678`;
      const apiPayload = {
        first_name: values.firstName, 
        last_name: values.lastName,   
        email: values.email,
        phone: values.phone,
        cccd: values.cccd,
        date_of_birth: values.dob || null,
        
        status: "ACTIVE",
        is_temporary_residence: false,
        temporary_residence_date: null,
        
        password: defaultPassword,
        confirm_password: defaultPassword,
      };

      console.log("Creating account:", apiPayload);

      const res = await authService.createTenant(apiPayload);

      if (res) {
        toast.success("Tạo tài khoản thành công!", {
            description: `Tên đăng nhập: ${values.email} \nMật khẩu: ${defaultPassword}`,
            duration: 10000, 
        });
        
        setGeneratedPass(defaultPassword);

        const fullNameCombined = `${values.lastName} ${values.firstName}`;
        if (onAddSuccess) onAddSuccess({ ...values, fullName: fullNameCombined, id: res.id || Date.now() });
        
        setTimeout(() => {
            onClose();
            form.reset();
            setFrontImage(null);
            setBackImage(null);
            setActiveTab("info");
            setGeneratedPass("");
        }, 2000);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      if (error.response?.data?.detail) {
          const detail = error.response.data.detail;
          if (Array.isArray(detail)) {
             toast.error(`Lỗi: ${detail[0].msg} (${detail[0].loc.join(".")})`);
          } else {
             toast.error(detail);
          }
      } else {
          toast.error("Tạo tài khoản thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white text-black">
        
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Thêm khách thuê</DialogTitle>
            <DialogDescription>
                Hệ thống sẽ tự động tạo tài khoản đăng nhập cho khách với thông tin dưới đây.
            </DialogDescription>
            </DialogHeader>
        </div>

        <div className="flex border-b px-6">
            <button type="button" onClick={() => setActiveTab("info")} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "info" ? "border-black text-black" : "border-transparent text-gray-500"}`}>
                <Info size={16} /> Thông tin
            </button>
            <button type="button" onClick={() => setActiveTab("images")} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "images" ? "border-black text-black" : "border-transparent text-gray-500"}`}>
                <ImageIcon size={16} /> Ảnh CCCD
            </button>
        </div>

        <div className="p-6 pt-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {activeTab === "info" && (
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* --- SỬA: Tách Họ và Tên thành 2 input --- */}
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Họ</FormLabel><FormControl><Input placeholder="Last name" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Tên</FormLabel><FormControl><Input placeholder="First name" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                        )}/>

                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Email </FormLabel><FormControl><Input placeholder="email@example.com" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Số điện thoại</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                        )}/>

                         <FormField control={form.control} name="cccd" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">CCCD</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="dob" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Ngày sinh</FormLabel><FormControl><Input type="date" {...field} className="h-9 block w-full" /></FormControl></FormItem>
                        )}/>
                       
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Giới tính</FormLabel><FormControl><select {...field} className="flex h-9 w-full rounded-md border px-3 text-sm"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="hometown" render={({ field }) => (
                            <FormItem className="col-span-1"><FormLabel className="text-xs font-semibold">Quê quán</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl></FormItem>
                        )}/>
                    </div>
                )}

                {/* TAB ẢNH (Giữ nguyên) */}
                {activeTab === "images" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer group" onClick={() => frontInputRef.current.click()}>
                                <input type="file" accept="image/*" className="hidden" ref={frontInputRef} onChange={(e) => handleImageChange(e, "front")}/>
                                {frontImage ? (
                                    <>
                                        <img src={frontImage.preview} alt="CCCD Trước" className="h-full w-full object-contain rounded-lg p-1" />
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeImage("front"); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"><X size={14} /></button>
                                    </>
                                ) : (
                                    <div className="text-center p-4"><Upload className="text-gray-400 mx-auto mb-2" size={20} /><p className="text-sm font-medium text-gray-600">Mặt trước</p></div>
                                )}
                            </div>
                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer group" onClick={() => backInputRef.current.click()}>
                                <input type="file" accept="image/*" className="hidden" ref={backInputRef} onChange={(e) => handleImageChange(e, "back")}/>
                                {backImage ? (
                                    <>
                                        <img src={backImage.preview} alt="CCCD Sau" className="h-full w-full object-contain rounded-lg p-1" />
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeImage("back"); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"><X size={14} /></button>
                                    </>
                                ) : (
                                    <div className="text-center p-4"><Upload className="text-gray-400 mx-auto mb-2" size={20} /><p className="text-sm font-medium text-gray-600">Mặt sau</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div className="text-xs text-gray-500 italic">
                        *Tài khoản sẽ được tạo với mật khẩu mặc định.
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9">Huỷ</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-gray-800 h-9 min-w-[120px]">
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                        </Button>
                    </div>
                </div>

            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}