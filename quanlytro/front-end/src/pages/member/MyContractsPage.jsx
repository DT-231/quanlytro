import React, { useState } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";

const MyContractsPage = () => {
  const myContract = {
    code: "Phòng 101",

    contractDate: "15/02/2024",

    landlordName: "Nguyễn Văn A",
    landlordId: "0123456789",
    landlordPhone: "0912345678",
    landlordAddress: "Đường Trần Phú, Quận Hải Châu, TP. Đà Nẵng",

    tenantName: "Trần Văn B",
    tenantId: "9876543210",
    tenantPhone: "0987654321",
    tenantAddress: "Đường ABC, Quận Hải Châu, TP. Đà Nẵng",

    buildingName: "Tòa nhà FPT Complex",
    roomNumber: "101",
    roomAddress:
      "Khu đô thị FPT City, Phường Hòa Hải, Quận Ngũ Hành Sơn, TP. Đà Nẵng",

    startDate: "15/02/2024",
    endDate: "14/02/2025",
    rentPrice: 2000000,
    deposit: 4000000,

    paymentDate: 15,
    paymentCycle: "Tháng",

    electricityPrice: 3500,
    waterPrice: 25000,

    houseRules: `ĐIỀU KHOẢN VỀ QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ:
- Bên thuê có quyền sử dụng phòng và toàn bộ tài sản đi kèm đúng mục đích đã thỏa thuận.
- Bên thuê phải trả tiền thuê phòng và các chi phí dịch vụ đầy đủ, đúng hạn.
- Bên thuê có trách nhiệm bảo quản tài sản, không được tự ý sửa chữa.
- Bên thuê phải tuân thủ nội quy của tòa nhà.
- Bên thuê không được phép tự ý cho người khác ở chung.`,

    status: "Hoạt động",
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Tính năng tải xuống PDF sẽ được phát triển!");
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header Actions */}
        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition no-print"
          >
            <FaPrint size={18} />
            In
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition no-print"
          >
            <FaDownload size={18} />
            Tải PDF
          </button>
        </div>

        {/* Contract Document */}
        <div className="border-4 border-gray-800 p-8 bg-white print:border-black">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
            <p className="text-sm font-semibold mb-1">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-sm mb-4">Độc lập - Tự do - Hạnh phúc</p>
            <h1 className="text-2xl font-bold mb-4">HỢP ĐỒNG CHO THUÊ PHÒNG</h1>
            <p className="text-sm">
              Mã số: <strong>{myContract.code}</strong>
            </p>
          </div>

          {/* Contract Details */}
          <div className="space-y-6 mb-8">
            {/* Part 1: General Info */}
            <div>
              <p className="mb-3">
                <strong>Ngày lập hợp đồng:</strong>{" "}
                <u className="ml-2">{myContract.contractDate}</u>
              </p>
              <p>
                <strong>Tại:</strong> <u className="ml-2">TP. Đà Nẵng</u>
              </p>
            </div>

            {/* Part 2: Landlord Info */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold mb-3">BÊN CHO THUÊ (Chủ nhà):</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Họ tên:</strong> <u>{myContract.landlordName}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>CMND/CCCD:</strong> <u>{myContract.landlordId}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Số điện thoại:</strong>{" "}
                    <u>{myContract.landlordPhone}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Địa chỉ:</strong>{" "}
                    <u>{myContract.landlordAddress}</u>
                  </p>
                </div>
              </div>
            </div>

            {/* Part 3: Tenant Info */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold mb-3">BÊN THUÊ (Khách):</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Họ tên:</strong> <u>{myContract.tenantName}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>CMND/CCCD:</strong> <u>{myContract.tenantId}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Số điện thoại:</strong>{" "}
                    <u>{myContract.tenantPhone}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Địa chỉ:</strong> <u>{myContract.tenantAddress}</u>
                  </p>
                </div>
              </div>
            </div>

            {/* Part 4: Room Info */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-bold mb-3">ĐỐI TƯỢNG CHO THUÊ:</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Tòa nhà:</strong>{" "}
                  <u className="ml-2">{myContract.buildingName}</u>
                </p>
                <p>
                  <strong>Số phòng:</strong>{" "}
                  <u className="ml-2">{myContract.roomNumber}</u>
                </p>
                <p>
                  <strong>Địa chỉ cụ thể:</strong>{" "}
                  <u className="ml-2">{myContract.roomAddress}</u>
                </p>
              </div>
            </div>

            {/* Part 5: Rental Terms */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-bold mb-3">ĐIỀU KHOẢN THUÊ:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Từ ngày:</strong> <u>{myContract.startDate}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Đến ngày:</strong> <u>{myContract.endDate}</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Giá thuê/tháng:</strong>{" "}
                    <u>{myContract.rentPrice.toLocaleString("vi-VN")} ₫</u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Tiền cọc:</strong>{" "}
                    <u>{myContract.deposit.toLocaleString("vi-VN")} ₫</u>
                  </p>
                </div>
              </div>
            </div>

            {/* Part 6: Payment Terms */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-bold mb-3">ĐIỀU KHOẢN THANH TOÁN:</h3>
              <p className="text-sm mb-2">
                <strong>Ngày thanh toán:</strong> Hàng{" "}
                <u className="ml-2">{myContract.paymentCycle}</u> vào ngày{" "}
                <u>{myContract.paymentDate}</u>
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Giá điện:</strong>{" "}
                    <u>
                      {myContract.electricityPrice.toLocaleString("vi-VN")}{" "}
                      ₫/kWh
                    </u>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Giá nước:</strong>{" "}
                    <u>{myContract.waterPrice.toLocaleString("vi-VN")} ₫/m³</u>
                  </p>
                </div>
              </div>
            </div>

            {/* Part 7: House Rules */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold mb-3">NỘI QUY & ĐIỀU KHOẢN:</h3>
              <div className="bg-gray-50 p-4 border border-gray-300 rounded text-sm">
                <p className="whitespace-pre-wrap text-xs leading-relaxed font-mono">
                  {myContract.houseRules}
                </p>
              </div>
            </div>

            {/* Part 8: Signatures */}
            <div className="mt-8 pt-8 border-t-2 border-gray-800">
              <p className="text-center font-bold mb-8">
                KÝ XÁC NHẬN CỦA CÁC BÊN
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="font-bold mb-12">BÊN CHO THUÊ</p>
                  <p className="text-sm">(Chữ ký và họ tên)</p>
                  <div className="h-12"></div>
                  <p className="text-sm">{myContract.landlordName}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-12">BÊN THUÊ</p>
                  <p className="text-sm">(Chữ ký và họ tên)</p>
                  <div className="h-12"></div>
                  <p className="text-sm">{myContract.tenantName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-8 text-center">
            <span
              className={`inline-block px-6 py-2 rounded-full font-bold text-white ${
                myContract.status === "Hoạt động"
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {myContract.status}
            </span>
          </div>
        </div>

        {/* Additional Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6 no-print">
          <h3 className="font-bold text-blue-900 mb-4">
            📋 Thông Tin Quan Trọng
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • <strong>Hạn hợp đồng:</strong> {myContract.startDate} -{" "}
              {myContract.endDate}
            </li>
            <li>
              • <strong>Tiền cọc sẽ hoàn lại</strong> sau khi kết thúc hợp đồng
              (trừ các khoản phạt)
            </li>
            <li>
              • <strong>Liên hệ chủ nhà:</strong> {myContract.landlordPhone}
            </li>
            <li>
              • <strong>Thanh toán:</strong> Ngày {myContract.paymentDate} hàng{" "}
              {myContract.paymentCycle}
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MyContractsPage;
