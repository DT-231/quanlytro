import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input"; 
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function GenericCombobox({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredOptions = options.filter((item) =>
    item.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setOpen(true);

    if (e.target.value === "") {
      onChange("");
    }
  };

  // 4. Xử lý xóa nhanh
  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
    setOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              className="pr-8"
            />

            {/* Icon mũi tên hoặc nút X xóa */}
            <div className="absolute right-2 top-2.5">
              {inputValue ? (
                <X
                  className="h-4 w-4 opacity-50 cursor-pointer hover:opacity-100"
                  onClick={handleClear}
                />
              ) : (
                <ChevronsUpDown className="h-4 w-4 opacity-50 pointer-events-none" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList
              className="max-h-[230px] overflow-y-auto overflow-x-hidden"
              onWheel={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Đang tải dữ liệu...
                </div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
              ) : (
                filteredOptions.map((item) => (
                  <CommandItem
                    key={item.id || item.name}
                    value={item.name}
                    onSelect={() => {
                      onChange(item.name);
                      setInputValue(item.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
