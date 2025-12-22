import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import AddUtilityModal from "../utility/AddUtilityModal";
import AddressSelector from "../AddressSelector";

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

// Schema validation
const buildingSchema = z.object({
  name: z.string().min(1, "Tên toà nhà là bắt buộc"),
  houseNumber: z.string().min(1, "Số nhà là bắt buộc"),
  street: z.string().min(1, "Tên đường là bắt buộc"),
  ward: z.string().min(1, "Phường/Xã là bắt buộc"),
  city: z.string().min(1, "Thành phố là bắt buộc"),
  description: z.string().optional(),
});

export default function AddBuildingModal({ isOpen, onClose, onAddSuccess }) {
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);

  const [utilities, setUtilities] = useState([
    { id: "pool", label: "Hồ bơi", checked: false },
    { id: "elevator", label: "Thang máy", checked: false },
    { id: "camera", label: "Camera", checked: false },
    { id: "security", label: "Bảo vệ", checked: false },
    { id: "parking", label: "Giữ xe", checked: false },
    { id: "gym", label: "Gym", checked: false },
  ]);

  const form = useForm({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      houseNumber: "",
      street: "",
      ward: "",
      city: "",
      description: "",
    },
  });

  const toggleUtility = (id) => {
    setUtilities((prev) =>
      prev.map((u) => (u.id === id ? { ...u, checked: !u.checked } : u))
    );
  };

  const handleAddNewUtility = (name) => {
    const newId = name.toLowerCase().replace(/\s+/g, "-");
    setUtilities([...utilities, { id: newId, label: name, checked: true }]);
  };

  const onSubmit = (values) => {
    // 1. Xử lý tiện ích (Gộp vào description vì API chưa có trường riêng)
    const selectedUtils = utilities.filter((u) => u.checked);
    const utilitiesString = selectedUtils.map((u) => u.label).join(", ");

    let finalDescription = values.description || "";
    if (utilitiesString) {
      finalDescription += `\n[Tiện ích: ${utilitiesString}]`;
    }

    // 2. Xử lý địa chỉ
    const addressLine = `${values.houseNumber} ${values.street}`;
    const fullAddress = `${addressLine}, ${values.ward}, ${values.city}`;

    // 3. Tạo mã tòa nhà tự động (Backend yêu cầu bắt buộc)
    // Ví dụ: BLD-171513... (dùng timestamp để đảm bảo duy nhất)
    const autoCode = `BLD-${Date.now().toString().slice(-6)}`;

    // 4. Tạo payload đúng chuẩn Swagger API (Quan trọng nhất để fix lỗi 422)
    const apiPayload = {
      building_code: autoCode,
      building_name: values.name, // Map 'name' -> 'building_name'
      description: finalDescription.trim(),
      status: "ACTIVE", // Bắt buộc phải là "ACTIVE" (viết hoa), không phải "Hoạt động"
      address_id: null, // null để Backend tự tạo địa chỉ mới
      address: {
        // Object address lồng nhau
        address_line: addressLine,
        ward: values.ward,
        city: values.city,
        country: "Vietnam",
        full_address: fullAddress,
      },
    };

    console.log("Dữ liệu gửi đi (Đã sửa):", apiPayload);

    if (onAddSuccess) onAddSuccess(apiPayload);

    // Reset form
    onClose();
    form.reset();
    setUtilities(utilities.map((u) => ({ ...u, checked: false })));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white text-black max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">
              Thêm tòa nhà mới
            </DialogTitle>
            {/* Thêm DialogDescription và ẩn đi để fix Warning vàng */}
            <DialogDescription className="hidden">
              Điền thông tin để tạo mới tòa nhà vào hệ thống
            </DialogDescription>
          </DialogHeader>

          {/* FORM */}
          <div className="p-6 pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Tên toà nhà */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên toà nhà mới</FormLabel>
                      <FormControl>
                        <Input placeholder="Tên toà nhà mới" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Số nhà & Đường */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số nhà</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đường</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phường & Thành Phố */}
                <div className="mt-2">
                  <AddressSelector
                    showWard={true} 
                    city={form.watch("city")}
                    ward={form.watch("ward")}
                    onCityChange={(val) =>
                      form.setValue("city", val, { shouldValidate: true })
                    }
                    onWardChange={(val) =>
                      form.setValue("ward", val, { shouldValidate: true })
                    }
                  />
                  
                </div>

                {/* Mô tả */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                          placeholder="Nhập mô tả..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIỆN ÍCH SECTION */}
                <div className="space-y-3">
                  <FormLabel>Tiện ích</FormLabel>
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                    {utilities.map((util) => (
                      <div
                        key={util.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={util.id}
                          checked={util.checked}
                          onChange={() => toggleUtility(util.id)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                        />
                        <label
                          htmlFor={util.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {util.label}
                        </label>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsUtilityModalOpen(true)}
                      className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors col-span-1"
                    >
                      <div className="h-4 w-4 border border-black rounded flex items-center justify-center">
                        <Plus size={12} />
                      </div>
                      <span className="text-sm font-medium leading-none">
                        Thêm tiện ích
                      </span>
                    </button>
                  </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex justify-end gap-2 mt-2 pt-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Huỷ
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Chấp nhận
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Render Modal con */}
      <AddUtilityModal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        onAddSuccess={handleAddNewUtility}
      />
    </>
  );
}
