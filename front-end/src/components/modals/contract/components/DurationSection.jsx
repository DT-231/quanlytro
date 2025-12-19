import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DurationSection({ form, onDurationClick }) {
  return (
    <div className="p-5 rounded-xl border-2">
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
              onClick={() => onDurationClick(m)}
              className="h-8"
            >
              {m === 12 ? "1 Năm" : `${m} Tháng`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
