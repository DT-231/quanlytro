import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { contractFormSchema, getDefaultFormValues } from "./schema/contractSchema";
import { generateContractCode, calculateEndDate } from "./utils/contractHelpers";
import { useContractData } from "./hooks/useContractData";
import { useRoomSearch } from "./hooks/useRoomSearch";
import { useTenantSearch } from "./hooks/useTenantSearch";
import { useContractSubmit } from "./hooks/useContractSubmit";

import ContractInfoSection from "./components/ContractInfoSection";
import LandlordInfoSection from "./components/LandlordInfoSection";
import TenantInfoSection from "./components/TenantInfoSection";
import DurationSection from "./components/DurationSection";
import FinancialInfoSection from "./components/FinancialInfoSection";
import PaymentConfigSection from "./components/PaymentConfigSection";
import ServiceManager from "./components/ServiceManager";
import TermsSection from "./components/TermsSection";

const landlordInfo = {
  name: "Nguyễn Văn A",
  cccd: "001234567890",
  address: "123 Đường ABC, Quận XYZ, TP.HCM",
  phone: "0901234567",
};

export default function AddContractModal({ isOpen, onClose, onAddSuccess }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tempCCCD, setTempCCCD] = useState("");
  const [services, setServices] = useState([
    { id: 1, name: "Phí rác", amount: 20000, description: "Phí thu gớm rác hàng tháng" },
    { id: 2, name: "Phí giữ xe", amount: 50000, description: "Phí giữ xe máy" },
  ]);
  const [newService, setNewService] = useState({ name: "", amount: 0, description: "" });

  const form = useForm({
    resolver: zodResolver(contractFormSchema),
    defaultValues: getDefaultFormValues(),
  });

  const { rooms, tenants, loadingData } = useContractData(isOpen);
  const { roomQuery, setRoomQuery, searchResults, setSearchResults } = useRoomSearch(rooms);
  const { tenantQuery, setTenantQuery, tenantSearchResults, setTenantSearchResults } = useTenantSearch(tenants);
  const { isSubmitting, handleSubmit } = useContractSubmit(onAddSuccess, onClose, form, setSelectedTenant, setTempCCCD);

  useEffect(() => {
    if (isOpen) {
      const nextCode = generateContractCode();
      form.setValue("contractCode", nextCode);
    }
  }, [isOpen, form]);

  useEffect(() => {
    setSearchResults(rooms);
  }, [rooms, setSearchResults]);

  useEffect(() => {
    setTenantSearchResults(tenants);
  }, [tenants, setTenantSearchResults]);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    if (room) {
      form.setValue("roomId", room.id);
      const price = room.rental_price || room.price || room.base_price || 0;
      form.setValue("rentPrice", price);
      form.setValue("deposit", price);
    } else {
      form.setValue("roomId", "");
    }
  };

 const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant);
    if (tenant) {
      form.setValue("tenantId", tenant.id);
      setTempCCCD(tenant.cccd || ""); 
    } else {
      form.setValue("tenantId", "");
      setTempCCCD("");
    }
};

  const handleDurationClick = (months) => {
    const start = form.getValues("startDate");
    const endDate = calculateEndDate(start, months);
    if (endDate) {
      form.setValue("endDate", endDate);
    }
  };

  const handleAddService = () => {
    if (!newService.name.trim()) return;
    setServices([
      ...services,
      {
        id: Date.now(),
        name: newService.name.trim(),
        amount: newService.amount || 0,
        description: newService.description || "",
      },
    ]);
    setNewService({ name: "", amount: 0, description: "" });
  };

  const handleRemoveService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const onSubmit = (values) => {
    handleSubmit(values, selectedTenant, tempCCCD, services);
  };

  const handleClose = () => {
    setSelectedTenant(null);
    setTempCCCD("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] bg-white max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Thêm hợp đồng mới
              {loadingData && (
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <ContractInfoSection
                    form={form}
                    selectedRoom={selectedRoom}
                    onRoomSelect={handleRoomSelect}
                    roomSearchResults={searchResults}
                    roomQuery={roomQuery}
                    onRoomQueryChange={setRoomQuery}
                  />

                  <LandlordInfoSection landlordInfo={landlordInfo} />

                  <TenantInfoSection
                    form={form}
                    selectedTenant={selectedTenant}
                    onTenantSelect={handleTenantSelect}
                    tenantSearchResults={tenantSearchResults}
                    tenantQuery={tenantQuery}
                    onTenantQueryChange={setTenantQuery}
                    tempCCCD={tempCCCD}
                    onTempCCCDChange={setTempCCCD}
                  />
                </div>

                <div className="space-y-6">
                  <DurationSection form={form} onDurationClick={handleDurationClick} />
                  <FinancialInfoSection form={form} />
                  <PaymentConfigSection form={form} />
                </div>
              </div>

              <ServiceManager
                services={services}
                newService={newService}
                onAddService={handleAddService}
                onRemoveService={handleRemoveService}
                onNewServiceChange={setNewService}
              />

              <TermsSection form={form} />
            </form>
          </Form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Đóng
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            {isSubmitting ? "Đang xử lý..." : "Tạo hợp đồng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
