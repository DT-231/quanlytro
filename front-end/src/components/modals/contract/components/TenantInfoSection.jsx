import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import TenantCombobox from "./TenantCombobox";

export default function TenantInfoSection({ 
  form, 
  selectedTenant, 
  onTenantSelect, 
  tenantSearchResults, 
  tenantQuery, 
  onTenantQueryChange,
  tempCCCD,
  onTempCCCDChange
}) {
  return (
    <div className="p-5 rounded-xl border-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
          B
        </div>
        Bên B - Người thuê (Bên nhận thuê)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="font-semibold text-gray-700">
                Họ và tên *
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <TenantCombobox
                    selectedTenant={selectedTenant}
                    onSelect={(tenant) => {
                      onTenantSelect(tenant);
                      field.onChange(tenant?.id || '');
                    }}
                    searchResults={tenantSearchResults}
                    query={tenantQuery}
                    onQueryChange={onTenantQueryChange}
                    onClose={() => onTenantQueryChange('')}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="gap-2 flex flex-col">
          <FormLabel className="font-semibold text-gray-700">
            Số CCCD/CMND *
          </FormLabel>

          {selectedTenant?.cccd ? (
            <div className="px-4 py-2.5 bg-white border-2 rounded-lg text-gray-900 font-medium">
              {selectedTenant.cccd}
            </div>
          ) : (
            <Input
              placeholder="Nhập số CCCD/CMND"
              value={tempCCCD}
              onChange={(e) => onTempCCCDChange(e.target.value)}
              className="bg-white border-2"
              maxLength={12}
              disabled={!selectedTenant}
            />
          )}
        </div>
      </div>
    </div>
  );
}
