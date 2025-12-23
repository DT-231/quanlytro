import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { contractService } from "@/services/contractService";
import { roomService } from "@/services/roomService";
import { useAuth } from "@/context/AuthContext";
import {
  Download,
  Printer,
  ArrowLeft,
  User,
  Building2,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const Section = ({ title, icon, children }) => (
  <section className="mb-8">
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

const InfoField = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-md font-semibold text-gray-900">{value}</p>
  </div>
);

const ContractDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const landlordInfo = {
    name: "Nguyễn Văn A",
    cccd: "001234567890",
    address: "123 Đường ABC, Quận XYZ, TP.HCM",
    phone: "0901234567",
  };

  useEffect(() => {
    const fetchContractAndRoomDetails = async () => {
      setLoading(true);
      try {
        const contractResponse = await contractService.getById(id);
        setContract(contractResponse.data);

        if (contractResponse.data.room_id) {
          const roomResponse = await roomService.getById(
            contractResponse.data.room_id
          );
          setRoomDetails(roomResponse.data);
        }
      } catch (err) {
        setError("Không thể tải chi tiết hợp đồng. Vui lòng thử lại.");
        console.error("Error fetching contract details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractAndRoomDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Tính năng tải xuống PDF sẽ được phát triển!");
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "warning";
      case "EXPIRED":
        return "secondary";
      case "TERMINATED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "PENDING":
        return "Chờ ký";
      case "EXPIRED":
        return "Hết hạn";
      case "TERMINATED":
        return "Đã hủy";
      default:
        return "Không rõ";
    }
  };

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

  if (error || !contract) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-red-500 mb-4">
          {error || "Không tìm thấy hợp đồng."}
        </p>
        <Button asChild>
          <Link to="/member/my-contracts">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const tenantFullName = user
    ? `${user.first_name} ${user.last_name}`
    : "Đang tải...";
  const contractDate = new Date(contract.created_at).toLocaleDateString();

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6 no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chi Tiết Hợp Đồng
            </h1>
            <p className="text-gray-600 mt-1">
              Mã hợp đồng: {contract.contract_number || `HD${contract.id}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                to="/member/my-contracts"
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Quay lại
              </Link>
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> In
            </Button>
            <Button onClick={handleDownload} variant="success">
              <Download className="mr-2 h-4 w-4" /> Tải PDF
            </Button>
          </div>
        </div>

        {/* --- Contract Document --- */}
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 print-container">
          {/* 1. Document Header */}
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
            {/* 2. Landlord Info */}
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

            {/* 3. Tenant Info */}
            <Section
              title="Bên Thuê (Khách Thuê)"
              icon={<User size={22} className="text-green-600" />}
            >
              <InfoField label="Họ và Tên" value={tenantFullName} />
              <InfoField
                label="CCCD/CMND"
                value={contract.tenant_cccd || "(Chưa cập nhật)"}
              />
            </Section>

            {/* 4. Room Info */}
            <Section
              title="Đối Tượng Cho Thuê"
              icon={<Building2 size={22} className="text-yellow-600" />}
            >
              {roomDetails ? (
                <>
                  <InfoField
                    label="Tòa Nhà"
                    value={roomDetails.building_name}
                  />
                  <InfoField
                    label="Số Phòng"
                    value={roomDetails.room_number}
                  />
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

            {/* 5. Rental Terms */}
            <Section
              title="Điều Khoản Thuê & Thanh Toán"
              icon={<CircleDollarSign size={22} className="text-purple-600" />}
            >
              <InfoField
                label="Ngày Bắt Đầu"
                value={new Date(contract.start_date).toLocaleDateString()}
              />
              <InfoField
                label="Ngày Kết Thúc"
                value={new Date(contract.end_date).toLocaleDateString()}
              />
              <InfoField
                label="Giá Thuê / Tháng"
                value={`${parseFloat(contract.rental_price).toLocaleString(
                  "vi-VN"
                )} ₫`}
              />
              <InfoField
                label="Tiền Cọc"
                value={`${parseFloat(contract.deposit_amount).toLocaleString(
                  "vi-VN"
                )} ₫`}
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
                value={`Ngày ${contract.payment_day}`}
              />
              <InfoField
                label="Số Lượng Người Ở"
                value={contract.number_of_tenants}
              />
            </Section>

            {/* 6. Terms and Conditions */}
            {(contract.terms_and_conditions || contract.notes) && (
              <Section
                title="Nội Quy & Điều Khoản"
                icon={<FileText size={22} className="text-red-600" />}
              >
                <div className="md:col-span-2 space-y-4">
                  {contract.terms_and_conditions && (
                    <div className="prose prose-sm max-w-none">
                      <h4 className="font-semibold">Điều khoản chung:</h4>
                      <p>{contract.terms_and_conditions}</p>
                    </div>
                  )}
                  {contract.notes && (
                    <div className="prose prose-sm max-w-none">
                      <h4 className="font-semibold">Ghi chú thêm:</h4>
                      <p>{contract.notes}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* 7. Signatures */}
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

          {/* 8. Status Footer */}
          <footer className="text-center mt-12 pt-6 border-t">
            <Badge variant={getStatusBadgeVariant(contract.status)}>
              {getStatusText(contract.status)}
            </Badge>
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