import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { FaFileContract } from "react-icons/fa";
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
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tempCCCD, setTempCCCD] = useState(""); // CCCD tạm thời khi tenant chưa có
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE SERVICES (Object với name, amount, description) ---
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Phí rác",
      amount: 20000,
      description: "Phí thu gớm rác hàng tháng",
    },
    { id: 2, name: "Phí giữ xe", amount: 50000, description: "Phí giữ xe máy" },
  ]);
  const [newService, setNewService] = useState({
    name: "",
    amount: 0,
    description: "",
  });

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

  // Thông tin Bên A (Chủ nhà trọ - set cứng)
  const landlordInfo = {
    name: "Nguyễn Văn A",
    cccd: "001234567890",
    address: "123 Đường ABC, Quận XYZ, TP.HCM",
    phone: "0901234567",
  };

  const generateNextCode = () => {
    const timestamp = Date.now(); 
    const last6Digits = String(timestamp).slice(-6);
    
    return `INV-${last6Digits}`;
  };

  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setLoadingData(true);
        try {
          const [resRooms, resTenants] = await Promise.all([
            roomService.getAll({ size: 100, status: "AVAILABLE" }),
            userService.getAll({ size: 100, role_code: "TENANT" }),
          ]);

          if (resRooms?.data?.items) setRooms(resRooms.data.items);
          else if (resRooms?.items) setRooms(resRooms.items);
          else setRooms([]);

          if (resTenants?.data?.items) setTenants(resTenants.data.items);
          else if (resTenants?.items) setTenants(resTenants.items);
          else setTenants([]);

          // Tạo mã hợp đồng dựa trên thời gian
          const nextCode = generateNextCode();
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

  // --- LOGIC DỊCH VỤ ---
  const handleAddService = () => {
    if (!newService.name.trim()) return;
    setServices([
      ...services,
      {
        id: Date.now(),
        name: newService.name.trim(),
        amount: newService.amount || 0,
        description: newService.description || "",
      },
    ]);
    setNewService({ name: "", amount: 0, description: "" });
  };

  const handleRemoveService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };
  // -----------------------------

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Kiểm tra CCCD
      const cccdToUse = selectedTenant?.cccd || tempCCCD;
      if (!cccdToUse || cccdToUse.trim() === "") {
        toast.error("Vui lòng nhập số CCCD/CMND của người thuê");
        setIsSubmitting(false);
        return;
      }

      if (cccdToUse.length < 9 || cccdToUse.length > 12) {
        toast.error("Số CCCD/CMND phải từ 9-12 ký tự");
        setIsSubmitting(false);
        return;
      }

      const serviceFeesPayload = services
        .filter((s) => s.name.trim() !== "")
        .map((s) => ({
          name: s.name,
          amount: s.amount || 0,
          description: s.description || "",
        }));

      const apiPayload = {
        room_id: values.roomId,
        tenant_id: values.tenantId,
        tenant_cccd: cccdToUse, // Gửi CCCD (từ tenant hoặc nhập tạm)
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
          `Tạo thành công hợp đồng ${
            createdContract?.contract_number || values.contractCode
          }!`
        );
        if (onAddSuccess) onAddSuccess(createdContract);
        setSelectedTenant(null);
        setTempCCCD("");
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
        const errorMsg = errorList
          .map((e) => `${e.field}: ${e.message}`)
          .join("\n");
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

  const handleClose = () => {
    setSelectedTenant(null);
    setTempCCCD("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] bg-white max-h-[90vh] flex flex-col p-0 gap-0">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* LAYOUT 2 CỘT TRÊN DESKTOP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- CỘT TRÁI --- */}
                <div className="space-y-6">
                  {/* --- THÔNG TIN HỢP ĐỒNG CƠ BẢN --- */}
                  <div className=" p-5 rounded-xl border-2 ">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FaFileContract className="text-blue-600" />
                      Thông tin hợp đồng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contractCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Mã hợp đồng
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="HD..."
                                className="bg-white"
                              />
                            </FormControl>
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
                                      "w-full justify-between font-normal bg-white",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? rooms.find((r) => r.id === field.value)
                                          ?.room_number
                                        ? `Phòng ${
                                            rooms.find(
                                              (r) => r.id === field.value
                                            ).room_number
                                          }`
                                        : "Đã chọn phòng"
                                      : "Chọn phòng"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[220px] p-0"
                                align="start"
                              >
                                <Command shouldFilter={false}>
                                  <CommandInput placeholder="Tìm số phòng..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      Hết phòng trống.
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                                      {rooms.map((r) => (
                                        <CommandItem
                                          value={`${r.room_number} ${
                                            r.building_name || ""
                                          }`}
                                          key={r.id}
                                          onSelect={() =>
                                            handleRoomSelect(r.id)
                                          }
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
                  </div>

                  {/* --- BÊN A: CHỦ NHÀ TRỌ --- */}
                  <div className=" p-5 rounded-xl border-2 ">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                        A
                      </div>
                      Bên A - Chủ nhà trọ (Bên cho thuê)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Họ và tên
                        </label>
                        <div className="px-4 py-2.5 bg-white border-2  rounded-lg text-gray-900 font-medium">
                          {landlordInfo.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Số CCCD/CMND
                        </label>
                        <div className="px-4 py-2.5 bg-white border-2  rounded-lg text-gray-900 font-medium">
                          {landlordInfo.cccd}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Số điện thoại
                        </label>
                        <div className="px-4 py-2.5 bg-white border-2  rounded-lg text-gray-900 font-medium">
                          {landlordInfo.phone}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Địa chỉ
                        </label>
                        <div className="px-4 py-2.5 bg-white border-2  rounded-lg text-gray-900 font-medium">
                          {landlordInfo.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- BÊN B: NGƯỜI THUÊ --- */}
                  <div className=" p-5 rounded-xl border-2 ">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                        B
                      </div>
                      Bên B - Người thuê (Bên nhận thuê)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tenantId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="font-semibold text-gray-700">
                              Họ và tên *
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between font-normal bg-white",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? tenants.find(
                                          (t) => t.id === field.value
                                        )?.full_name || "Khách hàng"
                                      : "Chọn khách hàng"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[250px] p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput placeholder="Tìm tên hoặc SĐT..." />
                                  <CommandList className="max-h-[300px] overflow-y-auto">
                                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                    <CommandGroup>
                                      {tenants.map((t) => (
                                        <CommandItem
                                          value={t.full_name + " " + t.phone}
                                          key={t.id}
                                          onSelect={() => {
                                            form.setValue("tenantId", t.id);
                                            setSelectedTenant(t);
                                            setTempCCCD(""); // Reset CCCD tạm khi chọn tenant mới
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

                      <div className="gap-2 flex flex-col">
                        <FormLabel className="font-semibold text-gray-700">
                          Số CCCD/CMND *
                        </FormLabel>

                        {selectedTenant?.cccd ? (
                          <div className="px-4 py-2.5 bg-white border-2  rounded-lg text-gray-900 font-medium">
                            {selectedTenant.cccd}
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder="Nhập số CCCD/CMND"
                              value={tempCCCD}
                              onChange={(e) => setTempCCCD(e.target.value)}
                              className="bg-white border-2 "
                              maxLength={12}
                              disabled={!selectedTenant}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* --- KẾT THÚC CỘT TRÁI --- */}

                {/* --- CỘT PHẢI --- */}
                <div className="space-y-6">
                  {/* --- THỜI HẠN HỢP ĐỒNG --- */}
                  <div className=" p-5 rounded-xl border-2 ">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      ⏰ Thời hạn hợp đồng
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Ngày bắt đầu
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="bg-white"
                              />
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
                            <FormLabel className="font-semibold text-gray-700">
                              Ngày kết thúc
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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

                  {/* --- THÔNG TIN TÀI CHÍNH --- */}
                  <div className=" p-5 rounded-xl border-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      💰 Thông tin tài chính
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rentPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Giá thuê (VNĐ)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Tiền cọc (VNĐ)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="electricityPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Điện (/kWh)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="waterPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Nước (/Người)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* --- CẤU HÌNH THANH TOÁN --- */}
                  <div className="p-5 rounded-xl border-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      📅 Cấu hình thanh toán
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4  ">
                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">
                              Ngày đóng tiền
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={31}
                                {...field}
                                className="bg-white"
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
                            <FormLabel className="font-semibold text-gray-700">
                              Chu kỳ thanh toán
                            </FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                            <FormLabel className="font-semibold text-gray-700">
                              Trạng thái
                            </FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="PENDING">Chờ ký</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                {/* --- KẾT THÚC CỘT PHẢI --- */}
              </div>
              {/* --- KẾT THÚC LAYOUT 2 CỘT --- */}

              {/* --- DỊCH VỤ (TOÀN BỘ CHIỀU RỘNG) --- */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <FormLabel className="mb-3 block text-base font-medium">
                  Dịch vụ
                </FormLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm text-gray-700"
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.amount > 0 && (
                        <span className="text-xs text-gray-500">
                          - {s.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Tên dịch vụ (Wifi, Internet...)"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    className="bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Số tiền (VNĐ)"
                    value={newService.amount || ""}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Mô tả (không bắt buộc)"
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          description: e.target.value,
                        })
                      }
                      className="bg-white"
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
              </div>

              {/* --- ĐIỀU KHOẢN --- */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-xl border-2 border-gray-200">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold text-gray-800 mb-2 block">
                        📋 Điều khoản đặc biệt & Ghi chú
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full border-2 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                          placeholder="Nhập điều khoản bổ sung..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
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
