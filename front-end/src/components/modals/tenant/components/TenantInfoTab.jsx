import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import AddressSelector from "../../AddressSelector";

export default function TenantInfoTab({ form, isEditMode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* --- HỌ VÀ ĐỆM --- */}
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">Họ & Đệm</FormLabel>
            <FormControl>
              <Input placeholder="Last name" {...field} className="h-9" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- TÊN --- */}
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">Tên</FormLabel>
            <FormControl>
              <Input placeholder="First name" {...field} className="h-9" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">Email</FormLabel>
            <FormControl>
              <Input
                disabled={isEditMode}
                placeholder="m@example.com"
                {...field}
                className="h-9"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">
              Số điện thoại
            </FormLabel>
            <FormControl>
              <Input {...field} className="h-9" 
              maxLength={10}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- CCCD --- */}
      <FormField
        control={form.control}
        name="cccd"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">
              Số CCCD/CMND
            </FormLabel>
            <FormControl>
              <Input {...field} className="h-9"
              maxLength={12} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="dob"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">
              Ngày sinh <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                className="h-9 block w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- GIỚI TÍNH --- */}
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs font-semibold">Giới tính</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Nam">Nam</SelectItem>
                <SelectItem value="Nữ">Nữ</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- QUÊ QUÁN --- */}
     <FormField
  control={form.control}
  name="hometown"
  render={({ field }) => (
    <FormItem className="col-span-1">
      <FormControl>
        <AddressSelector 
            showWard={false}
            city={field.value} 
            onCityChange={field.onChange} 
            cityLabel="Quê quán"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
    </div>
  );
}