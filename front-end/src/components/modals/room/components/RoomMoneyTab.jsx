// src/components/modals/room/components/RoomMoneyTab.jsx
import React from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function RoomMoneyTab({ fields, append, remove }) {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Các loại phí cơ bản */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="base_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Giá thuê</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="deposit_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Tiền cọc</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="electricity_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Điện (/kWh)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="water_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Nước (VNĐ)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Chi phí phụ (Dynamic Form) */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold">Chi phí phụ</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-end">
            <FormField
              control={control}
              name={`extraCosts.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Tên phí..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
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
              className="mb-2 p-2 text-gray-400 hover:text-red-500 transition"
            >
              <X size={18} />
            </button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() => append({ name: "", price: 0 })}
          className="w-full bg-gray-900 text-white hover:bg-gray-800"
        >
          Thêm chi phí
        </Button>
      </div>
    </div>
  );
}