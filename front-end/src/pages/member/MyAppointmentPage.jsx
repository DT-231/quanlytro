import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Building,
  Home,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function MyAppointmentPage() {
  // const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/appointments/my-appointments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAppointments(response.data.data.items || []);
      }
    } catch (error) {
      console.error("Error loading my appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn của bạn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Đã hủy lịch hẹn của bạn");
        loadAppointments(); // Tải lại danh sách
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        label: "Chờ xử lý",
        className: "bg-yellow-100 text-yellow-800",
      },
      CONFIRMED: {
        label: "Đã xác nhận",
        className: "bg-blue-100 text-blue-800",
      },
      REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-800" },
      COMPLETED: {
        label: "Hoàn thành",
        className: "bg-green-100 text-green-800",
      },
      CANCELLED: { label: "Đã hủy", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải danh sách lịch hẹn...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Lịch hẹn của tôi
        </h1>
        <p className="text-gray-600">
          Theo dõi trạng thái các lịch hẹn xem phòng của bạn.
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6 text-center text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Bạn chưa có lịch hẹn nào.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building className="h-5 w-5 text-gray-600" />{" "}
                      {appointment.building_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Home className="h-5 w-5 text-gray-500" />
                      Phòng {appointment.room_number}
                    </CardDescription>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Thời gian hẹn:</span>
                    <span className="ml-2">
                      {formatDateTime(appointment.appointment_datetime)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Họ tên:</span>
                    <span className="ml-2">{appointment.full_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">SĐT:</span>
                    <span className="ml-2">{appointment.phone}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button
                    onClick={() => handleViewDetail(appointment)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Xem chi tiết
                  </Button>

                  {["PENDING", "CONFIRMED"].includes(appointment.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                          <XCircle className="mr-2 h-4 w-4" />
                          Hủy lịch hẹn
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Bạn có chắc muốn hủy lịch hẹn?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Lịch hẹn của bạn
                            sẽ bị hủy.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Không</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                          >
                            Có, hủy lịch hẹn
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết lịch hẹn</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2 flex items-center">
                    <Building className="mr-3 h-5 w-5 text-blue-600" />
                    <p>
                      <span className="font-semibold">
                        {selectedAppointment.building_name}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Home className="mr-3 h-5 w-5 text-blue-600" />
                    <p>
                      <span className="font-semibold">
                        Phòng {selectedAppointment.room_number}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Trạng thái</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Thời gian hẹn</Label>
                    <p className="font-medium text-sm">
                      {formatDateTime(selectedAppointment.appointment_datetime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Thông tin của bạn</h4>
                <p className="text-sm">
                  <User className="inline mr-2 h-4 w-4" />
                  {selectedAppointment.full_name}
                </p>
                <p className="text-sm">
                  <Phone className="inline mr-2 h-4 w-4" />
                  {selectedAppointment.phone}
                </p>
                {selectedAppointment.email && (
                  <p className="text-sm">
                    <Mail className="inline mr-2 h-4 w-4" />
                    {selectedAppointment.email}
                  </p>
                )}
              </div>

              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Ghi chú của bạn</h4>
                  <p className="text-sm p-3 bg-gray-50 rounded-md border">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {selectedAppointment.admin_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Phản hồi từ chủ nhà</h4>
                  <p className="text-sm p-3 bg-blue-50 rounded-md border border-blue-200">
                    {selectedAppointment.admin_notes}
                  </p>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Đóng
                  </Button>
                </DialogClose>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
