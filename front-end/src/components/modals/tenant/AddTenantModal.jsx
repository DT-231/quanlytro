import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Info, Image as ImageIcon } from "lucide-react"; // Icon


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  dob: z.string().optional(),
  cccd: z.string().min(11, "CCCD phải có ít nhất 11 số"),
  gender: z.string().optional(),
  hometown: z.string().optional(),
  job: z.string().optional(),
});

export default function AddTenantModal({ isOpen, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState("info");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      dob: "",
      cccd: "",
      gender: "",
      hometown: "",
      job: "",
    },
  });

  const onSubmit = (values) => {
    console.log("Dữ liệu khách thuê:", values);
    // Gọi API thêm khách thuê ở đây...
    
    // Giả lập thành công
    if (onAddSuccess) onAddSuccess(values);
    onClose();
    form.reset();
    setActiveTab("info");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white text-black">
        
        {/* HEADER */}
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Thêm khách thuê</DialogTitle>
            <DialogDescription>Nhập thông tin khách thuê mới</DialogDescription>
            </DialogHeader>
        </div>

        {/* TABS SWITCHER */}
        <div className="flex border-b px-6">
            <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 
                ${activeTab === "info" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
            >
                <Info size={16} /> Thông tin
            </button>
            <button
                onClick={() => setActiveTab("images")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 
                ${activeTab === "images" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
            >
                <ImageIcon size={16} /> Ảnh CCCD
            </button>
        </div>

        {/* FORM CONTENT */}
        <div className="p-6 pt-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* --- TAB 1: THÔNG TIN --- */}
                {activeTab === "info" && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Họ tên */}
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Họ tên</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* SĐT */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Số điện thoại</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Email</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                            </FormItem>
                            )}
                        />
                        {/* Ngày sinh */}
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Ngày sinh</FormLabel>
                                <FormControl><Input type="date" {...field} className="h-9 block w-full" /></FormControl>
                            </FormItem>
                            )}
                        />
                        {/* CCCD */}
                        <FormField
                            control={form.control}
                            name="cccd"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">CCCD</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* Giới tính */}
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Giới tính</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        {/* Quê quán */}
                        <FormField
                            control={form.control}
                            name="hometown"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Quê quán</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                            </FormItem>
                            )}
                        />
                        {/* Nghề nghiệp */}
                        <FormField
                            control={form.control}
                            name="job"
                            render={({ field }) => (
                            <FormItem className="col-span-1">
                                <FormLabel className="text-xs font-semibold">Nghề nghiệp</FormLabel>
                                <FormControl><Input placeholder="" {...field} className="h-9" /></FormControl>
                            </FormItem>
                            )}
                        />
                    </div>
                )}

                {/* --- TAB 2: ẢNH CCCD --- */}
                {activeTab === "images" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">Tối đa 2 ảnh (Mặt trước, mặt sau)</p>
                            <Button type="button" variant="outline" size="sm" className="gap-2 h-8">
                                <Upload size={14} /> Tải ảnh
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Khung ảnh mặt trước */}
                            <div className="border-2 border-dashed border-gray-200 rounded-lg h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <p className="text-sm font-medium">Ảnh CCCD(Mặt trước)</p>
                            </div>
                            {/* Khung ảnh mặt sau */}
                            <div className="border-2 border-dashed border-gray-200 rounded-lg h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <p className="text-sm font-medium">Ảnh CCCD(Mặt sau)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER BUTTONS */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} className="h-9">
                        Huỷ
                    </Button>
                    <Button type="submit" className="bg-black text-white hover:bg-gray-800 h-9">
                        Thêm
                    </Button>
                </div>

            </form>
            </Form>
        </div>

      </DialogContent>
    </Dialog>
  );
}