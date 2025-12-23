import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import {
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
import GenericCombobox from "@/components/GenericCombobox";

export default function RoomInfoTab({
  buildings = [],
  roomTypes = [],
  availableAmenities,
  toggleAmenity,
  onOpenUtilityModal,
}) {
  const { control } = useFormContext();

  // Chuẩn hóa dữ liệu Tòa nhà
  const buildingOptions = useMemo(() => {
    return (buildings || []).map((b) => ({
      ...b,
      name: b.building_name, // Map building_name sang name cho Combobox hiểu
    }));
  }, [buildings]);

  // Chuẩn hóa dữ liệu Loại phòng (Thêm useMemo để tối ưu)
  const roomTypeOptions = useMemo(() => {
    return (roomTypes || []).map((t) => ({
      ...t,
      name: t.name || t.label || "", // Đảm bảo luôn có trường name
      id: t.id || t.value,           // Đảm bảo luôn có id
    }));
  }, [roomTypes]);

  return (
    <div className="space-y-4">
      {/* Hàng 1: Số phòng & Tên phòng */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="room_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">Số phòng</FormLabel>
              <FormControl>
                <Input placeholder="P.101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="room_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">Tên phòng</FormLabel>
              <FormControl>
                <Input placeholder="Phòng Studio..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Hàng 2: Tòa nhà & Loại phòng */}
      <div className="grid grid-cols-2 gap-4">
        {/* --- COMBOBOX TÒA NHÀ --- */}
        <FormField
          control={control}
          name="building_id"
          render={({ field }) => {
            const selectedName =
              buildingOptions.find((b) => b.id === field.value)?.name || "";

            return (
              <FormItem className="flex flex-col">
                <FormLabel className="font-semibold text-sm">Tòa nhà</FormLabel>
                <FormControl>
                  <GenericCombobox
                    placeholder="Tìm tòa nhà"
                    options={buildingOptions}
                    value={selectedName}
                    onChange={(name) => {
                      const found = buildingOptions.find((b) => b.name === name);
                      field.onChange(found?.id || "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* --- COMBOBOX LOẠI PHÒNG (Đã sửa) --- */}
        <FormField
          control={control}
          name="room_type_id"
          render={({ field }) => {
            // Tìm tên loại phòng dựa trên ID đang chọn
            const selectedName =
              roomTypeOptions.find((t) => t.id === field.value)?.name || "";

            return (
              <FormItem className="flex flex-col">
                <FormLabel className="font-semibold text-sm">
                  Loại phòng
                </FormLabel>
                <FormControl>
                  <GenericCombobox
                    placeholder="Tìm loại phòng"
                    options={roomTypeOptions}
                    value={selectedName}
                    onChange={(name) => {
                      // Tìm ID dựa trên tên được chọn
                      const found = roomTypeOptions.find((t) => t.name === name);
                      field.onChange(found?.id || "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      {/* Hàng 3: Sức chứa & Diện tích */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">
                Tối đa (người)
              </FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">
                Diện tích (m²)
              </FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Hàng 4: Trạng thái */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-sm">
                Trạng thái
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value} // Thêm value để bind đúng state
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Còn trống</SelectItem>
                  <SelectItem value="OCCUPIED">Đang thuê</SelectItem>
                  <SelectItem value="MAINTENANCE">Đang sửa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Mô tả */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold text-sm">Mô tả</FormLabel>
            <FormControl>
              <Textarea
                placeholder="..."
                {...field}
                className="min-h-[80px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tiện ích */}
      <div>
        <FormLabel className="font-semibold text-sm block mb-3">
          Tiện ích
        </FormLabel>
        <div className="grid grid-cols-3 gap-y-3 gap-x-2">
          {availableAmenities.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleAmenity(item.id)}
                className="h-4 w-4 accent-black cursor-pointer"
              />
              <label
                className="text-sm font-medium cursor-pointer"
                onClick={() => toggleAmenity(item.id)}
              >
                {item.label}
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={onOpenUtilityModal}
            className="flex items-center space-x-2 text-black col-span-1 hover:text-gray-700 transition"
          >
            <div className="h-4 w-4 border border-black rounded flex items-center justify-center">
              <Plus size={12} />
            </div>
            <span className="text-sm font-medium">Thêm tiện ích</span>
          </button>
        </div>
      </div>
    </div>
  );
}