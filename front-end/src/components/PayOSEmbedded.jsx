import React, { useEffect, useState, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { paymentService } from "@/services/paymentService";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";

/**
 * PayOSEmbedded - Component hiển thị thông tin thanh toán PayOS với polling
 * 
 * @param {string} qrCode - Mã QR từ PayOS (VietQR format)
 * @param {string} checkoutUrl - URL checkout để mở trong tab mới
 * @param {string} amount - Số tiền thanh toán
 * @param {string} description - Mô tả thanh toán
 * @param {string} paymentId - ID của payment để polling kiểm tra trạng thái
 * @param {function} onPaymentSuccess - Callback khi thanh toán thành công
 * @param {number} pollingInterval - Khoảng thời gian polling (ms), mặc định 3000ms
 */
const PayOSEmbedded = ({ 
  qrCode, 
  checkoutUrl, 
  amount, 
  description, 
  paymentId,
  onPaymentSuccess,
  pollingInterval = 3000 
}) => {
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | checking | success | failed
  const [countdown, setCountdown] = useState(null);
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  /**
   * Kiểm tra trạng thái thanh toán - Gọi API check-status để sync từ PayOS
   */
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      setPaymentStatus("checking");
      
      // Gọi API check-status để sync trạng thái từ PayOS
      const response = await paymentService.checkAndSyncPaymentStatus(paymentId);
      const status = response?.status;

      console.log("Payment status check:", response);

      if (status === "completed") {
        setPaymentStatus("success");
        // Dừng polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Bắt đầu countdown trước khi callback
        setCountdown(3);
      } else if (status === "failed" || status === "error") {
        // Nếu error, vẫn tiếp tục polling
        if (status === "error") {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("failed");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } else {
        setPaymentStatus("pending");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentStatus("pending");
    }
  }, [paymentId]);

  /**
   * Bắt đầu polling khi có paymentId
   */
  useEffect(() => {
    if (!paymentId) return;

    // Polling định kỳ
    pollingRef.current = setInterval(checkPaymentStatus, pollingInterval);

    // Kiểm tra ngay lần đầu
    checkPaymentStatus();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [paymentId, pollingInterval, checkPaymentStatus]);

  /**
   * Countdown và callback khi thanh toán thành công
   */
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Gọi callback
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, onPaymentSuccess]);

  // Hiển thị thông báo thành công
  if (paymentStatus === "success") {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaCheckCircle className="text-5xl text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-green-700 mb-2">
            Thanh toán thành công!
          </h3>
          <p className="text-green-600 mb-4">
            Cảm ơn bạn đã thanh toán. Hoá đơn đã được cập nhật.
          </p>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Số tiền</p>
            <p className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(amount)}
            </p>
          </div>
          {countdown !== null && countdown > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Tự động đóng sau {countdown} giây...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Quét mã QR để thanh toán
        </h3>
        
        {qrCode ? (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <QRCodeSVG
              value={qrCode}
              size={256}
              level="H"
            />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Không có mã QR</p>
          </div>
        )}

        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Mở app ngân hàng và quét mã QR
          </p>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500">Số tiền</p>
            <p className="text-xl font-bold text-blue-600">
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(amount)}
            </p>
          </div>
          {description && (
            <p className="text-xs text-gray-500">
              Nội dung: <span className="font-medium">{description}</span>
            </p>
          )}
        </div>
      </div>

      {/* Alternative Payment Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Hoặc</p>
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Mở trang thanh toán PayOS
        </a>
        <p className="text-xs text-gray-500 mt-2">
          Nếu không thể quét QR, click vào đây để mở trang thanh toán
        </p>
      </div>

      {/* Payment Status Indicator */}
      {paymentId && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 rounded-lg border border-blue-200">
          <FaSpinner className="animate-spin text-blue-500" />
          <span className="text-sm text-blue-700">
            Đang chờ thanh toán... Hệ thống sẽ tự động cập nhật khi bạn thanh toán xong.
          </span>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">Hướng dẫn:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Mở app ngân hàng hỗ trợ VietQR</li>
          <li>Chọn chức năng quét mã QR</li>
          <li>Quét mã QR phía trên</li>
          <li>Xác nhận thông tin và thanh toán</li>
          <li>Hệ thống sẽ tự động xác nhận sau vài giây</li>
        </ol>
      </div>
    </div>
  );
};

export default PayOSEmbedded;
