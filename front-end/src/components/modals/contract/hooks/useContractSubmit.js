import { useState } from "react";
import { toast } from "sonner";
import { contractService } from "@/services/contractService";
import { validateCCCD, createContractPayload } from "../utils/contractHelpers";

export function useContractSubmit(onAddSuccess, onClose, form, setSelectedTenant, setTempCCCD) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values, selectedTenant, tempCCCD, services) => {
    setIsSubmitting(true);
    try {
      const cccdToUse = selectedTenant?.cccd || tempCCCD;
      const cccdValidation = validateCCCD(cccdToUse);
      
      if (!cccdValidation.valid) {
        toast.error(cccdValidation.message);
        setIsSubmitting(false);
        return;
      }

      const apiPayload = createContractPayload(values, cccdToUse, services);
      const res = await contractService.create(apiPayload);

      if (res && (res.success || res.data || res.id)) {
        const createdContract = res.data || res;
        toast.success(
          `Tạo thành công hợp đồng ${
            createdContract?.contract_number || values.contractCode
          }!`
        );
        if (onAddSuccess) onAddSuccess(createdContract);
        setSelectedTenant(null);
        setTempCCCD("");
        onClose();
        form.reset();
      } else {
        toast.error("Tạo thất bại: " + (res?.message || "Lỗi không xác định"));
      }
    } catch (error) {
      console.error("Submit Error:", error);
      if (error.response?.data?.data?.errors) {
        const errorList = error.response.data.data.errors;
        const errorMsg = errorList
          .map((e) => `${e.field}: ${e.message}`)
          .join("\n");
        toast.error(`Lỗi dữ liệu:\n${errorMsg}`);
      } else if (
        error.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ) {
        const errorMessages = error.response.data.detail
          .map((err) => `${err.loc[1] || err.loc[0]}: ${err.msg}`)
          .join("\n");
        toast.error(`Lỗi dữ liệu:\n${errorMessages}`);
      } else {
        const msg =
          error.response?.data?.message || "Có lỗi xảy ra khi kết nối server.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
}
