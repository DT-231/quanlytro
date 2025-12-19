import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function PaymentConfigSection({ form }) {
  return (
    <div className="p-5 rounded-xl border-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📅 Cấu hình thanh toán
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Ngày đóng tiền
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={31}
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
          name="paymentCycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Chu kỳ thanh toán
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="1">1 Tháng/lần</option>
                  <option value="3">3 Tháng/lần</option>
                  <option value="6">6 Tháng/lần</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Trạng thái
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="PENDING">Chờ ký</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
