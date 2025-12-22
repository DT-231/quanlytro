import * as z from "zod";

export const tenantSchema = z.object({
  lastName: z.string().min(1, "Họ không được để trống"),
  firstName: z.string().min(1, "Tên không được để trống"),
  phone: z.string()
    .min(10, "Số điện thoại phải có đủ 10 số")
    .max(10, "Số điện thoại không được quá 10 số")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa số"),
  email: z.string().email("Email không hợp lệ"),
  dob: z.string().min(1, "Vui lòng chọn ngày sinh").refine((dateString) => {
      if (!dateString) return false;
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 16;
    }, { message: "Khách thuê phải đủ 16 tuổi" }),
  cccd: z.string()
    .min(9, "CCCD tối thiểu 9 số")
    .max(12, "CCCD tối đa 12 số")
    .regex(/^[0-9]+$/, "CCCD chỉ được chứa số"),
  gender: z.string().optional(),
  hometown: z.string().optional(),
});