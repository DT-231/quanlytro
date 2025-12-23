import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoomTypeList from "./components/RoomTypeList";
import RoomTypeForm from "./components/RoomTypeForm";
export default function RoomTypeManagerModal({ isOpen, onClose }) {
  const [view, setView] = useState("LIST");
  const [selectedType, setSelectedType] = useState(null); 

  useEffect(() => {
    if (isOpen) {
      setView("LIST");
      setSelectedType(null);
    }
  }, [isOpen]);


  const handleSwitchToCreate = () => {
    setSelectedType(null);
    setView("FORM");
  };


  const handleSwitchToEdit = (type) => {
    setSelectedType(type);
    setView("FORM");
  };

  const handleBackToList = () => {
    setView("LIST");
    setSelectedType(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white text-black p-0 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <DialogTitle className="text-lg font-bold">
            {view === "LIST" 
              ? "Quản lý Loại Phòng" 
              : (selectedType ? "Sửa Loại Phòng" : "Thêm Loại Phòng")}
          </DialogTitle>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          {view === "LIST" ? (
            <RoomTypeList 
              onCreate={handleSwitchToCreate}
              onEdit={handleSwitchToEdit}
            />
          ) : (
            <RoomTypeForm 
              initialData={selectedType}
              onCancel={handleBackToList}
              onSuccess={handleBackToList}
            />
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}