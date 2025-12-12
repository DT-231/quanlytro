import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2 } from "lucide-react"; 
import { contractService } from "@/services/contractService"; 
import { toast } from "sonner"; // Thêm toast nếu chưa có

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// --- 1. SCHEMA VALIDATION (GIỮ NGUYÊN) ---
const formSchema = z.object({
  tenantId: z.string().min(1, "Vui lòng chọn khách hàng"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  contractCode: z.string().min(1, "Mã hợp đồng là bắt buộc"),
  startDate: z.string().min(1, "Chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Chọn ngày kết thúc"),
  rentPrice: z.coerce.number().min(0, "Giá thuê không được âm"),
  deposit: z.coerce.number().min(0, "Tiền cọc không được âm"),
  paymentDate: z.coerce.number().min(1).max(31),
  paymentCycle: z.string(), 
  electricityPrice: z.coerce.number().min(0),
  waterPrice: z.coerce.number().min(0),
  status: z.string(),
  terms: z.string().optional(),
});

export default function AddContractModal({ isOpen, onClose, onAddSuccess }) {
  // --- STATE (GIỮ NGUYÊN) ---
  const [rooms, setRooms] = useState([]);      
  const [tenants, setTenants] = useState([]);  
  const [loadingData, setLoadingData] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [services, setServices] = useState([
    { id: 1, name: "Phí rác", price: 0 },
    { id: 2, name: "Phí giữ xe", price: 0 },
  ]);
  const [newServiceName, setNewServiceName] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: "", roomId: "", contractCode: "",
      startDate: new Date().toISOString().split('T')[0], 
      endDate: "", rentPrice: 0, deposit: 0,
      paymentDate: 15, paymentCycle: "1", 
      electricityPrice: 3500, waterPrice: 15000,
      status: "ACTIVE", terms: "Bên thuê có trách nhiệm bảo quản tài sản...",
    },
  });

  // --- 2. EFFECT: LOAD DATA (LOGIC MỚI: HỨNG -> KIỂM TRA -> TRUY XUẤT) ---
  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setLoadingData(true);
        try {
          // Gọi API song song
          const [resRooms, resTenants] = await Promise.all([
            contractService.getAvailableRooms(),
            contractService.getTenants()
          ]);

          // 1. Xử lý Rooms
          // Hứng (resRooms) -> Kiểm tra -> Truy xuất (data.items)
          if (resRooms && resRooms.data && Array.isArray(resRooms.data.items)) {
             setRooms(resRooms.data.items);
          } else {
             setRooms([]); 
          }

          // 2. Xử lý Tenants
          // Hứng (resTenants) -> Kiểm tra -> Truy xuất
          if (resTenants && resTenants.data && Array.isArray(resTenants.data.items)) {
             setTenants(resTenants.data.items);
          } else {
             setTenants([]);
          }
          
          // Generate mã giả
          form.setValue("contractCode", "HD" + Math.floor(Math.random() * 10000));

        } catch (error) {
          console.error("Lỗi tải dữ liệu nguồn:", error);
          toast.error("Không thể tải danh sách phòng/khách hàng.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchResources();
    }
  }, [isOpen, form]);

  // --- LOGIC FORM UI (GIỮ NGUYÊN) ---
  const handleRoomChange = (e) => {
    const selectedRoomId = e.target.value;
    form.setValue("roomId", selectedRoomId);
    
    // Tìm phòng trong state để lấy giá tiền gợi ý
    // Lưu ý: API room phải trả về field 'base_price' hoặc 'price'
    const room = rooms.find(r => r.id === selectedRoomId);
    if (room && (room.base_price || room.price)) {
      form.setValue("rentPrice", room.base_price || room.price);
    }
  };

  const handleDurationClick = (months) => {
    const start = form.getValues("startDate");
    if (!start) return;
    const date = new Date(start);
    date.setMonth(date.getMonth() + months);
    form.setValue("endDate", date.toISOString().split("T")[0]);
    form.setValue("paymentCycle", months.toString());
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServices([...services, { id: Date.now(), name: newServiceName, price: 0 }]);
    setNewServiceName("");
  };

  const handleRemoveService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };

  // --- 3. SUBMIT HANDLE (LOGIC MỚI: HỨNG -> KIỂM TRA -> TRUY XUẤT) ---
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // 1. Chuẩn bị Payload
      const apiPayload = {
        room_id: values.roomId,          
        tenant_id: values.tenantId,      
        contract_number: values.contractCode,
        start_date: values.startDate,
        end_date: values.endDate,
        rental_price: values.rentPrice,
        deposit_amount: values.deposit,
        payment_day: values.paymentDate,
        payment_cycle_months: parseInt(values.paymentCycle),
        electricity_price: values.electricityPrice,
        water_price: values.waterPrice,
        number_of_tenants: 1, 
        terms_and_conditions: values.terms,
        notes: "",
        service_fees: services.map(s => s.name), 
        status: values.status 
      };

      console.log("Submitting:", apiPayload);

      // 2. Gọi API & Hứng Response
      const res = await contractService.create(apiPayload);

      // 3. Kiểm tra thành công 
      // (Dựa vào code 200/201 hoặc message success từ backend trả về)
      if (res && (res.code === 200 || res.code === 201 || res.message === "success")) {
        
        // 4. Truy xuất & Thông báo
        const createdContract = res.data; // Dữ liệu hợp đồng mới tạo
        toast.success(`Tạo thành công hợp đồng ${createdContract?.contract_number || ""}!`);
        
        if (onAddSuccess) {
            onAddSuccess(createdContract); 
        }
        
        onClose();
        form.reset();
      } else {
        // Trường hợp API trả về nhưng báo lỗi logic
        toast.error("Tạo thất bại: " + (res?.message || "Lỗi không xác định"));
      }

    } catch (error) {
      console.error("Submit Error:", error);
      // Xử lý lỗi từ axios interceptor ném ra
      const msg = error.response?.data?.detail || "Có lỗi xảy ra khi kết nối server.";
      toast.error(typeof msg === 'string' ? msg : "Lỗi dữ liệu đầu vào.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- GIAO DIỆN (GIỮ NGUYÊN NHƯ CŨ) ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Thêm hợp đồng mới
              {loadingData && <Loader2 className="animate-spin h-5 w-5 text-gray-400"/>}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* --- HÀNG 1: Mã HĐ - Khách - Phòng --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="contractCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Mã hợp đồng</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField control={form.control} name="tenantId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Khách thuê</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="">-- Chọn khách --</option>
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name} ({t.phone})</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField control={form.control} name="roomId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Phòng (Trống)</FormLabel>
                      <FormControl>
                        <select {...field} onChange={handleRoomChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                               Phòng {r.room_number} {r.building_name ? `- ${r.building_name}` : ""}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              </div>

              {/* --- HÀNG 2: Ngày tháng --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày kết thúc</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <div className="col-span-1 md:col-span-2 flex gap-2">
                   <span className="text-xs text-gray-500 self-center">Chọn nhanh:</span>
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(3)}>3 Tháng</Button>
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(6)}>6 Tháng</Button>
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(12)}>1 Năm</Button>
                </div>
              </div>

              {/* --- HÀNG 3: Tài chính --- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="rentPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá thuê</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} 
                />
                 <FormField control={form.control} name="deposit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiền cọc</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} 
                />
                <FormField control={form.control} name="electricityPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá điện (/kWh)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} 
                />
                 <FormField control={form.control} name="waterPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá nước (/khối)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} 
                />
              </div>

               {/* --- HÀNG 4: Cấu hình thanh toán --- */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="paymentDate" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ngày đóng tiền hàng tháng</FormLabel>
                        <FormControl><Input type="number" placeholder="Ví dụ: 15" {...field} /></FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="paymentCycle" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Chu kỳ thanh toán</FormLabel>
                        <FormControl>
                             <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="1">1 Tháng/lần</option>
                                <option value="3">3 Tháng/lần</option>
                                <option value="6">6 Tháng/lần</option>
                             </select>
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <FormControl>
                             <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ">
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="PENDING">Chờ ký</option>
                             </select>
                        </FormControl>
                        </FormItem>
                    )}
                    />
               </div>
            
              {/* --- DỊCH VỤ --- */}
              <div className="bg-gray-50 p-3 rounded border">
                <FormLabel className="mb-2 block">Dịch vụ đi kèm</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                    {services.map((s) => (
                        <div key={s.id} className="bg-white border px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                            {s.name}
                            <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveService(s.id)}/>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Thêm dịch vụ (Wifi, Vệ sinh...)" 
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="bg-white"
                    />
                    <Button type="button" onClick={handleAddService} size="icon" className="shrink-0"><Plus size={16}/></Button>
                </div>
              </div>

              <FormField control={form.control} name="terms" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điều khoản đặc biệt</FormLabel>
                      <FormControl><textarea {...field} className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-black" /></FormControl>
                    </FormItem>
                  )}
                />

            </form>
          </Form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                {isSubmitting ? "Đang tạo..." : "Tạo hợp đồng"}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}