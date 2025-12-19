import React from "react";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

export default function RoomCombobox({ 
  selectedRoom, 
  onSelect, 
  searchResults, 
  query, 
  onQueryChange,
  onClose 
}) {
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
                'w-full rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                !selectedRoom && 'text-gray-400'
              )}
              displayValue={(room) => room ? `Phòng ${room.room_number}` : ''}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Chọn phòng"
            />
            <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
              <ChevronDownIcon className="size-5 fill-gray-400 group-hover:fill-gray-600" />
            </ComboboxButton>
          </div>

          {open && (
            <ComboboxOptions
              static
              className={clsx(
                'absolute z-10 mt-1 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-lg p-1',
                'max-h-60 overflow-auto'
              )}
            >
              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {query ? 'Không tìm thấy phòng phù hợp.' : 'Hết phòng trống.'}
                </div>
              ) : (
                searchResults.map((room) => (
                  <ComboboxOption
                    key={room.id}
                    value={room}
                    className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 select-none data-[focus]:bg-blue-50 hover:bg-gray-50"
                  >
                    <CheckIcon className="invisible size-4 fill-blue-600 group-data-[selected]:visible" />
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        Phòng {room.room_number}
                      </span>
                      {room.building_name && (
                        <span className="text-xs text-gray-500">
                          {room.building_name}
                        </span>
                      )}
                    </div>
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          )}
        </>
      )}
    </Combobox>
  );
}
