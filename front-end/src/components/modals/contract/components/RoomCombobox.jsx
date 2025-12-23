import React from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export default function RoomCombobox({
  selectedRoom,
  onSelect,
  searchResults,
  query,
  onQueryChange,
  onClose,
}) {
  const getRoomStatus = (room) => {
    const current = room.current_occupants || 0;
    const capacity = room.capacity || 0;

    if (current === 0) {
      return {
        label: "Phòng trống",
        color: "text-green-700 bg-green-50 ring-green-600/20",
      };
    }

    return {
      label: `Đang ở (${current}/${capacity})`,
      color: "text-blue-700 bg-blue-50 ring-blue-700/10",
    };
  };

  return (
    <Combobox
      as="div"
      value={selectedRoom}
      onChange={onSelect}
      onClose={onClose}
    >
      {({ open }) => (
        <>
          <div className="relative">
            <ComboboxInput
              className={clsx(
                "w-full rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                !selectedRoom && "text-gray-400"
              )}
              displayValue={(room) => (room ? `Phòng ${room.room_number}` : "")}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Chọn phòng..."
            />
            <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
              <ChevronDownIcon className="size-5 fill-gray-400 group-hover:fill-gray-600" />
            </ComboboxButton>
          </div>

          {open && (
            <ComboboxOptions
              static
              className={clsx(
                "absolute z-10 mt-1 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-lg p-1",
                "max-h-60 overflow-auto focus:outline-none"
              )}
            >
              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {query
                    ? "Không tìm thấy phòng phù hợp."
                    : "Đang tải danh sách..."}
                </div>
              ) : (
                searchResults.map((room) => {
                  const status = getRoomStatus(room);

                  return (
                    <ComboboxOption
                      key={room.id}
                      value={room}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 select-none data-[focus]:bg-blue-50 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-center w-5">
                        <CheckIcon className="invisible size-4 fill-blue-600 group-data-[selected]:visible" />
                      </div>

                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            Phòng {room.room_number}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mt-0.5">
                          {room.building_name}
                        </div>
                      </div>
                    </ComboboxOption>
                  );
                })
              )}
            </ComboboxOptions>
          )}
        </>
      )}
    </Combobox>
  );
}
