import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, Zap, Droplets, Wrench, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invoiceService } from "@/services/invoiceService";

// --- QUAN TRỌNG: Import đầy đủ Dialog ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Schema Validation
const invoiceSchema = z.object({
  customerName: z.string().optional(),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  buildingId: z.string().min(1, "Vui lòng chọn tòa nhà"),
  status: z.string(),
  invoiceDate: z.string(),
  totalAmount: z.coerce.number(),
  elecOld: z.coerce.number().min(0),
  elecNew: z.coerce.number().min(0),
  elecUsed: z.coerce.number(),
  waterOld: z.coerce.number().min(0),
  waterNew: z.coerce.number().min(0),
  waterUsed: z.coerce.number(),
  services: z.array(
    z.object({
      name: z.string().min(1, "Tên dịch vụ"),
      price: z.coerce.number().min(0),
    })
  ),
});

export default function AddInvoiceModal({ isOpen, onClose, onAddSuccess }) {
  // State
  const [activeTab, setActiveTab] = useState("info");
  const [buildings, setBuildings] = useState([]); 
  const [rooms, setRooms] = useState([]);         
  const [currentRates, setCurrentRates] = useState({ elec: 0, water: 0 });
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      roomId: "",
      buildingId: "",
      status: "PENDING",
      invoiceDate: new Date().toISOString().split("T")[0],
      totalAmount: 0,
      elecOld: 0, elecNew: 0, elecUsed: 0,
      waterOld: 0, waterNew: 0, waterUsed: 0,
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

  // Watchers để tính toán tự động
  const [elecOld, elecNew, waterOld, waterNew, services] = form.watch([
    "elecOld", "elecNew", "waterOld", "waterNew", "services",
  ]);

  // --- 1. LOAD DATA BAN ĐẦU ---
  useEffect(() => {
    if (isOpen) {
      const fetchBuildings = async () => {
        // Service giờ đã trả về Mảng chuẩn, không cần check .data nữa
        const list = await invoiceService.getBuildingsDropdown();
        setBuildings(list);
      };
      fetchBuildings();
    } else {
        form.reset();
        setRooms([]);
        setActiveTab("info");
    }
  }, [isOpen, form]);

  // --- 2. XỬ LÝ CHỌN TÒA NHÀ (FIXED) ---
  const handleBuildingChange = async (buildingId) => {
      // Cập nhật form
      form.setValue("buildingId", buildingId);
      form.setValue("roomId", "");
      form.setValue("customerName", "");
      setRooms([]); // Reset danh sách phòng cũ

      if (!buildingId) return;

      setLoadingRooms(true);
      try {
          // Gọi service (Service đã xử lý logic array/data)
          const list = await invoiceService.getRoomsByBuilding(buildingId);
          
          console.log("Danh sách phòng nhận được:", list); // Debug
          setRooms(list);
          
          if(list.length === 0) {
              toast.info("Tòa nhà này chưa có phòng nào.");
          }
      } catch (error) {
          toast.error("Lỗi khi tải phòng.");
      } finally {
          setLoadingRooms(false);
      }
  };

  // --- 3. XỬ LÝ CHỌN PHÒNG ---
  const handleRoomChange = (roomId) => {
      form.setValue("roomId", roomId);
      // Tìm phòng trong state rooms (Lưu ý: convert id sang string để so sánh an toàn)
      const room = rooms.find(r => String(r.id) === String(roomId));
      
      if (room) {
          console.log("Phòng được chọn:", room);
          // Điền tên khách (kiểm tra các trường có thể có từ API)
          form.setValue("customerName", room.tenant_name || room.customer_name || "Chưa có người thuê");
          
          // Điền đơn giá (fallback giá mặc định nếu API không trả về)
          const eRate = Number(room.electricity_price) || 3500;
          const wRate = Number(room.water_price) || 15000;
          setCurrentRates({ elec: eRate, water: wRate });

          // Điền chỉ số cũ (nếu có)
          if (room.last_electricity_index !== undefined && room.last_electricity_index !== null) {
             form.setValue("elecOld", Number(room.last_electricity_index));
          }
          if (room.last_water_index !== undefined && room.last_water_index !== null) {
             form.setValue("waterOld", Number(room.last_water_index));
          }
      }
  };

  // --- TÍNH TOÁN TỔNG TIỀN ---
  useEffect(() => {
    const eUsed = Math.max(0, elecNew - elecOld);
    const wUsed = Math.max(0, waterNew - waterOld);
    form.setValue("elecUsed", eUsed);
    form.setValue("waterUsed", wUsed);

    const totalElec = eUsed * currentRates.elec;
    const totalWater = wUsed * currentRates.water;
    const totalService = services.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    form.setValue("totalAmount", totalElec + totalWater + totalService);
  }, [elecOld, elecNew, waterOld, waterNew, services, currentRates, form]);

  // --- SUBMIT ---
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
        const apiPayload = {
            room_id: values.roomId,
            invoice_date: values.invoiceDate,
            status: values.status,
            electricity_index_old: values.elecOld,
            electricity_index_new: values.elecNew,
            water_index_old: values.waterOld,
            water_index_new: values.waterNew,
            total_amount: values.totalAmount,
            services: values.services.map(s => ({
                service_name: s.name,
                price: s.price
            }))
        };

        const res = await invoiceService.create(apiPayload);
        
        if (res) { // Kiểm tra đơn giản, nếu có response là OK
            toast.success("Tạo hóa đơn thành công!");
            if (onAddSuccess) onAddSuccess(res);
            onClose();
        }
    } catch (error) {
        console.error("Submit Error:", error);
        toast.error("Lỗi: " + (error?.response?.data?.message || "Không thể tạo hóa đơn"));
    } finally {
        setIsSubmitting(false);
    }
  };

  // Tab Button Component
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md
        ${activeTab === id ? "bg-white text-black shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-black flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">Tạo hóa đơn mới</DialogTitle>
          <DialogDescription>Chọn tòa nhà và phòng để nhập chỉ số.</DialogDescription>
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
              
              {/* TAB 1: INFO */}
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="buildingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tòa nhà</FormLabel>
                        <Select onValueChange={(val) => handleBuildingChange(val)} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="-- Chọn tòa --" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>{b.building_name || b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                            Phòng {loadingRooms && <Loader2 className="h-3 w-3 animate-spin"/>}
                        </FormLabel>
                        <Select onValueChange={handleRoomChange} value={field.value} disabled={!form.getValues("buildingId")}>
                          <FormControl><SelectTrigger><SelectValue placeholder={loadingRooms ? "Đang tải..." : "-- Chọn phòng --"} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {rooms.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>{r.room_number || r.name}</SelectItem>
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
                          <Input {...field} readOnly className="bg-gray-100 focus-visible:ring-0" placeholder="Tên khách..." />
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
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                          <FormControl><Input type="number" {...field} readOnly className="bg-gray-50 font-bold pr-10" /></FormControl>
                          <span className="absolute right-3 top-2.5 text-sm text-gray-500">VNĐ</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* TAB 2: ELECTRIC */}
              {activeTab === "electric" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 p-3 text-sm text-blue-800 rounded border border-blue-100 flex justify-between">
                    <span>Đơn giá điện:</span>
                    <span className="font-bold">{new Intl.NumberFormat("vi-VN").format(currentRates.elec)} đ/kWh</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="elecOld" render={({ field }) => (<FormItem><FormLabel>Chỉ số cũ</FormLabel><Input type="number" {...field} /></FormItem>)} />
                    <FormField control={form.control} name="elecNew" render={({ field }) => (<FormItem><FormLabel>Chỉ số mới</FormLabel><Input type="number" {...field} /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="elecUsed" render={({ field }) => (<FormItem><FormLabel>Tiêu thụ</FormLabel><Input {...field} readOnly className="bg-gray-100" /></FormItem>)} />
                </div>
              )}

              {/* TAB 3: WATER */}
              {activeTab === "water" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 p-3 text-sm text-blue-800 rounded border border-blue-100 flex justify-between">
                    <span>Đơn giá nước:</span>
                    <span className="font-bold">{new Intl.NumberFormat("vi-VN").format(currentRates.water)} đ/m³</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="waterOld" render={({ field }) => (<FormItem><FormLabel>Chỉ số cũ</FormLabel><Input type="number" {...field} /></FormItem>)} />
                    <FormField control={form.control} name="waterNew" render={({ field }) => (<FormItem><FormLabel>Chỉ số mới</FormLabel><Input type="number" {...field} /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="waterUsed" render={({ field }) => (<FormItem><FormLabel>Tiêu thụ</FormLabel><Input {...field} readOnly className="bg-gray-100" /></FormItem>)} />
                </div>
              )}

              {/* TAB 4: SERVICE */}
              {activeTab === "service" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                        <FormField control={form.control} name={`services.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><Input {...field} /></FormItem>)} />
                        <FormField control={form.control} name={`services.${index}.price`} render={({ field }) => (<FormItem className="w-1/3"><Input type="number" {...field} /></FormItem>)} />
                        <button type="button" onClick={() => remove(index)} className="mb-2 p-2 text-gray-400 hover:text-red-500"><X size={18} /></button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => append({ name: "", price: 0 })} className="w-full border-dashed">+ Thêm dịch vụ</Button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white hover:bg-gray-800 min-w-[120px]">
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