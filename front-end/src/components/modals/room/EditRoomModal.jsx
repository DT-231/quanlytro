import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FaSave } from "react-icons/fa";
import { Info, DollarSign } from "lucide-react"; 

// Import UI Components
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { buildingService } from "@/services/buildingService";
import { roomService } from "@/services/roomService";

// Schema Validation
const roomSchema = z.object({
  room_number: z.string().min(1, "Số phòng bắt buộc"),
  building_id: z.string().min(1, "Chọn tòa nhà"),
  room_type: z.string().min(1, "Chọn loại phòng"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]),
  area: z.coerce.number().min(0, "Diện tích > 0"),
  capacity: z.coerce.number().min(1, "Sức chứa tối thiểu 1"),
  base_price: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  electricity_cost: z.coerce.number().min(0),
  water_cost: z.coerce.number().min(0),
  description: z.string().optional(),
});

export default function EditRoomModal({
  isOpen,
  onClose,
  onUpdateSuccess,
  roomData,
}) {
  // State Tabs
  const [activeTab, setActiveTab] = useState("info");

  // State Data
  const [buildings, setBuildings] = useState([]);
  const [amenities, setAmenities] = useState([
    { id: "ac", label: "Điều hoà", checked: false },
    { id: "kitchen", label: "Bếp", checked: false },
    { id: "bed", label: "Giường", checked: false },
    { id: "tv", label: "TV", checked: false },
    { id: "balcony", label: "Ban công", checked: false },
    { id: "window", label: "Cửa sổ", checked: false },
    { id: "wifi", label: "Wifi", checked: false },
    { id: "fridge", label: "Tủ lạnh", checked: false },
    { id: "wm", label: "Máy giặt", checked: false },
  ]);

  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: "",
      building_id: "",
      room_type: "STUDIO",
      status: "AVAILABLE",
      area: 0,
      capacity: 1,
      base_price: 0,
      deposit_amount: 0,
      electricity_cost: 0,
      water_cost: 0,
      description: "",
    },
  });

  // 1. Load danh sách tòa nhà
  useEffect(() => {
    if (isOpen) {
      buildingService.getAll().then((res) => {
        if (res?.data?.items) setBuildings(res.data.items);
      });
    }
  }, [isOpen]);

  // 2. Đổ dữ liệu cũ
  useEffect(() => {
    if (roomData && isOpen) {
      const fetchDetail = async () => {
        try {
          const res = await roomService.getById(roomData.id);
          const data = res.data;
          if (data) {
            form.reset({
              room_number: data.room_number,
              building_id: data.building_id,
              room_type: data.room_type,
              status: data.status,
              area: data.area,
              capacity: data.capacity,
              base_price: data.base_price,
              deposit_amount: data.deposit_amount,
              electricity_cost: data.electricity_cost,
              water_cost: data.water_cost,
              description: data.description,
            });

            // Xử lý amenities
            const currentUtils = data.utilities || [];
            setAmenities((prev) =>
              prev.map((a) => ({
                ...a,
                checked: currentUtils.includes(a.label),
              }))
            );
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết phòng:", error);
        }
      };
      fetchDetail();
      setActiveTab("info");
    }
  }, [roomData, isOpen, form]);

  const toggleAmenity = (id) => {
    setAmenities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checked: !a.checked } : a))
    );
  };

  const onSubmit = (values) => {
    const selectedUtils = amenities
      .filter((a) => a.checked)
      .map((a) => a.label);
    const payload = {
      ...values,
      utilities: selectedUtils,
      photo_urls: [],
    };
    if (roomData) onUpdateSuccess(roomData.id, payload);
    onClose();
  };

  // Component Button Tab
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md
        ${
          activeTab === id
            ? "bg-white text-black shadow-sm font-bold"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
        }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white text-black max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-5 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Cập nhật thông tin phòng
            </DialogTitle>
            <DialogDescription className="hidden">
              Chỉnh sửa chi tiết phòng
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* TABS SWITCHER */}
        <div className="px-5 mb-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <TabButton id="info" label="Thông tin" icon={Info} />
            <TabButton id="money" label="Tiền" icon={DollarSign} />
          </div>
        </div>

        {/* BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* --- TAB 1: THÔNG TIN --- */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="room_number"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Số phòng
                          </FormLabel>
                          <FormControl>
                            <Input className="h-9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Trạng thái
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">
                                Còn trống
                              </SelectItem>
                              <SelectItem value="OCCUPIED">
                                Đang thuê
                              </SelectItem>
                              <SelectItem value="MAINTENANCE">
                                Đang sửa
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="building_id"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Tòa nhà
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Chọn tòa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {buildings.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.building_name}
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
                      name="room_type"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Loại phòng
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="STUDIO">Studio</SelectItem>
                              <SelectItem value="1BED">1 Phòng ngủ</SelectItem>
                              <SelectItem value="2BED">2 Phòng ngủ</SelectItem>
                              <SelectItem value="DORM">Ký túc xá</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Diện tích (m²)
                          </FormLabel>
                          <FormControl>
                            <Input className="h-9" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Sức chứa
                          </FormLabel>
                          <FormControl>
                            <Input className="h-9" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Mô tả */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold text-gray-700">
                          Mô tả
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[60px] text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Tiện ích */}
                  <div className="pt-1">
                    <FormLabel className="text-xs font-bold text-black mb-2 block">
                      Tiện ích (Đã có)
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {amenities.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`room-edit-${item.id}`}
                            checked={item.checked}
                            onChange={() => toggleAmenity(item.id)}
                            className="h-4 w-4 accent-black cursor-pointer"
                          />
                          <label
                            htmlFor={`room-edit-${item.id}`}
                            className="text-xs font-medium cursor-pointer text-gray-700"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: TIỀN --- */}
              {activeTab === "money" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-black">
                    Chi phí phòng
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="base_price"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Giá thuê (VNĐ)
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 bg-white"
                              type="number"
                              {...field}
                              value={field.value ? Math.trunc(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deposit_amount"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Tiền cọc (VNĐ)
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 bg-white"
                              type="number"
                              {...field}
                              value={field.value ? Math.trunc(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="electricity_cost"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Tiền điện (/kWh)
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 bg-white"
                              type="number"
                              {...field}
                              value={field.value ? Math.trunc(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="water_cost"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Tiền nước (VNĐ)
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 bg-white"
                              type="number"
                              {...field}
                              value={field.value ? Math.trunc(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-sm"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm flex items-center gap-2"
          >
            <FaSave size={14} /> Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
