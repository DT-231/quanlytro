import React from "react";
import { Upload, X } from "lucide-react";

export default function TenantImagesTab({ 
  frontImage, backImage, 
  frontInputRef, backInputRef, 
  handleImageChange, removeImage 
}) {
  const ImageBox = ({ type, image, inputRef, label }) => (
    <div 
      className="relative border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer group"
      onClick={() => inputRef.current.click()}
    >
      <input 
        type="file" accept="image/*" className="hidden" 
        ref={inputRef} onChange={(e) => handleImageChange(e, type)} 
      />
      {image ? (
        <>
          <img src={image.preview} alt={label} className="h-full w-full object-contain rounded-lg p-1" />
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); removeImage(type); }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div className="text-center p-4">
          <Upload className="text-gray-400 mx-auto mb-2" size={20} />
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <ImageBox type="front" image={frontImage} inputRef={frontInputRef} label="Mặt trước" />
        <ImageBox type="back" image={backImage} inputRef={backInputRef} label="Mặt sau" />
      </div>
    </div>
  );
}