import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/services/appointmentService";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";

/**
 * AppointmentManagementPage - Quản lý lịch hẹn xem phòng (Admin)
 *
 * Component cho phép admin:
 * - Xem danh sách lịch hẹn
 * - Xem chi tiết lịch hẹn
 * - Cập nhật trạng thái (CONFIRMED, REJECTED, COMPLETED)
 * - Thêm ghi chú
 */
export default function AppointmentManagementPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 9; // 3x3 grid

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [updateData, setUpdateData] = useState({
    status: "",
    admin_notes: "",
  });

  // Load appointments
  useEffect(() => {
    loadAppointments();
  }, [statusFilter, currentPage]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
      };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      const response = await getAppointments(params);

      if (response.success) {
        setAppointments(response.data.items || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Handle delete click
  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteAppointment(appointmentToDelete.id);

      if (response.success) {
        toast.success("Xóa lịch hẹn thành công");
        loadAppointments();
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error?.message || "Không thể xóa lịch hẹn");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleViewDetail = async (appointmentId) => {
    try {
      const response = await getAppointmentById(appointmentId);

      if (response.success) {
        setSelectedAppointment(response.data);
        setUpdateData({
          status: response.data.status,
          admin_notes: response.data.admin_notes || "",
        });
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error("Error loading appointment detail:", error);
      toast.error("Không thể tải chi tiết lịch hẹn");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment) return;

    try {
      setIsUpdating(true);
      const response = await updateAppointmentStatus(
        selectedAppointment.id,
        updateData
      );

      if (response.success) {
        toast.success("Cập nhật trạng thái lịch hẹn thành công");

        setIsDetailOpen(false);
        loadAppointments();
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(error.message || "Không thể cập nhật lịch hẹn");
    } finally {
      setIsUpdating(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quản lý lịch hẹn xem phòng</h1>
        <p className="text-gray-600">
          Xem và xử lý các yêu cầu đặt lịch xem phòng từ khách hàng
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <Label>Lọc theo trạng thái:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="p-3">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Không có lịch hẹn nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="hover:shadow-lg transition-shadow p-3 gap-0"
            >
              <CardHeader className="p-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {appointment.full_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="space-y-1">
                        <div>
                          Phòng {appointment.room_number} - {appointment.building_name}
                        </div>
                        {(appointment.building_address || appointment.ward_name || appointment.city_name) && (
                          <div className="text-xs text-gray-500">
                            {[
                              appointment.building_address,
                              appointment.ward_name,
                              appointment.city_name
                            ].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-gray-500" />
                    {appointment.phone}
                  </div>
                  {appointment.email && (
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-500" />
                      {appointment.email}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    {formatDateTime(appointment.appointment_datetime)}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleViewDetail(appointment.id)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(appointment)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalItems)} / {totalItems} lịch hẹn
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
            <DialogDescription>
              Xem thông tin và cập nhật trạng thái lịch hẹn
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-500">Họ tên</Label>
                    <p className="font-medium">
                      {selectedAppointment.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Số điện thoại</Label>
                    <p className="font-medium">{selectedAppointment.phone}</p>
                  </div>
                  {selectedAppointment.email && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium">{selectedAppointment.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Thông tin lịch hẹn</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-gray-500">Phòng</Label>
                    <p className="font-medium">
                      Phòng {selectedAppointment.room_number || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">Tòa nhà</Label>
                    <p className="font-medium">
                      {selectedAppointment.building_name || "N/A"}
                    </p>
                  </div>
                  {(selectedAppointment.building_address || selectedAppointment.ward_name || selectedAppointment.city_name) && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">Địa chỉ</Label>
                      <p className="font-medium">
                        {[
                          selectedAppointment.building_address,
                          selectedAppointment.ward_name,
                          selectedAppointment.city_name
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-gray-500">Thời gian hẹn</Label>
                    <p className="font-medium">
                      {formatDateTime(selectedAppointment.appointment_datetime)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Trạng thái hiện tại</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="text-gray-500">
                      Ghi chú từ khách hàng
                    </Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Update Form */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-lg">Cập nhật trạng thái</h3>

                <div className="space-y-2">
                  <Label>Trạng thái mới</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) =>
                      setUpdateData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                      <SelectItem value="CONFIRMED">Xác nhận</SelectItem>
                      <SelectItem value="REJECTED">Từ chối</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ghi chú của admin</Label>
                  <Textarea
                    value={updateData.admin_notes}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        admin_notes: e.target.value,
                      }))
                    }
                    placeholder="Thêm ghi chú..."
                    rows={3}
                  />
                </div>

                {selectedAppointment.admin_notes && (
                  <div>
                    <Label className="text-gray-500">Ghi chú trước đó</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                      {selectedAppointment.admin_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1"
                  disabled={isUpdating}
                >
                  Đóng
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAppointmentToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={appointmentToDelete?.full_name}
        title="Xác nhận xóa lịch hẹn"
        message={
          appointmentToDelete
            ? `Bạn có chắc chắn muốn xóa lịch hẹn của "${appointmentToDelete.full_name}" không? Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmText={isDeleting ? "Đang xóa..." : "Xóa"}
        variant="danger"
      />
    </div>
  );
}
