import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

export default function TermsSection({ form }) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-xl border-2 border-gray-200">
      <FormField
        control={form.control}
        name="terms"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-bold text-gray-800 mb-2 block">
              📋 Điều khoản đặc biệt & Ghi chú
            </FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="w-full border-2 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                placeholder="Nhập điều khoản bổ sung..."
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
