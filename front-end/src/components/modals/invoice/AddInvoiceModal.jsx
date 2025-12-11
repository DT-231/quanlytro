import React, { useState, useEffect } from "react";
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
  // Tab 1: Thông tin
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc"),
  room: z.string().min(1, "Phòng là bắt buộc"),
  building: z.string().optional(),
  status: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),

  // Tab 2: Điện
  elecOld: z.coerce.number().min(0),
  elecNew: z.coerce.number().min(0),
  elecUsed: z.coerce.number(),

  // Tab 3: Nước
  waterOld: z.coerce.number().min(0),
  waterNew: z.coerce.number().min(0),
  waterUsed: z.coerce.number(),

  // Tab 4: Dịch vụ (Mảng động)
  services: z.array(
    z.object({
      name: z.string().min(1, "Tên dịch vụ"),
      price: z.coerce.number().min(0),
    })
  ),
});

export default function AddInvoiceModal({ isOpen, onClose, onAddSuccess }) {
  const [activeTab, setActiveTab] = useState("info");

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      room: "",
      building: "",
      status: "Chưa thanh toán",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      totalAmount: 0,
      paidAmount: 0,
      elecOld: 0,
      elecNew: 0,
      elecUsed: 0,
      waterOld: 0,
      waterNew: 0,
      waterUsed: 0,
      services: [
        { name: "Tiền rác", price: 0 },
        { name: "Tiền giữ xe", price: 0 },
      ],
    },
  });

  // Quản lý mảng dịch vụ
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  // --- LOGIC TỰ TÍNH TOÁN ---
  const [elecOld, elecNew, waterOld, waterNew] = form.watch([
    "elecOld",
    "elecNew",
    "waterOld",
    "waterNew",
  ]);

  useEffect(() => {
    const used = Math.max(0, elecNew - elecOld);
    form.setValue("elecUsed", used);
  }, [elecOld, elecNew, form]);

  useEffect(() => {
    const used = Math.max(0, waterNew - waterOld);
    form.setValue("waterUsed", used);
  }, [waterOld, waterNew, form]);

  const onSubmit = (values) => {
    console.log("Invoice Data:", values);
    if (onAddSuccess) onAddSuccess(values);
    onClose();
    form.reset();
    setActiveTab("info");
  };

  // Helper render Tabs
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md
        ${
          activeTab === id
            ? "bg-white text-black shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-black max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">Thêm hóa đơn</DialogTitle>
        </DialogHeader>

        {/* TABS HEADER */}
        <div className="px-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <TabButton id="info" label="Thông tin" icon={Info} />
            <TabButton id="electric" label="Điện" icon={Zap} />
            <TabButton id="water" label="Nước" icon={Droplets} />
            <TabButton id="service" label="Dịch vụ" icon={Wrench} />
          </div>
        </div>

        <div className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* --- TAB 1: THÔNG TIN --- */}
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên khách hàng</FormLabel>
                        <FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Chưa thanh toán">Chưa thanh toán</SelectItem>
                            <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
                            <SelectItem value="Đang xử lý">Đang xử lý</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng</FormLabel>
                        <FormControl><Input placeholder="P.101" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tòa nhà</FormLabel>
                        <FormControl><Input placeholder="Tên tòa nhà" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày xuất hóa đơn</FormLabel>
                        <FormControl><Input type="date" {...field} className="block w-full" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hạn thanh toán</FormLabel>
                        <FormControl><Input type="date" {...field} className="block w-full" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tổng tiền</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đã thanh toán (VNĐ)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- TAB 2: ĐIỆN --- */}
              {activeTab === "electric" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="elecOld"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số điện cũ</FormLabel>
                          <div className="relative">
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">kWh</span>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="elecNew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số điện mới</FormLabel>
                          <div className="relative">
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">kWh</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="elecUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chỉ số điện đã sử dụng</FormLabel>
                         <div className="relative">
                            <FormControl><Input type="number" {...field} readOnly className="bg-gray-50" /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">kWh</span>
                          </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- TAB 3: NƯỚC --- */}
              {activeTab === "water" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="waterOld"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số nước cũ (m³)</FormLabel>
                          <div className="relative">
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">m³</span>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="waterNew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chỉ số nước mới (m³)</FormLabel>
                          <div className="relative">
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">m³</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="waterUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chỉ số nước đã sử dụng (m³)</FormLabel>
                         <div className="relative">
                            <FormControl><Input type="number" {...field} readOnly className="bg-gray-50" /></FormControl>
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">m³</span>
                          </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- TAB 4: DỊCH VỤ --- */}
              {activeTab === "service" && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end group">
                        <FormField
                          control={form.control}
                          name={`services.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Tên dịch vụ</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`services.${index}.price`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Số tiền</FormLabel>
                              <div className="relative">
                                <FormControl><Input {...field} type="number" /></FormControl>
                                <span className="absolute right-3 top-2 text-gray-400 text-sm">đ</span>
                              </div>
                            </FormItem>
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mb-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={() => append({ name: "", price: 0 })}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Thêm dịch vụ
                  </Button>
                </div>
              )}

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 border-none">
                  Huỷ
                </Button>
                <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
                  {activeTab === 'service' ? 'Tạo' : 'Thêm'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}