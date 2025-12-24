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
  StopCircle,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        return { variant: "success", text: "Đang hoạt động", icon: CheckCircle, color: "text-green-600 bg-green-100" };
      case "PENDING":
        return { variant: "warning", text: "Chờ xác nhận", icon: Clock, color: "text-yellow-600 bg-yellow-100" };
      case "PENDING_UPDATE":
        return { variant: "warning", text: "Có thay đổi chờ xác nhận", icon: AlertTriangle, color: "text-amber-600 bg-amber-100" };
      case "EXPIRED":
        return { variant: "secondary", text: "Đã hết hạn", icon: XCircle, color: "text-gray-600 bg-gray-100" };
      case "TERMINATED":
        return { variant: "destructive", text: "Đã chấm dứt", icon: StopCircle, color: "text-red-600 bg-red-100" };
      case "TERMINATION_REQUESTED_BY_TENANT":
        return { variant: "warning", text: "Bạn đã yêu cầu chấm dứt", icon: AlertTriangle, color: "text-orange-600 bg-orange-100" };
      case "TERMINATION_REQUESTED_BY_LANDLORD":
        return { variant: "warning", text: "Chủ trọ yêu cầu chấm dứt", icon: AlertTriangle, color: "text-orange-600 bg-orange-100" };
      default:
        return { variant: "outline", text: status, icon: null, color: "text-gray-600 bg-gray-100" };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
      {Icon && <Icon size={16} />}
      {config.text}
    </span>
  );
};

// ========== MAIN COMPONENT ==========

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [contract, setContract] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isConfirmUpdateDialogOpen, setIsConfirmUpdateDialogOpen] = useState(false);
  const [isRejectUpdateDialogOpen, setIsRejectUpdateDialogOpen] = useState(false);

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

  const handleRequestTermination = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.requestTermination(id);
      if (response?.data) {
        toast.success("Đã gửi yêu cầu chấm dứt hợp đồng! Chủ trọ sẽ xem xét yêu cầu của bạn.");
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
        toast.success("Đã đồng ý chấm dứt hợp đồng!");
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

  // ========== CONFIRM/REJECT CONTRACT (PENDING) ==========
  
  const handleConfirmContract = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.confirmContract(id);
      if (response?.data) {
        toast.success("Đã xác nhận hợp đồng! Hợp đồng đã được kích hoạt.");
        fetchContractDetails();
      } else {
        toast.error(response?.message || "Không thể xác nhận hợp đồng");
      }
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const handleRejectContract = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.rejectContract(id);
      toast.success("Đã từ chối hợp đồng!");
      navigate("/member/my-contracts");
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsRejectDialogOpen(false);
    }
  };

  // ========== CONFIRM/REJECT UPDATE (PENDING_UPDATE) ==========
  
  const handleConfirmUpdate = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.confirmUpdate(id);
      if (response?.data) {
        toast.success("Đã xác nhận thay đổi hợp đồng!");
        fetchContractDetails();
      } else {
        toast.error(response?.message || "Không thể xác nhận thay đổi");
      }
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsConfirmUpdateDialogOpen(false);
    }
  };

  const handleRejectUpdate = async () => {
    setActionLoading(true);
    try {
      const response = await contractService.rejectUpdate(id);
      if (response?.data) {
        toast.success("Đã từ chối thay đổi. Hợp đồng giữ nguyên.");
        fetchContractDetails();
      } else {
        toast.error(response?.message || "Không thể từ chối thay đổi");
      }
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không xác định"));
    } finally {
      setActionLoading(false);
      setIsRejectUpdateDialogOpen(false);
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

  // Get tenant full name
  const getTenantName = () => {
    if (user) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Đang tải...";
    }
    return "Đang tải...";
  };

  // Check if user can approve termination (when landlord requested)
  const canApproveTermination = () => {
    if (!contract) return false;
    return contract.status === "TERMINATION_REQUESTED_BY_LANDLORD";
  };

  // Check if tenant can request termination
  const canRequestTermination = () => {
    if (!contract) return false;
    return contract.status === "ACTIVE";
  };

  // Check if already requested by tenant
  const hasRequestedTermination = () => {
    if (!contract) return false;
    return contract.status === "TERMINATION_REQUESTED_BY_TENANT";
  };

  // Check if contract is PENDING (waiting for tenant to confirm)
  const isPendingContract = () => {
    if (!contract) return false;
    return contract.status === "PENDING";
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
          <Link to="/member/my-contracts">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const contractDate = formatDate(contract.created_at);
  const tenantFullName = getTenantName();

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
            </div>
            <div className="flex items-center gap-3">
              <p className="text-gray-600">
                Mã hợp đồng: <span className="font-semibold">{contract.contract_number}</span>
              </p>
              <StatusBadge status={contract.status} />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/member/my-contracts" className="flex items-center gap-2">
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

        {/* ========== ACTION CARDS FOR TENANT ========== */}
        <div className="mb-6 no-print">
          
          {/* PENDING CONTRACT - Waiting for tenant confirmation */}
          {isPendingContract() && (
            <Card className="border-blue-300 bg-blue-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">Hợp đồng mới chờ xác nhận</p>
                    <p className="text-sm text-blue-600">Vui lòng xem kỹ nội dung hợp đồng và xác nhận hoặc từ chối.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Xác nhận hợp đồng
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Xác nhận hợp đồng?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-2">
                          <p>Bạn có chắc chắn muốn xác nhận hợp đồng <strong>{contract.contract_number}</strong>?</p>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-green-800">
                              <strong>Sau khi xác nhận:</strong>
                            </p>
                            <ul className="text-sm text-green-700 list-disc list-inside mt-1 space-y-1">
                              <li>Hợp đồng sẽ được kích hoạt</li>
                              <li>Bạn chính thức trở thành người thuê phòng</li>
                              <li>Các điều khoản trong hợp đồng sẽ có hiệu lực</li>
                            </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmContract}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Từ chối hợp đồng
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          Từ chối hợp đồng?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-2">
                          <p>Bạn có chắc chắn muốn từ chối hợp đồng <strong>{contract.contract_number}</strong>?</p>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-red-800">
                              <strong>Lưu ý:</strong> Hợp đồng sẽ bị hủy và không thể khôi phục.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Quay lại</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRejectContract}
                          disabled={actionLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {actionLoading ? "Đang xử lý..." : "Từ chối"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PENDING UPDATE - Admin requested changes, waiting for tenant confirmation */}
          {hasPendingUpdate() && (
            <Card className="border-amber-300 bg-amber-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800">Có thay đổi hợp đồng chờ xác nhận</p>
                    <p className="text-sm text-amber-600">Chủ trọ đã yêu cầu thay đổi hợp đồng. Vui lòng xem và xác nhận hoặc từ chối.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <AlertDialog open={isConfirmUpdateDialogOpen} onOpenChange={setIsConfirmUpdateDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Đồng ý thay đổi
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Đồng ý thay đổi hợp đồng?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-2">
                          <p>Bạn có chắc chắn muốn đồng ý với các thay đổi của hợp đồng <strong>{contract.contract_number}</strong>?</p>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-green-800">
                              Các thay đổi sẽ được áp dụng ngay sau khi bạn xác nhận.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmUpdate}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading ? "Đang xử lý..." : "Đồng ý"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog open={isRejectUpdateDialogOpen} onOpenChange={setIsRejectUpdateDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        <XCircle className="mr-2 h-4 w-4" />
                        Từ chối thay đổi
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          Từ chối thay đổi?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-2">
                          <p>Bạn có chắc chắn muốn từ chối các thay đổi của hợp đồng?</p>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-yellow-800">
                              Hợp đồng sẽ giữ nguyên như hiện tại và chủ trọ sẽ được thông báo.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Quay lại</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRejectUpdate}
                          disabled={actionLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {actionLoading ? "Đang xử lý..." : "Từ chối"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Alert */}
          {hasRequestedTermination() && (
            <Card className="border-orange-300 bg-orange-50 mb-4">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">Yêu cầu chấm dứt đang chờ xử lý</p>
                  <p className="text-sm text-orange-600">Bạn đã gửi yêu cầu chấm dứt hợp đồng. Vui lòng chờ chủ trọ phê duyệt.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Landlord requested termination - Tenant can approve */}
          {canApproveTermination() && (
            <Card className="border-orange-300 bg-orange-50 mb-4">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-800">Chủ trọ yêu cầu chấm dứt hợp đồng</p>
                    <p className="text-sm text-orange-600">Bạn có thể đồng ý hoặc liên hệ chủ trọ để thảo luận.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleApproveTermination} 
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {actionLoading ? "Đang xử lý..." : "Đồng ý chấm dứt"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Termination Request Button */}
          {canRequestTermination() && (
            <AlertDialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
              <AlertDialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 hover:border-orange-400">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <StopCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Yêu cầu chấm dứt hợp đồng</p>
                      <p className="text-sm text-gray-500">Gửi yêu cầu cho chủ trọ để chấm dứt hợp đồng sớm</p>
                    </div>
                    <ArrowLeft size={20} className="text-gray-400 rotate-180" />
                  </CardContent>
                </Card>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Xác nhận yêu cầu chấm dứt hợp đồng?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-left space-y-2">
                    <p>
                      Bạn có chắc chắn muốn gửi yêu cầu chấm dứt hợp đồng <strong>{contract.contract_number}</strong>?
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Lưu ý:</strong>
                      </p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside mt-1 space-y-1">
                        <li>Chủ trọ sẽ nhận được thông báo về yêu cầu của bạn</li>
                        <li>Hợp đồng chỉ chấm dứt khi chủ trọ phê duyệt</li>
                        <li>Bạn nên liên hệ trước với chủ trọ để thống nhất</li>
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestTermination}
                    disabled={actionLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {actionLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                value={contract.tenant?.full_name || tenantFullName} 
              />
              <InfoField
                label="CCCD/CMND"
                value={contract.tenant?.cccd || contract.tenant_cccd || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Số Điện Thoại"
                value={contract.tenant?.phone || user?.phone || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Email"
                value={contract.tenant?.email || user?.email || "(Chưa cập nhật)"}
              />
              <InfoField
                label="Giới Tính"
                value={contract.tenant?.gender === "MALE" ? "Nam" : contract.tenant?.gender === "FEMALE" ? "Nữ" : "(Chưa cập nhật)"}
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
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-full md:col-span-2" />
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
                  <p className="font-semibold">{tenantFullName}</p>
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