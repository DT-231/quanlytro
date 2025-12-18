import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

// Services
import { contractService } from "@/services/contractService";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";

// Utils
import { cn } from "@/lib/utils";

// UI Components
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Schema Validation
const formSchema = z.object({
  tenantId: z.string().min(1, "Vui lòng chọn khách hàng"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  contractCode: z.string().min(1, "Mã hợp đồng là bắt buộc"),
  startDate: z.string().min(1, "Chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Chọn ngày kết thúc"),
  rentPrice: z.coerce.number().min(0, "Giá thuê không được âm"),
  deposit: z.coerce.number().min(0, "Tiền cọc không được âm"),
  paymentDate: z.coerce.number().min(1).max(31, "Ngày không hợp lệ"),
  paymentCycle: z.string(),
  electricityPrice: z.coerce.number().min(0),
  waterPrice: z.coerce.number().min(0),
  status: z.string(),
  terms: z.string().optional(),
});

export default function AddContractModal({ isOpen, onClose, onAddSuccess }) {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE SERVICES (Chỉ cần ID và Name) ---
  const [services, setServices] = useState([
    { id: 1, name: "Phí rác" },
    { id: 2, name: "Phí giữ xe" },
  ]);
  const [newServiceName, setNewServiceName] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: "",
      roomId: "",
      contractCode: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      rentPrice: 0,
      deposit: 0,
      paymentDate: 15,
      paymentCycle: "1",
      electricityPrice: 3500,
      waterPrice: 15000,
      status: "ACTIVE",
      terms: "Bên thuê có trách nhiệm bảo quản tài sản và thanh toán đúng hạn.",
    },
  });

  const generateNextCode = (contracts) => {
    if (!contracts || contracts.length === 0) return "HD001";
    let maxNum = 0;
    contracts.forEach((contract) => {
      const code = contract.contract_number;
      if (code && code.startsWith("HD")) {
        const numPart = parseInt(code.replace("HD", ""), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    return `HD${String(maxNum + 1).padStart(3, "0")}`;
  };

  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setLoadingData(true);
        try {
          const [resRooms, resTenants, resContracts] = await Promise.all([
            roomService.getAll({ size: 100, status: "AVAILABLE" }),
            userService.getAll({ size: 100, role_code: "TENANT" }),
            contractService.getAll({ size: 100 }),
          ]);

          if (resRooms?.data?.items) setRooms(resRooms.data.items);
          else if (resRooms?.items) setRooms(resRooms.items);
          else setRooms([]);

          if (resTenants?.data?.items) setTenants(resTenants.data.items);
          else if (resTenants?.items) setTenants(resTenants.items);
          else setTenants([]);

          let currentContracts = [];
          if (resContracts?.data?.items) currentContracts = resContracts.data.items;
          else if (resContracts?.items) currentContracts = resContracts.items;

          const nextCode = generateNextCode(currentContracts);
          form.setValue("contractCode", nextCode);
        } catch (error) {
          console.error("Lỗi tải dữ liệu:", error);
          toast.error("Không thể tải danh sách phòng hoặc khách hàng.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchResources();
    }
  }, [isOpen, form]);

  const handleRoomSelect = (selectedRoomId) => {
    form.setValue("roomId", selectedRoomId);
    const room = rooms.find((r) => r.id === selectedRoomId);
    if (room) {
      const price = room.rental_price || room.price || room.base_price || 0;
      form.setValue("rentPrice", price);
      // Gợi ý tiền cọc bằng giá thuê
      form.setValue("deposit", price);
    }
  };

  const handleDurationClick = (months) => {
    const start = form.getValues("startDate");
    if (!start) return;
    const date = new Date(start);
    date.setMonth(date.getMonth() + months);
    date.setDate(date.getDate() - 1); // Trừ 1 ngày để tròn tháng
    form.setValue("endDate", date.toISOString().split("T")[0]);
    // Có thể set paymentCycle nếu muốn logic tự động
    // form.setValue("paymentCycle", months.toString());
  };

  // --- LOGIC DỊCH VỤ (Tags) ---
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      { id: Date.now(), name: newServiceName.trim() },
    ]);
    setNewServiceName("");
  };

  const handleRemoveService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };
  // -----------------------------

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {

      const serviceFeesPayload = services
        .filter((s) => s.name.trim() !== "")
        .map((s) => ({
          name: s.name,
          amount: 0, 
          description: "" 
        }));

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
        terms_and_conditions: values.terms || "",
        notes: "",
       service_fees: serviceFeesPayload,
        status: values.status,
      };
      console.log("Submitting Payload:", apiPayload);
      console.log("Submitting:", apiPayload);
      const res = await contractService.create(apiPayload);

      if (res && (res.success || res.data || res.id)) {
        const createdContract = res.data || res;
        toast.success(
          `Tạo thành công hợp đồng ${createdContract?.contract_number || values.contractCode}!`
        );
        if (onAddSuccess) onAddSuccess(createdContract);
        onClose();
        form.reset();
      } else {
        toast.error("Tạo thất bại: " + (res?.message || "Lỗi không xác định"));
      }
    } catch (error) {
      console.error("Submit Error:", error);
      if (error.response?.data?.data?.errors) {
         // Xử lý lỗi validation chi tiết như trong log bạn gửi
         const errorList = error.response.data.data.errors;
         const errorMsg = errorList.map(e => `${e.field}: ${e.message}`).join("\n");
         toast.error(`Lỗi dữ liệu:\n${errorMsg}`);
      } else if (
        error.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ) {
        const errorMessages = error.response.data.detail
          .map((err) => `${err.loc[1] || err.loc[0]}: ${err.msg}`)
          .join("\n");
        toast.error(`Lỗi dữ liệu:\n${errorMessages}`);
      } else {
        const msg =
          error.response?.data?.message || "Có lỗi xảy ra khi kết nối server.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Thêm hợp đồng mới
              {loadingData && (
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* --- HÀNG 1: Mã HĐ - Khách - Phòng --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contractCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">
                        Mã hợp đồng
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="HD..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-semibold text-gray-700">
                        Khách thuê
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? tenants.find((t) => t.id === field.value)
                                    ?.full_name || "Khách hàng"
                                : "Chọn khách hàng"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Tìm tên hoặc SĐT..." />
                            <CommandList>
                              <CommandEmpty>Không tìm thấy.</CommandEmpty>
                              <CommandGroup>
                                {tenants.map((t) => (
                                  <CommandItem
                                    value={t.full_name + " " + t.phone}
                                    key={t.id}
                                    onSelect={() =>
                                      form.setValue("tenantId", t.id)
                                    }
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        t.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{t.full_name}</span>
                                      <span className="text-xs text-gray-500">
                                        {t.phone}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-semibold text-gray-700">
                        Phòng (Trống)
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? rooms.find((r) => r.id === field.value)
                                    ?.room_number
                                  ? `Phòng ${
                                      rooms.find((r) => r.id === field.value)
                                        .room_number
                                    }`
                                  : "Đã chọn phòng"
                                : "Chọn phòng"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Tìm số phòng..." />
                            <CommandList>
                              <CommandEmpty>Hết phòng trống.</CommandEmpty>
                              <CommandGroup>
                                {rooms.map((r) => (
                                  <CommandItem
                                    value={`${r.room_number} ${
                                      r.building_name || ""
                                    }`}
                                    key={r.id}
                                    onSelect={() => handleRoomSelect(r.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        r.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        Phòng {r.room_number}
                                      </span>
                                      {r.building_name && (
                                        <span className="text-xs text-gray-500">
                                          {r.building_name}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- HÀNG 2: Ngày tháng --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Ngày kết thúc</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                  <span className="text-sm text-gray-500">Thời hạn:</span>
                  <div className="flex gap-2">
                    {[3, 6, 12].map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDurationClick(m)}
                        className="h-8"
                      >
                        {m === 12 ? "1 Năm" : `${m} Tháng`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- HÀNG 3: Tài chính --- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="rentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá thuê (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điện (/kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nước (/Khối)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- HÀNG 4: Cấu hình thanh toán --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày đóng tiền</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
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
                      <FormLabel>Chu kỳ thanh toán</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="1">1 Tháng/lần</option>
                          <option value="3">3 Tháng/lần</option>
                          <option value="6">6 Tháng/lần</option>
                        </select>
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
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                          <option value="PENDING">Chờ ký</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- DỊCH VỤ (Tags Style) --- */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <FormLabel className="mb-3 block text-base font-medium">
                  Dịch vụ đi kèm
                </FormLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm text-gray-700"
                    >
                      {s.name}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-500 transition-colors"
                        onClick={() => handleRemoveService(s.id)}
                      />
                    </div>
                  ))}
                  {services.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      Chưa có dịch vụ nào
                    </span>
                  )}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <Input
                    placeholder="Thêm dịch vụ (Wifi, Vệ sinh...)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddService}
                    size="icon"
                    className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* --- TERMS --- */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điều khoản đặc biệt & Ghi chú</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="w-full border rounded-md p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Nhập điều khoản bổ sung..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Đóng
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            {isSubmitting ? "Đang xử lý..." : "Tạo hợp đồng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}