import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Info,
  DollarSign,
  Image as ImageIcon,
  Plus,
  X,
  Upload,
  Star, 
} from "lucide-react";
import { toast } from "sonner";

import { buildingService } from "@/services/buildingService";
import AddUtilityModal from "@/components/modals/utility/AddUtilityModal";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const roomSchema = z.object({
  // Tab 1: Thông tin
  room_number: z.string().min(1, "Số phòng không được để trống"),
  status: z.string().default("AVAILABLE"),
  building_id: z.string().min(1, "Vui lòng chọn tòa nhà"),
  room_type: z.string().min(1, "Vui lòng chọn loại phòng"),
  area: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập diện tích" })
    .min(0, "Diện tích không hợp lệ"),
  capacity: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập số người" })
    .min(1, "Tối thiểu 1 người"),

  description: z.string().optional(),

  // Tab 2: Tiền
  base_price: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá thuê" })
    .min(0, "Giá thuê không được âm"),
  deposit_amount: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập tiền cọc" })
    .min(0, "Tiền cọc không được âm"),
  electricity_cost: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá điện" })
    .min(0, "Giá điện không được âm"),
  water_cost: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá nước" })
    .min(0, "Giá nước không được âm"),
  // Chi phí phụ
  extraCosts: z.array(
    z.object({
      name: z.string().min(1, "Tên phí"),
      price: z.coerce.number().min(0, "Giá không được âm"),
    })
  ),
});

export default function AddRoomModal({ isOpen, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState("info");
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);

  const [availableAmenities, setAvailableAmenities] = useState([
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
      status: "AVAILABLE",
      building_id: "",
      room_type: "STUDIO",
      area: 0,
      capacity: 2,
      description: "",
      base_price: 0,
      deposit_amount: 0,
      electricity_cost: 3500,
      water_cost: 20000,
      extraCosts: [{ name: "Tiền rác", price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "extraCosts",
  });

  // Load Buildings
  useEffect(() => {
    if (isOpen) {
      const fetchBuildings = async () => {
        try {
          const response = await buildingService.getAll();
          if (response && response.data && Array.isArray(response.data.items)) {
            setBuildings(response.data.items);
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách tòa nhà:", error);
        }
      };
      fetchBuildings();
    }
  }, [isOpen]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 10) {
      toast.error("Chỉ được tải lên tối đa 10 ảnh.");
      return;
    }

    const newImages = files.map((file) => ({
      file: file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const toggleAmenity = (id) => {
    setAvailableAmenities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddNewAmenity = (name) => {
    const newId = name.toLowerCase().replace(/\s+/g, "-");
    const exists = availableAmenities.find(
      (a) => a.id === newId || a.label.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      setAvailableAmenities([
        ...availableAmenities,
        { id: newId, label: name, checked: true },
      ]);
    } else {
      setAvailableAmenities((prev) =>
        prev.map((a) =>
          a.id === newId || a.label.toLowerCase() === name.toLowerCase()
            ? { ...a, checked: true }
            : a
        )
      );
    }
  };

  // --- UPDATED SUBMIT LOGIC ---
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const selectedAmenities = availableAmenities
        .filter((item) => item.checked)
        .map((item) => item.label);
      const processedPhotos = await Promise.all(
        selectedImages.map(async (img, index) => {
          const base64String = await fileToBase64(img.file);
          return {
            is_primary: index === 0,
            sort_order: index,
            image_base64: base64String,
          };
        })
      );

      const finalData = {
        building_id: values.building_id,
        room_number: values.room_number,
        room_name: values.room_number,
        area: values.area,
        capacity: values.capacity,
        base_price: values.base_price,
        electricity_price: values.electricity_cost, 
        water_price_per_person: values.water_cost, 
        deposit_amount: values.deposit_amount,
        status: values.status,
        description: values.description || "",
        utilities: selectedAmenities,
        photos: processedPhotos, 
      };

      console.log("Room Payload:", finalData);
      
      if (onAddSuccess) {
        await onAddSuccess(finalData);
      }
      
      // Reset form
      onClose();
      form.reset();
      setSelectedImages([]);
      setActiveTab("info");
      setAvailableAmenities((prev) =>
        prev.map((item) => ({ ...item, checked: false }))
      );
    } catch (error) {
      console.error("Lỗi xử lý form:", error);
      toast.error("Có lỗi xảy ra khi xử lý dữ liệu");
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
            ? "bg-white text-black shadow-sm font-bold"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
        }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white text-black max-h-[90vh] flex flex-col">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Thêm phòng mới
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 mb-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <TabButton id="info" label="Thông tin" icon={Info} />
              <TabButton id="money" label="Tiền" icon={DollarSign} />
              <TabButton
                id="images"
                label={`Ảnh (${selectedImages.length})`}
                icon={ImageIcon}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* --- TAB 1: THÔNG TIN --- */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="room_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-sm">
                              Số phòng
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="101..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-sm">
                              Trạng thái
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn trạng thái" />
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="building_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-sm">
                              Tòa nhà
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn tòa nhà" />
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
                          <FormItem>
                            <FormLabel className="font-semibold text-sm">
                              Loại phòng
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn loại phòng" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="STUDIO">Studio</SelectItem>
                                <SelectItem value="1BED">1 Ngủ</SelectItem>
                                <SelectItem value="2BED">2 Ngủ</SelectItem>
                                <SelectItem value="DORM">Ký túc xá</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                      <FormField
                        control={form.control}
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
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm">
                            Mô tả
                          </FormLabel>
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
                    <div>
                      <FormLabel className="font-semibold text-sm block mb-3">
                        Tiện ích
                      </FormLabel>
                      <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                        {availableAmenities.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleAmenity(item.id)}
                              className="h-4 w-4 accent-black"
                            />
                            <label className="text-sm font-medium">
                              {item.label}
                            </label>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsUtilityModalOpen(true)}
                          className="flex items-center space-x-2 text-black col-span-1"
                        >
                          <div className="h-4 w-4 border border-black rounded flex items-center justify-center">
                            <Plus size={12} />
                          </div>
                          <span className="text-sm font-medium">
                            Thêm tiện ích
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 2: TIỀN --- */}
                {activeTab === "money" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="base_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">
                              Giá thuê
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deposit_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">
                              Cọc
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="electricity_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">
                              Điện (/kWh)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="water_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">
                              Nước (VNĐ)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Dynamic Extra Costs */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold">Chi phí phụ</h4>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                          <FormField
                            control={form.control}
                            name={`extraCosts.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Tên..." {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`extraCosts.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
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
                      <Button
                        type="button"
                        onClick={() => append({ name: "", price: 0 })}
                        className="w-full bg-gray-900 text-white"
                      >
                        Thêm chi phí
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- TAB 3: ẢNH (ĐÃ UPDATE UI & LOGIC) --- */}
                {activeTab === "images" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Đã chọn {selectedImages.length}/10 ảnh
                        <br />
                        <span className="text-xs text-yellow-600 italic">
                          *Ảnh đầu tiên sẽ là ảnh đại diện
                        </span>
                      </p>

                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-black text-black hover:bg-gray-50 gap-2"
                          onClick={() => fileInputRef.current.click()}
                          disabled={selectedImages.length >= 10}
                        >
                          <Upload size={16} /> Tải ảnh lên
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                        />
                      </div>
                    </div>

                    {selectedImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                        {selectedImages.map((img, index) => (
                          <div
                            key={index}
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                              index === 0 ? "border-yellow-400 ring-2 ring-yellow-100" : "border-gray-200"
                            }`}
                          >
                            {/* Đánh dấu ảnh chính */}
                            {index === 0 && (
                              <div className="absolute top-0 left-0 bg-yellow-400 text-white p-1 rounded-br-lg shadow-sm z-10">
                                <Star size={12} fill="white" />
                              </div>
                            )}

                            <img
                              src={img.preview}
                              alt={`Preview ${index}`}
                              className="w-full h-full object-cover"
                            />
                            
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Ô thêm nhanh */}
                        {selectedImages.length < 10 && (
                          <div
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-400"
                            onClick={() => fileInputRef.current.click()}
                          >
                            <Plus size={24} />
                            <span className="text-xs mt-1">Thêm</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <ImageIcon size={48} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium text-gray-500">
                          Chưa có ảnh nào
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Hỗ trợ JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </div>

          <div className="p-6 pt-4 border-t bg-white flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-black"
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="bg-gray-900 text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Chấp nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AddUtilityModal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        onAddSuccess={handleAddNewAmenity}
      />
    </>
  );
}