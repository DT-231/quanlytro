import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, Zap, Droplets, Wrench, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invoiceService } from "@/services/invoiceService"; // Import Service

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- VALIDATION SCHEMA ---
const invoiceSchema = z.object({
  customerName: z.string().optional(), // Chỉ để hiển thị
  roomId: z.string().min(1, "Phòng là bắt buộc"),
  buildingId: z.string().min(1, "Tòa nhà là bắt buộc"),
  status: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  totalAmount: z.coerce.number(),
  // Các chỉ số
  elecOld: z.coerce.number().min(0),
  elecNew: z.coerce.number().min(0),
  elecUsed: z.coerce.number(),
  waterOld: z.coerce.number().min(0),
  waterNew: z.coerce.number().min(0),
  waterUsed: z.coerce.number(),
  // Dịch vụ
  services: z.array(
    z.object({
      name: z.string().min(1, "Tên dịch vụ"),
      price: z.coerce.number().min(0),
    })
  ),
});

export default function AddInvoiceModal({ isOpen, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState("info");
  const [buildings, setBuildings] = useState([]); // State danh sách tòa nhà
  const [rooms, setRooms] = useState([]);         // State danh sách phòng (phụ thuộc tòa)
  const [currentRates, setCurrentRates] = useState({ elec: 0, water: 0 }); // Đơn giá
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      roomId: "",
      buildingId: "",
      status: "PENDING", // Map với API: PENDING, PAID, OVERDUE
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      totalAmount: 0,
      elecOld: 0,
      elecNew: 0,
      elecUsed: 0,
      waterOld: 0,
      waterNew: 0,
      waterUsed: 0,
      services: [
        { name: "Tiền rác", price: 30000 },
        { name: "Tiền wifi", price: 100000 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  // Watch values để tính toán
  const [elecOld, elecNew, waterOld, waterNew, services] = form.watch([
    "elecOld", "elecNew", "waterOld", "waterNew", "services",
  ]);

  // --- 1. LOAD TÒA NHÀ KHI MỞ MODAL ---
  useEffect(() => {
    if (isOpen) {
      const fetchBuildings = async () => {
        try {
          const res = await invoiceService.getBuildingsDropdown();
          if (res?.data) {
             // Xử lý tùy theo cấu trúc trả về (mảng trực tiếp hoặc bọc trong data)
             setBuildings(Array.isArray(res.data) ? res.data : res.data.items || []);
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách tòa nhà:", error);
          toast.error("Không thể tải danh sách tòa nhà.");
        }
      };
      fetchBuildings();
    } else {
        // Reset form khi đóng
        form.reset();
        setRooms([]);
        setCurrentRates({ elec: 0, water: 0 });
    }
  }, [isOpen, form]);

  // --- 2. XỬ LÝ CHỌN TÒA NHÀ -> LOAD PHÒNG ---
  const handleBuildingChange = async (buildingId) => {
      form.setValue("buildingId", buildingId);
      form.setValue("roomId", "");
      form.setValue("customerName", "");
      setRooms([]);
      setCurrentRates({ elec: 0, water: 0 });

      if (!buildingId) return;

      setLoadingRooms(true);
      try {
          const res = await invoiceService.getRoomsByBuilding(buildingId);
          if (res?.data) {
             const roomList = Array.isArray(res.data) ? res.data : res.data.items || [];
             setRooms(roomList);
             if(roomList.length === 0) toast.info("Tòa nhà này chưa có phòng.");
          }
      } catch (error) {
          console.error(error);
          toast.error("Lỗi tải danh sách phòng.");
      } finally {
          setLoadingRooms(false);
      }
  };

  // --- 3. XỬ LÝ CHỌN PHÒNG -> FILL DỮ LIỆU ---
  const handleRoomChange = (roomId) => {
      form.setValue("roomId", roomId);
      const room = rooms.find(r => String(r.id) === roomId);
      
      if (room) {
          // Fill tên khách
          form.setValue("customerName", room.tenant_name || "Chưa có người thuê");
          
          // Fill đơn giá (nếu API room trả về)
          // Giả sử API trả về electricity_price và water_price trong object room
          const eRate = Number(room.electricity_price) || 3500; // Fallback 3500
          const wRate = Number(room.water_price) || 15000;      // Fallback 15000
          
          setCurrentRates({ elec: eRate, water: wRate });

          // Fill chỉ số cũ (nếu API có trả về chỉ số cuối kỳ trước)
          if (room.last_electricity_index !== undefined) form.setValue("elecOld", room.last_electricity_index);
          if (room.last_water_index !== undefined) form.setValue("waterOld", room.last_water_index);
      }
  };

  // --- 4. TÍNH TOÁN TỔNG TIỀN (AUTO) ---
  useEffect(() => {
    const eUsed = Math.max(0, elecNew - elecOld);
    const wUsed = Math.max(0, waterNew - waterOld);

    form.setValue("elecUsed", eUsed);
    form.setValue("waterUsed", wUsed);

    const totalElec = eUsed * currentRates.elec;
    const totalWater = wUsed * currentRates.water;
    const totalService = services.reduce(
      (acc, curr) => acc + (Number(curr.price) || 0),
      0
    );

    form.setValue("totalAmount", totalElec + totalWater + totalService);
  }, [elecOld, elecNew, waterOld, waterNew, services, currentRates, form]);

  // --- 5. SUBMIT FORM ---
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
        // Map dữ liệu UI sang format API yêu cầu (Snake_case thường dùng ở Backend)
        const apiPayload = {
            room_id: values.roomId,
            invoice_date: values.invoiceDate, // YYYY-MM-DD
            // due_date: values.dueDate,
            status: values.status, // PENDING / PAID
            
            // Chỉ số
            electricity_index_old: values.elecOld,
            electricity_index_new: values.elecNew,
            water_index_old: values.waterOld,
            water_index_new: values.waterNew,
            
            // Tổng tiền (Có thể backend tự tính, nhưng gửi lên cũng được)
            total_amount: values.totalAmount,
            
            // Dịch vụ (Array)
            services: values.services.map(s => ({
                service_name: s.name,
                price: s.price
            }))
        };

        const res = await invoiceService.create(apiPayload);
        
        if (res && (res.code === 200 || res.code === 201 || res.message === "success")) {
            toast.success("Tạo hóa đơn thành công!");
            if (onAddSuccess) onAddSuccess(res.data);
            onClose();
        } else {
            toast.error("Lỗi: " + (res?.message || "Không thể tạo hóa đơn"));
        }

    } catch (error) {
        console.error("Submit error:", error);
        toast.error("Có lỗi xảy ra khi gửi dữ liệu.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md
        ${
          activeTab === id
            ? "bg-white text-black shadow-sm border border-gray-200"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-black flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">
            Tạo hóa đơn mới
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Chọn tòa nhà và phòng để nhập chỉ số điện nước.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 bg-gray-50/50">
          <div className="flex bg-gray-100/80 p-1 rounded-lg">
            <TabButton id="info" label="Thông tin" icon={Info} />
            <TabButton id="electric" label="Điện" icon={Zap} />
            <TabButton id="water" label="Nước" icon={Droplets} />
            <TabButton id="service" label="Dịch vụ" icon={Wrench} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* TAB 1: THÔNG TIN CHUNG */}
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Select Tòa Nhà */}
                  <FormField
                    control={form.control}
                    name="buildingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tòa nhà</FormLabel>
                        <Select
                          onValueChange={(val) => handleBuildingChange(val)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-- Chọn tòa nhà --" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.building_name || b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Select Phòng (Cascading) */}
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                            Phòng
                            {loadingRooms && <Loader2 className="h-3 w-3 animate-spin"/>}
                        </FormLabel>
                        <Select
                          onValueChange={(val) => handleRoomChange(val)}
                          value={field.value}
                          disabled={!form.getValues("buildingId") || loadingRooms}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingRooms ? "Đang tải..." : "-- Chọn phòng --"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.room_number || r.name} {r.tenant_name ? `(${r.tenant_name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Khách hàng</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-100 text-gray-600 focus-visible:ring-0"
                            placeholder="Tên khách sẽ tự hiển thị khi chọn phòng..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày lập</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Chưa thanh toán</SelectItem>
                            <SelectItem value="PAID">Đã thanh toán</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Tổng tiền (Tạm tính)</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              readOnly
                              className="bg-gray-50 text-black pr-10 font-bold"
                            />
                          </FormControl>
                          <span className="absolute right-3 top-2.5 text-sm text-gray-500 pointer-events-none">
                            VNĐ
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* TAB 2: ĐIỆN */}
              {activeTab === "electric" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 p-3 text-sm text-blue-800 rounded border border-blue-100 flex justify-between">
                    <span>Đơn giá điện áp dụng:</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat("vi-VN").format(currentRates.elec)} đ/kWh
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="elecOld"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số cũ</FormLabel>
                          <Input type="number" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="elecNew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số mới</FormLabel>
                          <Input type="number" {...field} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="elecUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu thụ (Mới - Cũ)</FormLabel>
                        <div className="relative">
                          <Input {...field} readOnly className="bg-gray-100 font-medium" />
                          <span className="absolute right-3 top-2 text-sm text-gray-500">kWh</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* TAB 3: NƯỚC */}
              {activeTab === "water" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 p-3 text-sm text-blue-800 rounded border border-blue-100 flex justify-between">
                    <span>Đơn giá nước áp dụng:</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat("vi-VN").format(currentRates.water)} đ/m³
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="waterOld"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số cũ</FormLabel>
                          <Input type="number" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="waterNew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số mới</FormLabel>
                          <Input type="number" {...field} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="waterUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu thụ</FormLabel>
                        <div className="relative">
                          <Input {...field} readOnly className="bg-gray-100 font-medium" />
                          <span className="absolute right-3 top-2 text-sm text-gray-500">m³</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* TAB 4: DỊCH VỤ */}
              {activeTab === "service" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                        <FormField
                          control={form.control}
                          name={`services.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Tên dịch vụ</FormLabel>
                              <Input {...field} />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`services.${index}.price`}
                          render={({ field }) => (
                            <FormItem className="w-1/3">
                              <FormLabel className="text-xs">Giá tiền</FormLabel>
                              <Input type="number" {...field} />
                            </FormItem>
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mb-2 p-2 text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", price: 0 })}
                    className="w-full border-dashed"
                  >
                    + Thêm dịch vụ khác
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white hover:bg-gray-800 min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                  {isSubmitting ? "Đang lưu..." : "Lưu hóa đơn"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}