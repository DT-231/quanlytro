import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantSchema } from "../schema/tenantSchema";
import { userService } from "@/services/userService";
import { toast } from "sonner";

export const useTenantForm = (isOpen, tenantToEdit, setFrontImage, setBackImage) => {
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const form = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      lastName: "", firstName: "", phone: "", email: "",
      dob: "", cccd: "", gender: "Nam", hometown: "",
    },
  });

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (isOpen && tenantToEdit?.id) {
        setIsLoadingDetail(true);
        try {
          const userDetail = await userService.getUserById(tenantToEdit.id);
          const data = userDetail.data || userDetail;

          form.reset({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            phone: data.phone || "",
            email: data.email || "",
            dob: data.date_of_birth ? String(data.date_of_birth).split("T")[0] : "",
            cccd: data.cccd || "",
            gender: data.gender || "Nam",
            hometown: data.address || "",
          });

          if (data.documents && Array.isArray(data.documents)) {
            const front = data.documents.find((d) => d.type === "CCCD_FRONT");
            const back = data.documents.find((d) => d.type === "CCCD_BACK");
            if (front) setFrontImage({ preview: front.url, file: null, isExisting: true });
            if (back) setBackImage({ preview: back.url, file: null, isExisting: true });
          }
        } catch (error) {
          toast.error("Không tải được thông tin chi tiết");
          console.error(error);
        } finally {
          setIsLoadingDetail(false);
        }
      } else if (isOpen && !tenantToEdit) {
        form.reset({
          lastName: "", firstName: "", phone: "", email: "",
          dob: "", cccd: "", gender: "Nam", hometown: "",
        });
        setFrontImage(null);
        setBackImage(null);
      }
    };

    fetchUserDetail();
  }, [isOpen, tenantToEdit, form, setFrontImage, setBackImage]);

  return { form, isLoadingDetail };
};