import React, { useState } from "react";
import { Info, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

// Hooks & Components
import { useTenantImages } from "./hooks/useTenantImages";
import { useTenantForm } from "./hooks/useTenantForm";
import { useTenantSubmit } from "./hooks/useTenantSubmit";
import TenantInfoTab from "./components/TenantInfoTab";
import TenantImagesTab from "./components/TenantImagesTab";

export default function AddTenantModal({ isOpen, onClose, onAddSuccess, tenantToEdit }) {
  const [activeTab, setActiveTab] = useState("info");
  const isEditMode = !!tenantToEdit;

  const images = useTenantImages();

  const { form, isLoadingDetail } = useTenantForm(
    isOpen, 
    tenantToEdit, 
    images.setFrontImage, 
    images.setBackImage
  );

  const { isSubmitting, submitTenant, defaultPassword } = useTenantSubmit(onClose, onAddSuccess);

  const onSubmit = (values) => {
    submitTenant(values, tenantToEdit, images.frontImage, images.backImage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white text-black">
        {isLoadingDetail && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        )}
        
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isEditMode ? "Cập nhật thông tin" : "Thêm khách thuê"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Cập nhật thông tin cá nhân." : "Tạo tài khoản khách thuê mới."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6">
          <TabButton 
            active={activeTab === "info"} 
            onClick={() => setActiveTab("info")} 
            icon={<Info size={16} />} 
            label="Thông tin" 
          />
          <TabButton 
            active={activeTab === "images"} 
            onClick={() => setActiveTab("images")} 
            icon={<ImageIcon size={16} />} 
            label="Ảnh CCCD" 
          />
        </div>

        <div className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {activeTab === "info" && <TenantInfoTab form={form} isEditMode={isEditMode} />}
              
              {activeTab === "images" && <TenantImagesTab {...images} />}

              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="text-xs text-gray-500 italic">
                  {!isEditMode && (
                    <span>*Mật khẩu mặc định: <span className="font-mono font-bold text-gray-700">{defaultPassword}</span></span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9">
                    Huỷ
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-gray-800 h-9 min-w-[120px]">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {isSubmitting ? "Đang xử lý..." : isEditMode ? "Lưu thay đổi" : "Tạo tài khoản"}
                  </Button>
                </div>
              </div>

            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component nhỏ cho Tab Button
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${
        active ? "border-black text-black" : "border-transparent text-gray-500"
      }`}
    >
      {icon} {label}
    </button>
  );
}