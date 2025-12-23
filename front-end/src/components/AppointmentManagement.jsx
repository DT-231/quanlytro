import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, CheckCircle, XCircle, Eye } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

/**
 * AppointmentManagement - Quản lý lịch hẹn xem phòng (Admin)
 * 
 * Component cho phép admin:
 * - Xem danh sách lịch hẹn
 * - Xem chi tiết lịch hẹn
 * - Cập nhật trạng thái (CONFIRMED, REJECTED, COMPLETED)
 * - Thêm ghi chú
 */
export default function AppointmentManagement() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: ''
  });

  // Load appointments
  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${import.meta.env.VITE_API_URL}/api/v1/appointments`;
      if (statusFilter !== 'ALL') {
        url += `?status=${statusFilter}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAppointments(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/appointments/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSelectedAppointment(response.data.data);
        setUpdateData({
          status: response.data.data.status,
          admin_notes: response.data.data.admin_notes || ''
        });
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Error loading appointment detail:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết lịch hẹn",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment) return;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/appointments/${selectedAppointment.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Thành công",
          description: "Cập nhật trạng thái lịch hẹn thành công",
        });
        setIsDetailOpen(false);
        loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.detail || "Không thể cập nhật lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800' },
      REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
        <p className="text-gray-600">Xem và xử lý các yêu cầu đặt lịch xem phòng từ khách hàng</p>
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Không có lịch hẹn nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{appointment.full_name}</CardTitle>
                    <CardDescription>
                      Phòng {appointment.room_number} - {appointment.building_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent>
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
                <Button
                  onClick={() => handleViewDetail(appointment.id)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
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
                    <p className="font-medium">{selectedAppointment.full_name}</p>
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
                    <Label className="text-gray-500">Thời gian hẹn</Label>
                    <p className="font-medium">{formatDateTime(selectedAppointment.appointment_datetime)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Trạng thái hiện tại</Label>
                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="text-gray-500">Ghi chú từ khách hàng</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedAppointment.notes}</p>
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
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
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
                    onChange={(e) => setUpdateData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    placeholder="Thêm ghi chú..."
                    rows={3}
                  />
                </div>

                {selectedAppointment.admin_notes && (
                  <div>
                    <Label className="text-gray-500">Ghi chú trước đó</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{selectedAppointment.admin_notes}</p>
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
                  {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
