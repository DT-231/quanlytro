import * as z from "zod";

export const roomSchema = z.object({
  // Tab 1: Thông tin
  room_number: z.string().min(1, "Số phòng không được để trống"),
  room_name: z.string().min(1, "Tên phòng không được để trống"),
  status: z.string().default("AVAILABLE"),
  building_id: z.string().min(1, "Vui lòng chọn tòa nhà"),
  room_type_id: z.string().min(1, "Vui lòng chọn loại phòng"),
  area: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập diện tích" })
    .min(0, "Diện tích không hợp lệ"),
  capacity: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập số người" })
    .min(1, "Tối thiểu 1 người"),
  description: z.string().optional(),

  // Tab 2: Tiền
  base_price: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá thuê" })
    .min(0, "Giá thuê không được âm"),
  deposit_amount: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập tiền cọc" })
    .min(0, "Tiền cọc không được âm"),
  electricity_cost: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá điện" })
    .min(0, "Giá điện không được âm"),
  water_cost: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá nước" })
    .min(0, "Giá nước không được âm"),
    
  // Chi phí phụ
  extraCosts: z.array(
    z.object({
      name: z.string().min(1, "Tên phí"),
      price: z.coerce.number().min(0, "Giá không được âm"),
    })
  ),
});