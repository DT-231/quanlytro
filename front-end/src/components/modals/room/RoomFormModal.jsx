// src/components/modals/room/RoomFormModal.jsx
import React, { useState } from "react";
import { Info, DollarSign, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRoomForm } from "./hooks/useRoomForm";
import RoomInfoTab from "./components/RoomInfoTab";
import RoomMoneyTab from "./components/RoomMoneyTab";
import RoomImagesTab from "./components/RoomImagesTab";
import AddUtilityModal from "@/components/modals/utility/AddUtilityModal";

export default function RoomFormModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    initialData = null 
}) {
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);

  const {
    form,
    activeTab,
    setActiveTab,
    buildings,
    roomTypes,
    isSubmitting,
    selectedImages,
    availableAmenities,
    fileInputRef,
    fields,
    append,
    remove,
    handleFileSelect,
    removeImage,
    toggleAmenity,
    handleAddNewAmenity,
    onSubmit,
  } = useRoomForm({ isOpen, onClose, onSuccess, initialData });

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md
        ${
          activeTab === id
            ? "bg-white text-black shadow-sm font-bold"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
        }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white text-black max-h-[90vh] flex flex-col">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {initialData ? "Cập nhật thông tin phòng" : "Thêm phòng mới"}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 mb-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <TabButton id="info" label="Thông tin" icon={Info} />
              <TabButton id="money" label="Tiền & Phí" icon={DollarSign} />
              <TabButton
                id="images"
                label={`Ảnh (${selectedImages.length})`}
                icon={ImageIcon}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                {activeTab === "info" && (
                  <RoomInfoTab
                    buildings={buildings}
                    roomTypes={roomTypes}
                    availableAmenities={availableAmenities}
                    toggleAmenity={toggleAmenity}
                    onOpenUtilityModal={() => setIsUtilityModalOpen(true)}
                  />
                )}
                {activeTab === "money" && (
                  <RoomMoneyTab fields={fields} append={append} remove={remove} />
                )}
                {activeTab === "images" && (
                  <RoomImagesTab
                    selectedImages={selectedImages}
                    fileInputRef={fileInputRef}
                    handleFileSelect={handleFileSelect}
                    removeImage={removeImage}
                  />
                )}
              </form>
            </Form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-4 border-t bg-white flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-black"
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              className="bg-gray-900 text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : (initialData ? "Lưu thay đổi" : "Thêm mới")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddUtilityModal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        onAddSuccess={handleAddNewAmenity}
      />
    </>
  );
}