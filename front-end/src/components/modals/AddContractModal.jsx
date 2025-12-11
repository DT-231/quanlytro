import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, CalendarIcon } from "lucide-react"; // Icons

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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  // Thông tin chung
  contractCode: z.string().min(1, "Mã hợp đồng là bắt buộc"),
  contractDate: z.string().min(1, "Ngày lập hợp đồng là bắt buộc"),

  // Thông tin bên cho thuê
  landlordName: z.string().min(1, "Tên bên cho thuê là bắt buộc"),
  landlordId: z.string().min(1, "CMND/CCCD bên cho thuê là bắt buộc"),
  landlordPhone: z.string().min(1, "Số điện thoại bên cho thuê là bắt buộc"),
  landlordAddress: z.string().optional(),

  // Thông tin bên thuê
  tenantName: z.string().min(1, "Tên bên thuê là bắt buộc"),
  tenantId: z.string().min(1, "CMND/CCCD bên thuê là bắt buộc"),
  tenantPhone: z.string().min(1, "Số điện thoại bên thuê là bắt buộc"),
  tenantAddress: z.string().optional(),

  // Thông tin phòng
  buildingName: z.string().min(1, "Tên tòa nhà là bắt buộc"),
  roomName: z.string().min(1, "Số phòng là bắt buộc"),
  roomAddress: z.string().optional(),

  // Điều khoản thuê
  startDate: z.string().min(1, "Chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Chọn ngày kết thúc"),
  rentPrice: z.coerce.number().min(0, "Giá thuê phải >= 0"),
  deposit: z.coerce.number().min(0, "Tiền cọc phải >= 0"),
  depositReturnTerms: z.string().optional(),

  // Thanh toán
  paymentDate: z.coerce.number().min(1).max(31, "Ngày thanh toán phải từ 1-31"),
  paymentCycle: z.string().min(1, "Chọn chu kỳ thanh toán"),

  // Tiện ích
  electricityPrice: z.coerce.number().min(0, "Giá điện phải >= 0"),
  waterPrice: z.coerce.number().min(0, "Giá nước phải >= 0"),

  // Điều khoản
  houseRules: z.string().optional(),
  additionalTerms: z.string().optional(),

  // Trạng thái
  status: z.string().min(1, "Chọn trạng thái"),
});

export default function AddContractModal({ isOpen, onClose, onAddSuccess }) {
  // --- STATE QUẢN LÝ DỊCH VỤ (Dynamic List) ---
  const [services, setServices] = useState([
    { id: 1, name: "Phí rác", price: 0 },
    { id: 2, name: "Phí giữ xe", price: 0 },
  ]);
  const [newServiceName, setNewServiceName] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractCode: "",
      contractDate: new Date().toISOString().split("T")[0],
      landlordName: "",
      landlordId: "",
      landlordPhone: "",
      landlordAddress: "",
      tenantName: "",
      tenantId: "",
      tenantPhone: "",
      tenantAddress: "",
      buildingName: "",
      roomName: "",
      roomAddress: "",
      startDate: "",
      endDate: "",
      rentPrice: 0,
      deposit: 0,
      depositReturnTerms:
        "Hoàn lại toàn bộ tiền cọc sau khi kết thúc hợp đồng (trừ các khoản phạt)",
      paymentDate: 15,
      paymentCycle: "Tháng",
      electricityPrice: 0,
      waterPrice: 0,
      houseRules: `ĐIỀU KHOẢN VỀ QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ:
- Bên thuê có quyền sử dụng phòng và toàn bộ tài sản đi kèm đúng mục đích đã thỏa thuận.
- Bên thuê phải trả tiền thuê phòng và các chi phí dịch vụ đầy đủ, đúng hạn.
- Bên thuê có trách nhiệm bảo quản tài sản, không được tự ý sửa chữa, thay đổi.
- Bên thuê phải tuân thủ nội quy của tòa nhà, không gây ồn ào hay ảnh hưởng tới người hàng xóm.
- Bên thuê không được phép tự ý cho người khác ở chung mà không thông báo với bên cho thuê.`,
      additionalTerms: "",
      status: "Hoạt động",
    },
  });

  // --- HÀM XỬ LÝ LOGIC ---

  // Xử lý nút chọn nhanh thời hạn (3 tháng, 6 tháng...)
  const handleDurationClick = (months) => {
    const start = form.getValues("startDate");
    if (!start) return; // Phải chọn ngày bắt đầu trước

    const date = new Date(start);
    date.setMonth(date.getMonth() + months);
    // Format lại thành YYYY-MM-DD để gán vào input date
    const dateString = date.toISOString().split("T")[0];
    form.setValue("endDate", dateString);
  };

  // Thêm dịch vụ mới
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      { id: Date.now(), name: newServiceName, price: 0 },
    ]);
    setNewServiceName("");
  };

  // Xóa dịch vụ
  const handleRemoveService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const onSubmit = (values) => {
    const finalData = { ...values, services }; // Gộp form data và list dịch vụ
    console.log("Dữ liệu hợp đồng:", finalData);

    if (onAddSuccess) onAddSuccess(finalData);
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* sm:max-w-[800px] để form rộng hơn phù hợp chia 3 cột */}
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-black flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Thêm Hợp Đồng Cho Thuê Phòng
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* FORM CONTENT - Có scroll nếu dài */}
        <div className="p-6 pt-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ===== PHẦN 1: THÔNG TIN CHUNG ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4">THÔNG TIN CHUNG</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="contractCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Mã hợp đồng *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HD001"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Ngày lập hợp đồng *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 2: THÔNG TIN BÊN CHO THUÊ ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-blue-50 p-2 rounded">
                  BÊN CHO THUÊ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="landlordName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Họ tên *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nguyễn Văn A"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landlordId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          CMND/CCCD *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0123456789"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landlordPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Số điện thoại *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0912345678"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landlordAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Địa chỉ
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Địa chỉ thường trú"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 3: THÔNG TIN BÊN THUÊ ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-green-50 p-2 rounded">
                  BÊN THUÊ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Họ tên *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Trần Văn B"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          CMND/CCCD *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Số điện thoại *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0987654321"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Địa chỉ thường trú
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Địa chỉ thường trú"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 4: THÔNG TIN PHÒNG ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-yellow-50 p-2 rounded">
                  THÔNG TIN PHÒNG CHO THUÊ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buildingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tòa nhà *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VinHome Quận 7"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roomName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Số phòng *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="101" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roomAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs font-semibold">
                          Địa chỉ cụ thể
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Số nhà, tên đường..."
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 5: ĐIỀU KHOẢN THUÊ ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-purple-50 p-2 rounded">
                  ĐIỀU KHOẢN THUÊ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Ngày bắt đầu *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Ngày kết thúc *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Nút chọn nhanh thời hạn */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(3)}
                    className="h-8 text-xs"
                  >
                    3 Tháng
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(6)}
                    className="h-8 text-xs"
                  >
                    6 Tháng
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(12)}
                    className="h-8 text-xs"
                  >
                    1 Năm
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="rentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Giá thuê (VNĐ/tháng) *
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tiền cọc (VNĐ) *
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="depositReturnTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Điều khoản hoàn cọc
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Hoàn lại sau khi kết thúc"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 6: THANH TOÁN ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-orange-50 p-2 rounded">
                  ĐIỀU KHOẢN THANH TOÁN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Ngày thanh toán *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15"
                            min="1"
                            max="31"
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Chu kỳ thanh toán *
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="Tháng">Tháng</option>
                            <option value="Quý">Quý</option>
                            <option value="Năm">Năm</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 7: TIỆN ÍCH ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-indigo-50 p-2 rounded">
                  GIÁ TIỆN ÍCH
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="electricityPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Giá điện (VNĐ/kWh) *
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="waterPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Giá nước (VNĐ/m³) *
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===== PHẦN 8: NỘI QUY ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4 bg-red-50 p-2 rounded">
                  NỘI QUY & ĐIỀU KHOẢN
                </h3>
                <FormField
                  control={form.control}
                  name="houseRules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Nội quy nhà *
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ===== PHẦN 9: ĐIỀU KHOẢN BỔ SUNG ===== */}
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm mb-4">ĐIỀU KHOẢN BỔ SUNG</h3>
                <FormField
                  control={form.control}
                  name="additionalTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Các điều khoản, quy định thêm (nếu có)..."
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ===== PHẦN 10: TRẠNG THÁI ===== */}
              <div>
                <h3 className="font-bold text-sm mb-4">TRẠNG THÁI HỢP ĐỒNG</h3>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Hoạt động">Hoạt động</option>
                          <option value="Chờ duyệt">Chờ duyệt</option>
                          <option value="Đã thanh lý">Đã thanh lý</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* FOOTER BUTTONS - Fixed at bottom */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 bg-white"
          >
            Huỷ
          </Button>
          {/* Submit button kích hoạt form phía trên thông qua form handle */}
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="bg-black text-white hover:bg-gray-800 h-9"
          >
            Thêm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
