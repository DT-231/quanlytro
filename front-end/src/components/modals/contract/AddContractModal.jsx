import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2, Check, ChevronsUpDown } from "lucide-react"; 
import { contractService } from "@/services/contractService"; 
import { toast } from "sonner";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";
// 2. THÊM IMPORT cn
import { cn } from "@/lib/utils";
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
      terms: "Bên thuê có trách nhiệm bảo quản tài sản...",
    },
  });

  const generateNextCode = (contracts) => {
    if (!contracts || contracts.length === 0) return "HD001";

    let maxNum = 0;
    contracts.forEach((contract) => {
      const code = contract.contract_number;
      if (code && code.startsWith("HD")) {
        const numPart = parseInt(code.replace("HD", ""), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `HD${String(nextNum).padStart(3, "0")}`;
  };

  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setLoadingData(true);
        try {
          const [resRooms, resTenants, resContracts] = await Promise.all([
            roomService.getAll({ size: 100, status: "AVAILABLE" }),
            userService.getAll({ size: 100, role: "TENANT" }),
            contractService.getAll({ size: 100 }),
          ]);
          if (resRooms && resRooms.data && Array.isArray(resRooms.data.items)) {
            setRooms(resRooms.data.items);
          } else if (resRooms && Array.isArray(resRooms.items)) {
            setRooms(resRooms.items);
          } else {
            setRooms([]);
          }

          if (
            resTenants &&
            resTenants.data &&
            Array.isArray(resTenants.data.items)
          ) {
            setTenants(resTenants.data.items);
          } else if (resTenants && Array.isArray(resTenants.items)) {
            setTenants(resTenants.items);
          } else {
            setTenants([]);
          }

          let currentContracts = [];
          if (
            resContracts &&
            resContracts.data &&
            Array.isArray(resContracts.data.items)
          ) {
            currentContracts = resContracts.data.items;
          } else if (resContracts && Array.isArray(resContracts.items)) {
            currentContracts = resContracts.items;
          }

          const nextCode = generateNextCode(currentContracts);
          form.setValue("contractCode", nextCode);
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

  const handleRoomSelect = (selectedRoomId) => {
    form.setValue("roomId", selectedRoomId);
    const room = rooms.find((r) => r.id === selectedRoomId);
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
    setServices([
      ...services,
      { id: Date.now(), name: newServiceName, price: 0 },
    ]);
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
        service_fees: services.map((s) => s.name),
        status: values.status,
      };

      console.log("Submitting:", apiPayload);
      const res = await contractService.create(apiPayload);
      if (
        res &&
        (res.code === 200 || res.code === 201 || res.message === "success")
      ) {
        const createdContract = res.data;
        if (onAddSuccess) {
          onAddSuccess(createdContract);
        } else {
          toast.success(
            `Tạo thành công hợp đồng ${createdContract?.contract_number || ""}!`
          );
          onClose();
        }

        form.reset();
      } else {
        toast.error("Tạo thất bại: " + (res?.message || "Lỗi không xác định"));
      }
    } catch (error) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.detail || "Có lỗi xảy ra khi kết nối server.";
      toast.error(typeof msg === "string" ? msg : "Lỗi dữ liệu đầu vào.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Thêm hợp đồng mới
              {loadingData && (
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2. KHÁCH THUÊ  */}
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
                                    ?.full_name || "Chọn khách hàng"
                                : "-- Chọn khách --"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                          <Command>
                            <CommandInput placeholder="Tìm tên hoặc SĐT..." />
                            <CommandList>
                              <CommandEmpty>
                                Không tìm thấy khách hàng.
                              </CommandEmpty>
                              <CommandGroup>
                                {tenants.map((t) => (
                                  <CommandItem
                                    value={t.full_name + " " + t.phone}
                                    key={t.id}
                                    onSelect={() => {
                                      form.setValue("tenantId", t.id);
                                    }}
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

                {/* 3. PHÒNG  */}
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
                                  : "Chọn phòng"
                                : "-- Chọn phòng --"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Tìm số phòng..." />
                            <CommandList>
                              <CommandEmpty>Không tìm thấy phòng.</CommandEmpty>
                              <CommandGroup>
                                {rooms.map((r) => (
                                  <CommandItem
                                    value={
                                      r.room_number +
                                      " " +
                                      (r.building_name || "")
                                    } // Search theo số phòng và tên tòa nhà
                                    key={r.id}
                                    onSelect={() => {
                                      handleRoomSelect(r.id); // Gọi hàm xử lý riêng để cập nhật giá
                                    }}
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
                                      <span>Phòng {r.room_number}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
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
                <div className="col-span-1 md:col-span-2 flex gap-2">
                  <span className="text-xs text-gray-500 self-center">
                    Chọn nhanh:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(3)}
                  >
                    3 Tháng
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(6)}
                  >
                    6 Tháng
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationClick(12)}
                  >
                    1 Năm
                  </Button>
                </div>
              </div>

              {/* --- HÀNG 3: Tài chính --- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="rentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá thuê</FormLabel>
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
                      <FormLabel>Tiền cọc</FormLabel>
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
                      <FormLabel>Giá điện (/kWh)</FormLabel>
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
                      <FormLabel>Giá nước (/khối)</FormLabel>
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
                      <FormLabel>Ngày đóng tiền hàng tháng</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ví dụ: 15"
                          {...field}
                        />
                      </FormControl>
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm "
                        >
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
                    <div
                      key={s.id}
                      className="bg-white border px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm"
                    >
                      {s.name}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveService(s.id)}
                      />
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
                  <Button
                    type="button"
                    onClick={handleAddService}
                    size="icon"
                    className="shrink-0"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điều khoản đặc biệt</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            {isSubmitting ? "Đang tạo..." : "Tạo hợp đồng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
