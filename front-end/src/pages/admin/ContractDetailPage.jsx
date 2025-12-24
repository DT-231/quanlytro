import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { contractService } from "@/services/contractService";
import { roomService } from "@/services/roomService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Download,
  Printer,
  ArrowLeft,
  User,
  Building2,
  CircleDollarSign,
  FileText,
  Edit,
  Trash2,
  StopCircle,
  CheckCircle,
  AlertTriangle,
  Zap,
  Droplet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import EditContractModal from "@/components/modals/contract/EditContractModal";

// ========== HELPER COMPONENTS ==========

const Section = ({ title, icon, children, className = "" }) => (
  <section className={`mb-8 ${className}`}>
    <div className="flex items-center mb-4">
      {icon}
      <h2 className="text-xl font-bold text-gray-800 ml-3">{title}</h2>
    </div>
    <Card>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {children}
      </CardContent>
    </Card>
  </section>
);

const InfoField = ({ label, value, className = "", highlight = false }) => (
  <div className={className}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`text-md font-semibold ${highlight ? "text-primary" : "text-gray-900"}`}>
      {value || "-"}
    </p>
  </div>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "ACTIVE":
        return { variant: "success", text: "Đang hoạt động", icon: CheckCircle };
      case "PENDING":
        return { variant: "warning", text: "Chờ xác nhận", icon: AlertTriangle };
      case "PENDING_UPDATE":
        return { variant: "warning", text: "Có thay đổi chờ xác nhận", icon: AlertTriangle };
      case "EXPIRED":
        return { variant: "secondary", text: "Đã hết hạn", icon: StopCircle };
      case "TERMINATED":
        return { variant: "destructive", text: "Đã chấm dứt", icon: Trash2 };
      case "TERMINATION_REQUESTED_BY_TENANT":
        return { variant: "warning", text: "Tenant yêu cầu chấm dứt", icon: AlertTriangle };
      case "TERMINATION_REQUESTED_BY_LANDLORD":
        return { variant: "warning", text: "Chủ trọ yêu cầu chấm dứt", icon: AlertTriangle };
      default:
        return { variant: "outline", text: status, icon: null };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {Icon && <Icon size={14} />}
      {config.text}
    </Badge>
  );
};

// ========== MAIN COMPONENT ==========

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [contract, setContract] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);

  // Landlord info (có thể lấy từ API hoặc config)
  const landlordInfo = {
    name: "Nguyễn Văn A",
    cccd: "001234567890",
    address: "123 Đường ABC, Quận XYZ, TP.HCM",
    phone: "0901234567",
  };

  // ========== FETCH DATA ==========
  const fetchContractDetails = async () => {
    setLoading(true);
    try {
      const contractResponse = await contractService.getById(id);
      if (contractResponse?.data) {
        setContract(contractResponse.data);

        // Fetch room details
        if (contractResponse.data.room_id) {
          const roomResponse = await roomService.getById(contractResponse.data.room_id);
          setRoomDetails(roomResponse?.data);
        }
      } else {
        setError("Không tìm thấy hợp đồng");
      }
    } catch (err) {
      setError("Không thể tải chi tiết hợp đồng. Vui lòng thử lại.");
      console.error("Error fetching contract details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetails();
  }, [id]);

  // ========== ACTIONS ==========
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info("Tính năng tải xuống PDF sẽ được phát triển!");
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchContractDetails();
    toast.success("Cập nhật hợp đồng thành công!");
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.delete(id);
      if (response) {
        toast.success("Xóa hợp đồng thành công!");
        navigate("/admin/contracts");
      } else {
        toast.error("Không thể xóa hợp đồng");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa hợp đồng: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRequestTermination = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.requestTermination(id);
      if (response?.data) {
        toast.success("Đã gửi yêu cầu chấm dứt hợp đồng!");
        fetchContractDetails();
      } else {
        toast.error(response?.message || "Không thể gửi yêu cầu");
      }
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsTerminateDialogOpen(false);
    }
  };

  const handleApproveTermination = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.approveTermination(id);
      if (response?.data) {
        toast.success("Đã phê duyệt chấm dứt hợp đồng!");
        fetchContractDetails();
      } else {
        toast.error(response?.message || "Không thể phê duyệt");
      }
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
    }
  };

  // ========== RENDER HELPERS ==========

  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return parseFloat(value).toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Check if user can approve termination
  const canApproveTermination = () => {
    if (!contract) return false;
    const status = contract.status;
    // Admin có thể phê duyệt yêu cầu từ tenant
    if (status === "TERMINATION_REQUESTED_BY_TENANT") return true;
    return false;
  };

  // Check if contract can be terminated
  const canRequestTermination = () => {
    if (!contract) return false;
    return contract.status === "ACTIVE";
  };

  // Check if contract can be deleted
  // Chỉ xóa được: PENDING (chưa xác nhận), EXPIRED (hết hạn), TERMINATED (đã kết thúc)
  const canDeleteContract = () => {
    if (!contract) return false;
    const deletableStatuses = ["PENDING", "EXPIRED", "TERMINATED"];
    return deletableStatuses.includes(contract.status);
  };

  // Check if contract has pending update
  const hasPendingUpdate = () => {
    if (!contract) return false;
    return contract.status === "PENDING_UPDATE";
  };

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-8 w-48 mb-8" />
          <Card className="p-8">
            <Skeleton className="h-8 w-full mb-8" />
            <Skeleton className="h-32 w-full mb-8" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error || !contract) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-lg">
          {error || "Không tìm thấy hợp đồng."}
        </p>
        <Button asChild>
          <Link to="/admin/contracts">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const contractDate = formatDate(contract.created_at);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* ========== HEADER ========== */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 no-print">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Chi Tiết Hợp Đồng
              </h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-gray-600">
              Mã hợp đồng: <span className="font-semibold">{contract.contract_number}</span>
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/contracts" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Quay lại
              </Link>
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> In
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Tải PDF
            </Button>
          </div>
        </div>

        {/* ========== ACTION CARDS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
          {/* Edit Button */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 hover:border-blue-400"
            onClick={handleEdit}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Sửa hợp đồng</p>
                <p className="text-sm text-gray-500">Cập nhật thông tin</p>
              </div>
            </CardContent>
          </Card>

          {/* Terminate Button */}
          {canRequestTermination() && (
            <AlertDialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
              <AlertDialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 hover:border-orange-400">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <StopCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Dừng hợp đồng</p>
                      <p className="text-sm text-gray-500">Chấm dứt hợp đồng</p>
                    </div>
                  </CardContent>
                </Card>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận chấm dứt hợp đồng?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn gửi yêu cầu chấm dứt hợp đồng <strong>{contract.contract_number}</strong>?
                    <br /><br />
                    Sau khi gửi yêu cầu, bên thuê sẽ nhận được thông báo và cần phê duyệt để hoàn tất việc chấm dứt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestTermination}
                    disabled={actionLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Approve Termination */}
          {canApproveTermination() && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-green-200 hover:border-green-400"
              onClick={handleApproveTermination}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Phê duyệt chấm dứt</p>
                  <p className="text-sm text-gray-500">Đồng ý yêu cầu từ tenant</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Button - Only for deletable statuses */}
          {canDeleteContract() ? (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 hover:border-red-400">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Xóa hợp đồng</p>
                      <p className="text-sm text-gray-500">Xóa vĩnh viễn</p>
                    </div>
                  </CardContent>
                </Card>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa hợp đồng?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Hợp đồng <strong>{contract.contract_number}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
                    {contract.invoices?.length > 0 && (
                      <p className="mt-2 text-amber-600">
                        <strong>Lưu ý:</strong> Các hóa đơn liên quan sẽ được giữ lại nhưng sẽ bỏ liên kết với hợp đồng này.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading ? "Đang xử lý..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Card className="border-gray-200 bg-gray-50 opacity-60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Trash2 className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Không thể xóa</p>
                  <p className="text-sm text-gray-400">
                    Chỉ xóa được hợp đồng: Chờ xác nhận, Hết hạn, Đã kết thúc
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Update Status Alert */}
          {hasPendingUpdate() && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">Đang chờ tenant xác nhận thay đổi</p>
                  <p className="text-sm text-amber-600">Bạn đã gửi yêu cầu thay đổi hợp đồng. Vui lòng chờ tenant xác nhận.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ========== CONTRACT DOCUMENT ========== */}
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 print-container">
          {/* Document Header */}
          <header className="text-center mb-10">
            <p className="font-semibold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="tracking-widest">Độc lập - Tự do - Hạnh phúc</p>
            <Separator className="my-6" />
            <h1 className="text-3xl font-bold uppercase text-gray-800">
              Hợp Đồng Thuê Phòng
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Ngày lập: {contractDate} tại TP. Đà Nẵng
            </p>
          </header>

          <main>
            {/* Landlord Info */}
            <Section
              title="Bên Cho Thuê (Chủ Trọ)"
              icon={<User size={22} className="text-blue-600" />}
            >
              <InfoField label="Họ và Tên" value={landlordInfo.name} />
              <InfoField label="CCCD/CMND" value={landlordInfo.cccd} />
              <InfoField
                label="Địa chỉ"
                value={landlordInfo.address}
                className="md:col-span-2"
              />
              <InfoField label="Số Điện Thoại" value={landlordInfo.phone} />
            </Section>

            {/* Tenant Info */}
            <Section
              title="Bên Thuê (Khách Thuê)"
              icon={<User size={22} className="text-green-600" />}
            >
              <InfoField 
                label="Họ và Tên" 
                value={contract.tenant?.full_name || `${contract.tenant?.first_name || ''} ${contract.tenant?.last_name || ''}`.trim() || "(Chưa cập nhật)"} 
              />
              <InfoField
                label="CCCD/CMND"
                value={contract.tenant?.cccd || contract.tenant_cccd || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Số Điện Thoại"
                value={contract.tenant?.phone || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Email"
                value={contract.tenant?.email || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Giới Tính"
                value={contract.tenant?.gender || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Quê Quán"
                value={contract.tenant?.hometown || "(Chưa cập nhật)"}
              />
            </Section>

            {/* Room Info */}
            <Section
              title="Đối Tượng Cho Thuê"
              icon={<Building2 size={22} className="text-yellow-600" />}
            >
              {roomDetails ? (
                <>
                  <InfoField label="Tòa Nhà" value={roomDetails.building_name} />
                  <InfoField label="Số Phòng" value={roomDetails.room_number} />
                  <InfoField
                    label="Địa Chỉ Cụ Thể"
                    value={roomDetails.full_address}
                    className="md:col-span-2"
                  />
                </>
              ) : (
                <>
                  <InfoField label="Room ID" value={contract.room_id} />
                </>
              )}
            </Section>

            {/* Rental Terms */}
            <Section
              title="Điều Khoản Thuê & Thanh Toán"
              icon={<CircleDollarSign size={22} className="text-purple-600" />}
            >
              <InfoField
                label="Ngày Bắt Đầu"
                value={formatDate(contract.start_date)}
              />
              <InfoField
                label="Ngày Kết Thúc"
                value={formatDate(contract.end_date)}
              />
              <InfoField
                label="Giá Thuê / Tháng"
                value={formatCurrency(contract.rental_price)}
                highlight
              />
              <InfoField
                label="Tiền Cọc"
                value={formatCurrency(contract.deposit_amount)}
              />
              <InfoField
                label="Kỳ Thanh Toán"
                value={
                  contract.payment_cycle_months
                    ? `${contract.payment_cycle_months} tháng/lần`
                    : "Hàng tháng"
                }
              />
              <InfoField
                label="Ngày Thanh Toán Hàng Tháng"
                value={contract.payment_day ? `Ngày ${contract.payment_day}` : "-"}
              />
              <InfoField
                label="Số Lượng Người Ở"
                value={contract.number_of_tenants}
              />
            </Section>

            {/* Utility Prices */}
            <Section
              title="Giá Điện Nước"
              icon={<Zap size={22} className="text-amber-600" />}
            >
              <InfoField
                label="Giá Điện"
                value={contract.electricity_price ? `${formatCurrency(contract.electricity_price)}/kWh` : "Theo giá nhà nước"}
              />
              <InfoField
                label="Giá Nước"
                value={contract.water_price ? `${formatCurrency(contract.water_price)}/m³` : "Theo giá nhà nước"}
              />
            </Section>

            {/* Service Fees */}
            {contract.service_fees && contract.service_fees.length > 0 && (
              <Section
                title="Phí Dịch Vụ"
                icon={<FileText size={22} className="text-teal-600" />}
              >
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.service_fees.map((fee, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{fee.name}</span>
                        <span className="text-primary font-semibold">{formatCurrency(fee.amount)}/tháng</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* Terms and Conditions */}
            {(contract.terms_and_conditions || contract.notes) && (
              <Section
                title="Nội Quy & Điều Khoản"
                icon={<FileText size={22} className="text-red-600" />}
              >
                <div className="md:col-span-2 space-y-4">
                  {contract.terms_and_conditions && (
                    <div className="prose prose-sm max-w-none">
                      <h4 className="font-semibold">Điều khoản chung:</h4>
                      <p className="whitespace-pre-wrap">{contract.terms_and_conditions}</p>
                    </div>
                  )}
                  {contract.notes && (
                    <div className="prose prose-sm max-w-none">
                      <h4 className="font-semibold">Ghi chú thêm:</h4>
                      <p className="whitespace-pre-wrap">{contract.notes}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Signatures */}
            <section className="mt-16">
              <h2 className="text-xl font-bold text-center mb-8">
                KÝ XÁC NHẬN CỦA CÁC BÊN
              </h2>
              <div className="grid grid-cols-2 gap-12 pt-8">
                <div className="text-center">
                  <p className="font-bold">BÊN CHO THUÊ</p>
                  <p className="text-sm text-gray-500 mb-16">
                    (Ký và ghi rõ họ tên)
                  </p>
                  <p className="font-semibold">{landlordInfo.name}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">BÊN THUÊ</p>
                  <p className="text-sm text-gray-500 mb-16">
                    (Ký và ghi rõ họ tên)
                  </p>
                  <p className="font-semibold">________________</p>
                </div>
              </div>
            </section>
          </main>

          {/* Status Footer */}
          <footer className="text-center mt-12 pt-6 border-t">
            <StatusBadge status={contract.status} />
            <p className="text-sm text-gray-500 mt-2">
              Cập nhật lần cuối: {formatDate(contract.updated_at)}
            </p>
          </footer>
        </div>
      </div>

      {/* ========== MODALS ========== */}
      <EditContractModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={handleEditSuccess}
        contractData={contract}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-container {
            box-shadow: none !important;
            border: 2px solid black !important;
          }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

export default ContractDetailPage;
