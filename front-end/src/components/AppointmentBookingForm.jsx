import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bookAppointment } from "@/services/appointmentService";
import { toast } from "sonner";

/**
 * AppointmentBookingForm - Form đặt lịch xem phòng
 *
 * Component này hiển thị form để người dùng (chưa đăng nhập) đặt lịch xem phòng
 *
 * @param {Object} props
 * @param {string} props.roomId - ID của phòng cần đặt lịch
 * @param {string} props.roomNumber - Số phòng (hiển thị cho user)
 * @param {string} props.buildingName - Tên tòa nhà
 */
export default function AppointmentBookingForm({
  roomId,
  roomNumber,
  buildingName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate
      if (
        !formData.full_name ||
        !formData.phone ||
        !formData.appointment_date ||
        !formData.appointment_time
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
        setIsSubmitting(false);
        return;
      }

      // Combine date and time
      const appointmentDatetime = new Date(
        `${formData.appointment_date}T${formData.appointment_time}`
      );

      // Call API using the service
      const data = await bookAppointment({
        room_id: roomId,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        appointment_datetime: appointmentDatetime.toISOString(),
        notes: formData.notes || null,
      });

      if (data.success) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          appointment_date: "",
          appointment_time: "",
          notes: "",
        });

        toast.success("Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.");

        // Auto close after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
        }, 3000);
      } else {
        throw new Error(data.message || "Có lỗi xảy ra khi đặt lịch");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Không thể đặt lịch. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get min date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Calendar className="mr-2 h-4 w-4" />
          Đặt lịch xem phòng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Đặt lịch xem phòng
          </DialogTitle>
          <DialogDescription className="text-base">
            Phòng {roomNumber} - {buildingName}
            <br />
            Người xem phòng cần cung cấp họ tên, số điện thoại, thời gian mong
            muốn và phòng muốn xem.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold text-green-700">
              Đặt lịch thành công!
            </h3>
            <p className="text-center text-gray-600">
              Chúng tôi đã nhận được yêu cầu của bạn.
              <br />
              Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Họ tên */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Họ và tên <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Số điện thoại <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10,11}"
                className="w-full"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email (không bắt buộc)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            {/* Ngày */}
            <div className="space-y-2">
              <Label htmlFor="appointment_date" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Ngày <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="appointment_date"
                name="appointment_date"
                type="date"
                min={today}
                value={formData.appointment_date}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Giờ */}
            <div className="space-y-2">
              <Label htmlFor="appointment_time" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Giờ <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="appointment_time"
                name="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ghi chú các mong muốn của bạn để (chủ trọ) có thể chuẩn bị trước
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Ghi chú các mong muốn của bạn để (chủ trọ) có thể chuẩn bị trước"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Checkbox confirm */}
            <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-md">
              <input type="checkbox" id="confirm" required className="mt-1" />
              <Label
                htmlFor="confirm"
                className="text-sm leading-relaxed cursor-pointer"
              >
                Tôi đồng ý đặt lịch xem phòng và xác nhận thông tin là chính
                xác.
                <br />
                <span className="text-xs text-gray-500">
                  Lưu ý: đặt trước 1 ngày
                </span>
              </Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang gửi..." : "Đặt lịch"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
