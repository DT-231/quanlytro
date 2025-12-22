import React from "react";
import { Upload, Star, X, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoomImagesTab({
  selectedImages,
  fileInputRef,
  handleFileSelect,
  removeImage,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Đã chọn {selectedImages.length}/10 ảnh
          <br />
          <span className="text-xs text-yellow-600 italic">
            *Ảnh đầu tiên sẽ là ảnh đại diện
          </span>
        </p>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="border-black text-black hover:bg-gray-50 gap-2"
            onClick={() => fileInputRef.current.click()}
            disabled={selectedImages.length >= 10}
          >
            <Upload size={16} /> Tải ảnh lên
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {selectedImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
          {selectedImages.map((img, index) => (
            <div
              key={index}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                index === 0
                  ? "border-yellow-400 ring-2 ring-yellow-100"
                  : "border-gray-200"
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 left-0 bg-yellow-400 text-white p-1 rounded-br-lg shadow-sm z-10">
                  <Star size={12} fill="white" />
                </div>
              )}
              <img
                src={img.preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {selectedImages.length < 10 && (
            <div
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-400"
              onClick={() => fileInputRef.current.click()}
            >
              <Plus size={24} />
              <span className="text-xs mt-1">Thêm</span>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <ImageIcon size={48} className="mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">Chưa có ảnh nào</p>
          <p className="text-xs text-gray-400 mt-1">
            Hỗ trợ JPG, PNG (Max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}