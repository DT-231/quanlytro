import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { contractService } from "@/services/contractService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";

// --- 1. SCHEMA VALIDATION ---
// Các trường là optional, nhưng nếu nhập thì phải đúng định dạng số/ngày
const editSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  rental_price: z.coerce.number().min(0, "Giá thuê không hợp lệ"),
  deposit_amount: z.coerce.number().min(0, "Tiền cọc không hợp lệ"),
  payment_day: z.coerce.number().min(1).max(31, "Ngày đóng tiền từ 1-31"),
  number_of_tenants: z.coerce.number().min(1, "Ít nhất 1 người ở"),
  status: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  notes: z.string().optional(),
  payment_cycle_months: z.coerce.number().min(1),
  electricity_price: z.coerce.number().min(0),
  water_price: z.coerce.number().min(0),
});

export default function EditContractModal({
  isOpen,
  onClose,
  onUpdateSuccess,
  contractData, // Dữ liệu hợp đồng cần sửa (truyền từ cha)
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 2. INIT FORM ---
  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      rental_price: 0,
      deposit_amount: 0,
      payment_day: 15,
      number_of_tenants: 1,
      status: "ACTIVE",
      terms_and_conditions: "",
      notes: "",
      payment_cycle_months: 1,
      electricity_price: 0,
      water_price: 0,
    },
  });

  // --- 3. LOAD DATA KHI MỞ MODAL ---
  useEffect(() => {
    if (isOpen && contractData) {
      // Reset form với dữ liệu hiện tại của hợp đồng
      form.reset({
        start_date: contractData.start_date ? contractData.start_date.split("T")[0] : "",
        end_date: contractData.end_date ? contractData.end_date.split("T")[0] : "",
        rental_price: contractData.rental_price,
        deposit_amount: contractData.deposit_amount,
        payment_day: contractData.payment_day,
        number_of_tenants: contractData.number_of_tenants,
        status: contractData.status,
        terms_and_conditions: contractData.terms_and_conditions || "",
        notes: contractData.notes || "",
        payment_cycle_months: contractData.payment_cycle_months,
        electricity_price: contractData.electricity_price,
        water_price: contractData.water_price,
      });
    }
  }, [isOpen, contractData, form]);

  // --- 4. SUBMIT HANDLER ---
  const onSubmit = async (values) => {
    if (!contractData?.id) return;
    setIsSubmitting(true);

    try {
      console.log("Updating Contract:", values);
      
      // Gọi API Update
      const res = await contractService.update(contractData.id, values);

      if (res && (res.code === 200 || res.success)) {
        toast.success("Cập nhật hợp đồng thành công!");
        if (onUpdateSuccess) onUpdateSuccess(); // Refresh list ở cha
        onClose();
      } else {
        toast.error("Cập nhật thất bại: " + (res?.message || "Lỗi server"));
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Lỗi kết nối server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">
            Chỉnh sửa hợp đồng: {contractData?.contract_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* --- GROUP 1: THỜI GIAN --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                <FormField control={form.control} name="start_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="end_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* --- GROUP 2: TÀI CHÍNH --- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="rental_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá thuê</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="deposit_amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiền cọc</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="electricity_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá điện</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="water_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá nước</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* --- GROUP 3: CẤU HÌNH --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="payment_day" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày đóng tiền</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="payment_cycle_months" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chu kỳ (tháng)</FormLabel>
                    <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="1">1 Tháng</option>
                            <option value="3">3 Tháng</option>
                            <option value="6">6 Tháng</option>
                            <option value="12">12 Tháng</option>
                        </select>
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="number_of_tenants" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người ở</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* --- GROUP 4: TRẠNG THÁI (QUAN TRỌNG) --- */}
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Trạng thái hợp đồng</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border px-2 py-2 text-sm font-medium">
                      <option value="ACTIVE">Đang hoạt động </option>
                      <option value="EXPIRED">Đã hết hạn </option>
                      <option value="TERMINATED">Đã kết thúc </option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* --- GROUP 5: THÔNG TIN KHÁC --- */}
              <FormField control={form.control} name="terms_and_conditions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Điều khoản</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" placeholder="Điều khoản bổ sung..." />
                  </FormControl>
                </FormItem>
              )} />
               <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú nội bộ</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[60px]" placeholder="Ghi chú riêng cho quản lý..." />
                  </FormControl>
                </FormItem>
              )} />

            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 min-w-[100px]">
            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}