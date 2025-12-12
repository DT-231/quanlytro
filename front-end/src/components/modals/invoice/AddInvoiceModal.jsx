import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, Zap, Droplets, Wrench, X } from "lucide-react";

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
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc"),
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

export default function AddInvoiceModal({
  isOpen,
  onClose,
  onAddSuccess,
  buildings = [],
  rooms = [],
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [currentRates, setCurrentRates] = useState({ elec: 0, water: 0 });

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      roomId: "",
      buildingId: "",
      status: "Chưa thanh toán",
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

  const watchBuildingId = form.watch("buildingId");
  const watchRoomId = form.watch("roomId");
  const [elecOld, elecNew, waterOld, waterNew, services] = form.watch([
    "elecOld",
    "elecNew",
    "waterOld",
    "waterNew",
    "services",
  ]);

  const filteredRooms = useMemo(() => {
    // Nếu chưa chọn tòa nhà thì không hiện phòng
    if (!watchBuildingId) return [];
    const selectedBuilding = buildings.find(
      (b) => String(b.id) === String(watchBuildingId)
    );
    const selectedBuildingName = selectedBuilding
      ? selectedBuilding.building_name || selectedBuilding.name
      : "";

    console.log(
      "Đang lọc phòng cho tòa:",
      selectedBuildingName,
      "| ID:",
      watchBuildingId
    );

    return rooms.filter((r) => {
      const roomBuildingId =
        r.building_id || r.buildingId || (r.building ? r.building.id : null);
      const matchId =
        roomBuildingId && String(roomBuildingId) === String(watchBuildingId);
      const roomBuildingName = r.building_name || r.buildingName;
      const matchName =
        selectedBuildingName &&
        roomBuildingName &&
        roomBuildingName.toLowerCase() === selectedBuildingName.toLowerCase();

      return matchId || matchName;
    });
  }, [watchBuildingId, rooms, buildings]);

  useEffect(() => {
    form.setValue("roomId", "");
    form.setValue("customerName", "");
    setCurrentRates({ elec: 0, water: 0 });
  }, [watchBuildingId, form]);

  useEffect(() => {
    if (watchRoomId) {
      const roomDetail = rooms.find((r) => r.id === watchRoomId);
      if (roomDetail) {
        // Điền tên khách (representative)
        form.setValue(
          "customerName",
          roomDetail.representative || "Chưa có người thuê"
        );
        setCurrentRates({
          elec: Number(roomDetail.electricity_cost) || 0,
          water: Number(roomDetail.water_cost) || 0,
        });
      }
    }
  }, [watchRoomId, rooms, form]);

  // 4. Tính toán tổng tiền
  useEffect(() => {
    const eUsed = Math.max(0, elecNew - elecOld);
    const wUsed = Math.max(0, waterNew - waterOld);

    // Set giá trị tiêu thụ
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

  const onSubmit = (values) => {
    const selectedRoom = rooms.find((r) => r.id === values.roomId);
    const selectedBuilding = buildings.find((b) => b.id === values.buildingId);

    const enrichedValues = {
      ...values,
      roomName: selectedRoom
        ? selectedRoom.room_number || selectedRoom.name
        : values.roomId,
      buildingName: selectedBuilding
        ? selectedBuilding.building_name || selectedBuilding.name
        : values.buildingId,
    };

    console.log("Dữ liệu hóa đơn:", enrichedValues);
    if (onAddSuccess) onAddSuccess(enrichedValues);

    // Reset form
    onClose();
    form.reset();
    setActiveTab("info");
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white text-black flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">
            Tạo hóa đơn mới
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Nhập thông tin chi tiết để tạo hóa đơn điện nước cho phòng.
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
              {/* TAB 1: THÔNG TIN */}
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="buildingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tòa nhà</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tòa nhà" />
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
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={
                            filteredRooms.some(
                              (r) => String(r.id) === field.value
                            )
                              ? field.value
                              : ""
                          }
                          disabled={!watchBuildingId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phòng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredRooms.length > 0 ? (
                              filteredRooms.map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>
                                  {/* Ưu tiên room_number, fallback sang name */}
                                  {r.room_number || r.name || `Phòng ${r.id}`}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                {watchBuildingId
                                  ? "Tòa nhà này chưa có phòng"
                                  : "Vui lòng chọn tòa nhà trước"}
                              </div>
                            )}
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
                            className="bg-gray-50 text-gray-600 focus-visible:ring-0"
                            placeholder="Tên khách sẽ tự hiển thị..."
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
                            <SelectItem value="Chưa thanh toán">
                              Chưa thanh toán
                            </SelectItem>
                            <SelectItem value="Đã thanh toán">
                              Đã thanh toán
                            </SelectItem>
                            <SelectItem value="Đang xử lý">
                              Đang xử lý
                            </SelectItem>
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
                        <FormLabel>Tổng tiền</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              readOnly
                              className="bg-gray-50 text-black pr-10"
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
                  <div className="bg-gray-50 p-3 text-sm text-gray-700 rounded border border-gray-100 flex justify-between">
                    <span>Đơn giá áp dụng:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN").format(currentRates.elec)}{" "}
                      đ/kWh
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
                        <FormLabel>Số lượng tiêu thụ</FormLabel>
                        <div className="relative">
                          <Input {...field} readOnly className="bg-gray-50" />
                          <span className="absolute right-3 top-2 text-sm text-gray-500">
                            kWh
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* TAB 3: NƯỚC */}
              {activeTab === "water" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gray-50 p-3 text-sm text-gray-700 rounded border border-gray-100 flex justify-between">
                    <span>Đơn giá áp dụng:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN").format(
                        currentRates.water
                      )}{" "}
                      đ/m³
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
                        <FormLabel>Số lượng tiêu thụ</FormLabel>
                        <div className="relative">
                          <Input {...field} readOnly className="bg-gray-50" />
                          <span className="absolute right-3 top-2 text-sm text-gray-500">
                            m³
                          </span>
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
                              <FormLabel className="text-xs">
                                Tên dịch vụ
                              </FormLabel>
                              <Input {...field} />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`services.${index}.price`}
                          render={({ field }) => (
                            <FormItem className="w-1/3">
                              <FormLabel className="text-xs">
                                Giá tiền
                              </FormLabel>
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
                <Button type="button" variant="outline" onClick={onClose}>
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Lưu hóa đơn
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
