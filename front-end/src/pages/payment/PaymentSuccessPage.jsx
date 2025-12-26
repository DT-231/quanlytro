import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * PaymentSuccessPage - Trang xử lý sau khi thanh toán PayOS
 * 
 * URL params:
 * - code: "00" = success, other = failed
 * - id: PayOS order code
 * - status: PAID/CANCELLED
 * - orderCode: order code
 */
const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  const code = searchParams.get("code");
  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status");
  const cancel = searchParams.get("cancel");

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Kiểm tra code = "00" và status = "PAID"
      if (code === "00" && status === "PAID" && cancel === "false") {
        setPaymentStatus("success");
        toast.success("Thanh toán thành công!");
      } else {
        setPaymentStatus("failed");
        toast.error("Thanh toán thất bại hoặc đã bị hủy!");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setError("Không thể xác minh thanh toán");
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInvoices = () => {
    navigate("/member/my-invoices");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Đang xác minh thanh toán...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12">
          {paymentStatus === "success" ? (
            <>
              <div className="rounded-full bg-green-100 p-6 mb-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-600 text-center mb-2">
                Giao dịch của bạn đã được xử lý thành công
              </p>
              {orderCode && (
                <p className="text-sm text-gray-500 mb-6">
                  Mã giao dịch: <span className="font-mono">{orderCode}</span>
                </p>
              )}
              <div className="flex gap-3 w-full">
                <Button
                  onClick={handleBackToInvoices}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Xem hóa đơn
                </Button>
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Trang chủ
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-red-100 p-6 mb-6">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thất bại
              </h1>
              <p className="text-gray-600 text-center mb-6">
                {error || "Giao dịch không thành công hoặc đã bị hủy"}
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={handleBackToInvoices}
                  className="flex-1"
                  variant="outline"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={handleBackToHome}
                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Trang chủ
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
