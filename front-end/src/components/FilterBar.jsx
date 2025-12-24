// src/components/ui/FilterBar.jsx
import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import GenericCombobox from "@/components/GenericCombobox";
import { FiFilter } from "react-icons/fi";

export default function FilterBar({
  onSearchChange,
  searchValue,
  searchPlaceholder = "Tìm kiếm...",

  filters = [],
  onFilterChange, 
  onClear, 
}) {
  const hasActiveFilters = searchValue || filters.some((f) => f.value);
  // Nếu có nhiều hơn 3 filter thì chuyển sang layout dọc
  const hasMultipleFilters = filters.length > 3;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Tìm kiếm và lọc</h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            <FaTimes /> Xóa bộ lọc
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-3 ${hasMultipleFilters ? '' : 'lg:flex-row lg:justify-between lg:items-center'}`}>
        {/* Search Input */}
        <div className={`relative flex items-center gap-2 ${hasMultipleFilters ? 'w-full' : 'w-full lg:w-1/2'}`}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 h-10 transition-all"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gray-900 text-white h-10 px-6 hover:bg-gray-800 transition-all shrink-0"
            onClick={() => {}} 
          >
            Tìm
          </Button>
        </div>

        {/* Filter Options */}
        <div className={`grid gap-2 w-full ${
          hasMultipleFilters 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
            : 'grid-cols-1 sm:grid-cols-2 lg:flex lg:w-auto lg:justify-end'
        }`}>
          {filters.map((filter, index) => (
            <div key={filter.key || index} className={hasMultipleFilters ? 'w-full' : 'w-full lg:w-44'}>
              {filter.type === 'combobox' ? (
                <GenericCombobox
                  value={filter.value}
                  options={filter.options}
                  onChange={(val) => onFilterChange(filter.key, val)}
                  placeholder={filter.placeholder}
                />
              ) : (
                <div className="relative">
                    <select
                        className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 h-10 transition-all"
                        value={filter.value}
                        onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    >
                        <option value="">{filter.placeholder}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.id || opt.value} value={opt.id || opt.value}>
                                {opt.name || opt.label}
                            </option>
                        ))}
                    </select>
                    <FiFilter className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}