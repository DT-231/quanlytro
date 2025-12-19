import React from "react";
import { X, Plus } from "lucide-react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ServiceManager({ 
  services, 
  newService, 
  onAddService, 
  onRemoveService, 
  onNewServiceChange 
}) {
  const handleAddClick = () => {
    if (!newService.name.trim()) return;
    onAddService();
  };

  return (
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
              onClick={() => onRemoveService(s.id)}
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
            onNewServiceChange({ ...newService, name: e.target.value })
          }
          className="bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddClick();
            }
          }}
        />
        <Input
          type="number"
          placeholder="Số tiền (VNĐ)"
          value={newService.amount || ""}
          onChange={(e) =>
            onNewServiceChange({
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
              onNewServiceChange({
                ...newService,
                description: e.target.value,
              })
            }
            className="bg-white"
          />
          <Button
            type="button"
            onClick={handleAddClick}
            size="icon"
            className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
