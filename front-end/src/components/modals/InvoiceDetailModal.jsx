import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function InvoiceDetailModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 bg-white text-black overflow-hidden">


        <div className="p-6">
            {/* HEADER */}
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase">HÓA ĐƠN THUÊ PHÒNG</h2>
                <p className="text-sm text-gray-600">Địa chỉ: 07 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</p>
                <p className="text-sm text-gray-400 mt-1">Mã hóa đơn: {invoice.id}</p>
            </div>

            {/* INFO SECTION */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <h3 className="font-bold mb-1">Thông tin phòng</h3>
                    <p>Phòng: <span className="font-medium">{invoice.room}</span></p>
                    <p>Khách thuê: <span className="font-medium">{invoice.tenant}</span></p>
                    <p>Địa chỉ: Hải châu, đà nẵng</p>
                </div>
                <div>
                    <h3 className="font-bold mb-1">Thông tin thanh toán</h3>
                    <p>Ngày: {invoice.date}</p>
                    <p>Hạn thanh toán: {invoice.deadline}</p>
                    <p>Trạng thái: <span className="font-medium">{invoice.status}</span></p>
                </div>
            </div>

            {/* TABLE DETAILS */}
            <div className="border-t border-b border-gray-200 py-2 mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-2">STT</th>
                            <th className="text-left py-2">Nội dung</th>
                            <th className="text-center py-2">Số lượng</th>
                            <th className="text-right py-2">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {/* Dữ liệu giả lập chi tiết */}
                        <tr>
                            <td className="py-2">1</td>
                            <td>Tiền phòng</td>
                            <td className="text-center">1</td>
                            <td className="text-right">9.000.000đ</td>
                        </tr>
                        <tr>
                            <td className="py-2">2</td>
                            <td>Tiền điện</td>
                            <td className="text-center">{invoice.electricity} kwh</td>
                            <td className="text-right">200.000đ</td>
                        </tr>
                        <tr>
                            <td className="py-2">3</td>
                            <td>Tiền nước</td>
                            <td className="text-center">{invoice.water} m³</td>
                            <td className="text-right">255.000đ</td>
                        </tr>
                        <tr>
                            <td className="py-2">4</td>
                            <td>Tiền rác</td>
                            <td className="text-center">3 (tháng)</td>
                            <td className="text-right">100.000đ</td>
                        </tr>
                        <tr>
                            <td className="py-2">5</td>
                            <td>Tiền giữ xe</td>
                            <td className="text-center">3 (xe máy)</td>
                            <td className="text-right">100.000đ</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* TOTAL */}
            <div className="flex justify-between items-center font-bold text-base mb-1">
                <span>Tổng tiền</span>
                <span>9.655.000đ</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
                <span>Đã thanh toán</span>
                <span>0đ</span>
            </div>
            <div className="flex justify-between items-center font-bold text-base mb-6">
                <span>Còn lại</span>
                <span>9.655.000đ</span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 border-none text-black">Đóng</Button>
                <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 border-none text-black">Chia sẻ</Button>
                <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 border-none text-black">Tải work</Button>
                <Button className="bg-gray-900 text-white hover:bg-black">Xuất PDF</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}