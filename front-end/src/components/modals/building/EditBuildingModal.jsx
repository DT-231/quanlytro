import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { FaSave } from "react-icons/fa";

// Import Service
import AddUtilityModal from "../utility/AddUtilityModal";

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

// Schema validation
const buildingSchema = z.object({
  name: z.string().min(1, "Tên toà nhà là bắt buộc"),
  houseNumber: z.string().optional(),
  street: z.string().min(1, "Tên đường là bắt buộc"),
  ward: z.string().optional(),
  city: z.string().min(1, "Thành phố là bắt buộc"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export default function EditBuildingModal({ isOpen, onClose, onUpdateSuccess, buildingData }) {
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [utilities, setUtilities] = useState([
    { id: "pool", label: "Hồ bơi", checked: false },
    { id: "elevator", label: "Thang máy", checked: false },
    { id: "camera", label: "Camera", checked: false },
    { id: "security", label: "Bảo vệ", checked: false },
    { id: "parking", label: "Giữ xe", checked: false },
    { id: "gym", label: "Gym", checked: false },
    { id: "wifi", label: "Wifi", checked: false },
    { id: "air-conditioner", label: "Điều hòa", checked: false },
  ]);

  const form = useForm({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "", houseNumber: "", street: "", ward: "", city: "", description: "", status: "ACTIVE",
    },
  });

  // --- LOGIC ĐỔ DỮ LIỆU ---
  useEffect(() => {
    if (buildingData && isOpen) {
      // 1. Tách địa chỉ để điền vào form
      const fullAddr = buildingData.address_line || "";
      let hNum = "", str = "", wrd = "", cty = "";

      const parts = fullAddr.split(",").map(s => s.trim()).filter(s => s);

      // Loại bỏ "Vietnam" ở cuối nếu có
      if (parts.length > 0 && parts[parts.length - 1].toLowerCase().includes("vietnam")) {
        parts.pop();
      }

      if (parts.length >= 3) {
        cty = parts.pop(); // TP
        wrd = parts.pop(); // Phường
        
        // Tách Số nhà và Đường
        const streetPart = parts.join(", ");
        const firstSpace = streetPart.indexOf(" ");
        if (firstSpace > 0) {
           const possibleNum = streetPart.substring(0, firstSpace);
           if (/\d/.test(possibleNum) && possibleNum.length < 10) {
              hNum = possibleNum;
              str = streetPart.substring(firstSpace + 1);
           } else {
              str = streetPart;
           }
        } else {
           str = streetPart;
        }
      } else if (parts.length === 2) {
        cty = parts.pop();
        str = parts.join(", ");
      } else if (parts.length === 1) {
        str = parts[0];
      }

      if (!str) str = fullAddr; 
      if (!cty) cty = "Đà Nẵng"; 

      // 2. Xử lý tiện ích
      const desc = buildingData.description || "";
      let cleanDescription = desc;
      const match = desc.match(/\[Tiện ích: (.*?)\]/);
      
      const newUtilsState = utilities.map(u => ({...u, checked: false}));
      if (match && match[1]) {
        const existingUtils = match[1].split(",").map(u => u.trim().toLowerCase());
        newUtilsState.forEach(u => {
            if (existingUtils.includes(u.label.toLowerCase())) u.checked = true;
        });
        cleanDescription = desc.replace(match[0], "").trim();
      }
      setUtilities(newUtilsState);

      // 3. Reset form
      let currentStatus = buildingData.status || "ACTIVE";
      if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(currentStatus)) currentStatus = "ACTIVE"; 

      form.reset({
        name: buildingData.building_name || buildingData.name || "",
        houseNumber: hNum,
        street: str,
        ward: wrd,
        city: cty,
        description: cleanDescription,
        status: currentStatus,
      });
    }
  }, [buildingData, isOpen]); 

  const toggleUtility = (id) => {
    setUtilities(prev => prev.map(u => u.id === id ? { ...u, checked: !u.checked } : u));
  };
  
  const handleAddNewUtility = (name) => {
    const newId = name.toLowerCase().replace(/\s+/g, "-");
    setUtilities([...utilities, { id: newId, label: name, checked: true }]);
  };

  // --- HÀM SUBMIT QUAN TRỌNG ---
  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
        // 1. Chuẩn bị tiện ích
        const selectedUtils = utilities.filter(u => u.checked).map(u => u.label).join(", ");
        let finalDescription = values.description || "";
        if (selectedUtils) finalDescription += ` \n[Tiện ích: ${selectedUtils}]`;

        // 2. Chuẩn bị địa chỉ (Address Line = Số nhà + Đường)
        const streetLine = [values.houseNumber, values.street].filter(Boolean).join(" ");
        
        // --- GỌI API CẬP NHẬT ĐỊA CHỈ ---
        // Backend yêu cầu address_id để update
        if (buildingData.address_id) {
            try {
                await addressService.update(buildingData.address_id, {
                    address_line: streetLine, // Backend sẽ dùng cái này
                    ward: values.ward,
                    city: values.city,
                    country: "Vietnam"
                    // Backend tự ghép full_address nên không cần gửi
                });
                console.log("Đã cập nhật địa chỉ");
            } catch (addrError) {
                console.error("Lỗi cập nhật địa chỉ:", addrError);
                // Có thể alert lỗi ở đây nếu muốn chặt chẽ
            }
        }

        // --- GỌI API CẬP NHẬT TÒA NHÀ ---
        // Chuỗi full address để hiển thị ngay trên UI mà không cần reload
        const fullAddressDisplay = [streetLine, values.ward, values.city, "Vietnam"].filter(Boolean).join(", ");

        const buildingPayload = {
          building_code: buildingData.building_code,
          building_name: values.name,
          address_id: buildingData.address_id, // Giữ ID để liên kết
          description: finalDescription.trim(),
          status: values.status,
          
          // Gửi kèm object address (nếu backend building hỗ trợ nhận, nếu không nó sẽ bị ignore)
          address_line: fullAddressDisplay 
        };

        if (onUpdateSuccess && buildingData) {
            await onUpdateSuccess(buildingData.id, buildingPayload);
        }
        
        onClose();
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        alert("Có lỗi xảy ra khi lưu thay đổi.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] p-0 bg-white text-black max-h-[90vh] flex flex-col">
          <div className="p-5 pb-3 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Cập nhật thông tin tòa nhà</DialogTitle>
              <DialogDescription className="hidden">Chỉnh sửa thông tin</DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pt-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-gray-700">Tên toà nhà</FormLabel>
                      <FormControl><Input className="h-9 focus-visible:ring-1 focus-visible:ring-black" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="houseNumber" render={({ field }) => (
                      <FormItem className="col-span-1 space-y-1">
                        <FormLabel className="text-xs font-semibold text-gray-700">Số nhà</FormLabel>
                        <FormControl><Input className="h-9 focus-visible:ring-1 focus-visible:ring-black" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="street" render={({ field }) => (
                      <FormItem className="col-span-2 space-y-1">
                        <FormLabel className="text-xs font-semibold text-gray-700">Tên đường</FormLabel>
                        <FormControl><Input className="h-9 focus-visible:ring-1 focus-visible:ring-black" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="ward" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold text-gray-700">Phường / Xã</FormLabel>
                        <FormControl><Input className="h-9 focus-visible:ring-1 focus-visible:ring-black" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold text-gray-700">Thành phố</FormLabel>
                        <FormControl><Input className="h-9 focus-visible:ring-1 focus-visible:ring-black" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-gray-700">Trạng thái</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger className="h-9 focus:ring-1 focus:ring-black"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                          <SelectItem value="SUSPENDED">Tạm dừng</SelectItem>
                          <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-gray-700">Mô tả (Ngoài tiện ích)</FormLabel>
                      <FormControl><Textarea {...field} className="min-h-[60px] text-sm resize-none focus-visible:ring-1 focus-visible:ring-black" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-1">
                  <FormLabel className="text-xs font-bold text-black mb-2 block">Tiện ích (Đã có)</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {utilities.map((util) => (
                      <div key={util.id} className="flex items-center space-x-2">
                        <input type="checkbox" id={`edit-${util.id}`} checked={util.checked} onChange={() => toggleUtility(util.id)} className="h-4 w-4 accent-black cursor-pointer" />
                        <label htmlFor={`edit-${util.id}`} className="text-xs font-medium cursor-pointer text-gray-700">{util.label}</label>
                      </div>
                    ))}
                    <button type="button" onClick={() => setIsUtilityModalOpen(true)} className="flex items-center space-x-1.5 text-black hover:text-gray-700 col-span-1">
                      <div className="h-3.5 w-3.5 border border-black rounded flex items-center justify-center"><Plus size={10} /></div>
                      <span className="text-xs font-bold leading-none">Thêm tiện ích</span>
                    </button>
                  </div>
                </div>
              </form>
            </Form>
          </div>

          <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="h-9 px-4 text-sm" disabled={isSaving}>Huỷ</Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm flex items-center gap-2" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : <><FaSave size={14} /> Lưu thay đổi</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AddUtilityModal isOpen={isUtilityModalOpen} onClose={() => setIsUtilityModalOpen(false)} onAddSuccess={handleAddNewUtility} />
    </>
  );
}