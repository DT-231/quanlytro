import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2 } from "lucide-react"; 
import { contractService } from "@/services/contractService"; 
import { toast } from "sonner"; 

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schema validation
const formSchema = z.object({
  tenantId: z.string().min(1, "Vui lòng chọn khách hàng"),
  buildingId: z.string().min(1, "Vui lòng chọn tòa nhà"), // BẮT BUỘC
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
  // --- STATE MỚI ---
  const [buildings, setBuildings] = useState([]); // State chứa danh sách tòa nhà
  const [rooms, setRooms] = useState([]);         // State chứa phòng (phụ thuộc tòa nhà)
  const [tenants, setTenants] = useState([]);  
  
  const [loadingData, setLoadingData] = useState(false); 
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [services, setServices] = useState([
    { id: 1, name: "Phí rác", price: 0 },
    { id: 2, name: "Phí giữ xe", price: 0 },
  ]);
  const [newServiceName, setNewServiceName] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: "", buildingId: "", roomId: "", contractCode: "",
      startDate: new Date().toISOString().split('T')[0], 
      endDate: "", rentPrice: 0, deposit: 0,
      paymentDate: 15, paymentCycle: "1", 
      electricityPrice: 3500, waterPrice: 15000,
      status: "ACTIVE", terms: "Bên thuê có trách nhiệm bảo quản tài sản...",
    },
  });

  // Helper trích xuất mảng dữ liệu an toàn
  const extractList = (response) => {
      if (!response) return [];
      if (Array.isArray(response)) return response;
      if (response.data && Array.isArray(response.data)) return response.data;
      if (response.items && Array.isArray(response.items)) return response.items;
      return [];
  };

  // --- 1. LOAD DATA KHI MỞ MODAL ---
  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setLoadingData(true);
        try {
          // Gọi API Tòa nhà & Khách thuê
          const [resBuildings, resTenants] = await Promise.all([
            contractService.getBuildingsDropdown(),
            contractService.getTenants()
          ]);

          setBuildings(extractList(resBuildings));
          setTenants(extractList(resTenants));
          
          form.setValue("contractCode", "HD" + Math.floor(Math.random() * 10000));
          setRooms([]); // Reset phòng

        } catch (error) {
          console.error("Lỗi tải dữ liệu:", error);
          toast.error("Không thể tải danh sách tòa nhà/khách hàng.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchResources();
    } else {
        form.reset();
    }
  }, [isOpen, form]);

  // --- 2. XỬ LÝ KHI CHỌN TÒA NHÀ ---
  const handleBuildingChange = async (e) => {
      const selectedBuildingId = e.target.value;
      form.setValue("buildingId", selectedBuildingId);
      
      // Reset phòng & giá
      form.setValue("roomId", "");
      form.setValue("rentPrice", 0);
      setRooms([]);

      if (!selectedBuildingId) return;

      setLoadingRooms(true);
      try {
          // Gọi API lấy phòng theo tòa nhà
          const res = await contractService.getRoomsByBuilding(selectedBuildingId);
          const list = extractList(res);
          setRooms(list);
          
          if(list.length === 0) toast.info("Tòa nhà này chưa có phòng nào trong hệ thống hóa đơn.");
      } catch (error) {
          console.error("Lỗi tải phòng:", error);
      } finally {
          setLoadingRooms(false);
      }
  };

  // --- 3. XỬ LÝ KHI CHỌN PHÒNG ---
  const handleRoomChange = (e) => {
    const selectedRoomId = e.target.value;
    form.setValue("roomId", selectedRoomId);
    
    const room = rooms.find(r => r.id === selectedRoomId);
    if (room) {
        // Ưu tiên lấy giá thuê
        const price = room.rental_price || room.price || room.base_price || 0;
        form.setValue("rentPrice", price);
    }
  };

  // --- Các hàm phụ trợ khác (Giữ nguyên) ---
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

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
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

      const res = await contractService.create(apiPayload);

      if (res && (res.code === 200 || res.code === 201 || res.message === "success" || res.success)) {
        toast.success(`Tạo hợp đồng thành công!`);
        if (onAddSuccess) onAddSuccess(res.data || res);
        onClose();
      } else {
        toast.error("Lỗi: " + (res?.message || "Không thể tạo hợp đồng"));
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Lỗi kết nối server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Thêm hợp đồng mới
              {loadingData && <Loader2 className="animate-spin h-5 w-5 text-gray-400"/>}
            </DialogTitle>
            <DialogDescription>Nhập thông tin để tạo hợp đồng thuê phòng.</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* --- HÀNG 1: Mã HĐ & Khách --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none">
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
              </div>

              {/* --- HÀNG 2: TÒA NHÀ & PHÒNG (UI MỚI) --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-3 rounded border border-blue-100">
                
                {/* 1. Select Tòa Nhà */}
                <FormField control={form.control} name="buildingId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-800">1. Chọn Tòa nhà</FormLabel>
                      <FormControl>
                        <select 
                            {...field} 
                            onChange={handleBuildingChange} 
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">-- Chọn tòa nhà --</option>
                          {buildings.map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.building_name}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                {/* 2. Select Phòng (Disable nếu chưa chọn tòa) */}
                <FormField control={form.control} name="roomId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-800 flex justify-between">
                        2. Chọn Phòng
                        {loadingRooms && <Loader2 className="h-4 w-4 animate-spin text-blue-600"/>}
                      </FormLabel>
                      <FormControl>
                        <select 
                            {...field} 
                            onChange={handleRoomChange}
                            disabled={!form.getValues("buildingId") || loadingRooms}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                               Phòng {r.room_number || r.name} {r.tenant_name ? `(${r.tenant_name})` : ""}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              </div>

              {/* ... (Các phần Ngày tháng, Tài chính, Dịch vụ giữ nguyên code cũ của bạn) ... */}
              
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
                <div className="col-span-1 md:col-span-2 flex gap-2 justify-end">
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(3)}>3 Tháng</Button>
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(6)}>6 Tháng</Button>
                   <Button type="button" variant="outline" size="sm" onClick={() => handleDurationClick(12)}>1 Năm</Button>
                </div>
              </div>

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

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="paymentDate" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ngày đóng tiền</FormLabel>
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
            
              <div className="bg-gray-50 p-3 rounded border">
                <FormLabel className="mb-2 block font-semibold">Dịch vụ đi kèm</FormLabel>
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
                        placeholder="Thêm dịch vụ..." 
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
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-gray-900 hover:bg-gray-800 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                {isSubmitting ? "Đang tạo..." : "Tạo hợp đồng"}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}