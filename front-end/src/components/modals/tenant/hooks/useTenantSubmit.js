import { useState } from "react";
import { toast } from "sonner";
import { userService } from "@/services/userService";

export const useTenantSubmit = (onClose, onAddSuccess) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultPassword = `User@1234`;

  const submitTenant = async (values, tenantToEdit, frontImage, backImage) => {
    setIsSubmitting(true);
    let tenantId = tenantToEdit?.id;
    const isEditMode = !!tenantToEdit;

    const commonPayload = {
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.phone,
      cccd: values.cccd,
      date_of_birth: values.dob || null,
      gender: values.gender,
      address: values.hometown,
    };

    try {
      if (isEditMode) {
        await userService.update(tenantToEdit.id, commonPayload);
        toast.success("Cập nhật thông tin thành công!");
      } else {
        const createPayload = {
          ...commonPayload,
          password: defaultPassword,
          is_temporary_residence: false,
          status: "INACTIVE",
        };

        const response = await userService.createTenant(createPayload);
        console.log("🔥 API Response:", response);
        const apiCode = response?.code || response?.data?.code;
        const apiData = response?.data || {};
        const newId = apiData?.id || response?.id;
        if (apiCode == 201 || newId) {
          tenantId = newId;

          toast.success("Tạo tài khoản thành công!", {
            description: `Mật khẩu mặc định: ${defaultPassword}`,
          });
        } else {

          const msg =
            response?.message ||
            response?.data?.message ||
            response?.detail ||
            "Tạo thất bại.";
          throw new Error(msg);
        }
      }

      if ((frontImage || backImage) && tenantId) {
        try {
          if (frontImage?.file)
            await userService.uploadCCCD(tenantId, frontImage.file, "front");
          if (backImage?.file)
            await userService.uploadCCCD(tenantId, backImage.file, "back");

          if (frontImage?.file || backImage?.file) {
            toast.success("Đã cập nhật ảnh CCCD!");
          }
        } catch (uploadError) {
          console.error("Lỗi Upload ảnh:", uploadError);
          toast.warning("Tài khoản đã tạo nhưng lỗi tải ảnh lên.");
        }
      }

      if (onAddSuccess) onAddSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi Submit:", error);

      let errorMessage = "Thao tác thất bại.";
      const resData = error.response?.data || {};

      if (resData.message) errorMessage = resData.message;
      else if (resData.detail)
        errorMessage =
          typeof resData.detail === "string"
            ? resData.detail
            : JSON.stringify(resData.detail);
      else if (error.message) errorMessage = error.message;

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitTenant, defaultPassword };
};
