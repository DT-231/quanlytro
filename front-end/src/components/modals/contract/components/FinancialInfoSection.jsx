import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function FinancialInfoSection({ form }) {
  return (
    <div className="p-5 rounded-xl border-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        💰 Thông tin tài chính
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="rentPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Giá thuê (VNĐ)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deposit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Tiền cọc (VNĐ)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="electricityPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Điện (/kWh)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="waterPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Nước (/Người)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
