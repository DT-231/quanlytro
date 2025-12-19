import * as z from "zod";

export const contractFormSchema = z.object({
  tenantId: z.string().min(1, "Vui lòng chọn khách hàng"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  contractCode: z.string().min(1, "Mã hợp đồng là bắt buộc"),
  startDate: z.string().min(1, "Chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Chọn ngày kết thúc"),
  rentPrice: z.coerce.number().min(0, "Giá thuê không được âm"),
  deposit: z.coerce.number().min(0, "Tiền cọc không được âm"),
  paymentDate: z.coerce.number().min(1).max(31, "Ngày không hợp lệ"),
  paymentCycle: z.string(),
  electricityPrice: z.coerce.number().min(0),
  waterPrice: z.coerce.number().min(0),
  status: z.string(),
  terms: z.string().optional(),
});

export const getDefaultFormValues = () => ({
  tenantId: "",
  roomId: "",
  contractCode: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  rentPrice: 0,
  deposit: 0,
  paymentDate: 15,
  paymentCycle: "1",
  electricityPrice: 3500,
  waterPrice: 15000,
  status: "ACTIVE",
  terms: "Bên thuê có trách nhiệm bảo quản tài sản và thanh toán đúng hạn.",
});
