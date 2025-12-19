import React from "react";
import { FaFileContract } from "react-icons/fa";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import RoomCombobox from "./RoomCombobox";

export default function ContractInfoSection({ 
  form, 
  selectedRoom, 
  onRoomSelect, 
  roomSearchResults, 
  roomQuery, 
  onRoomQueryChange 
}) {
  return (
    <div className="p-5 rounded-xl border-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaFileContract className="text-blue-600" />
        Thông tin hợp đồng
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="contractCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Mã hợp đồng
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="HD..."
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="font-semibold text-gray-700">
                Phòng (Trống)
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <RoomCombobox
                    selectedRoom={selectedRoom}
                    onSelect={(room) => {
                      onRoomSelect(room);
                      field.onChange(room?.id || '');
                    }}
                    searchResults={roomSearchResults}
                    query={roomQuery}
                    onQueryChange={onRoomQueryChange}
                    onClose={() => onRoomQueryChange('')}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
