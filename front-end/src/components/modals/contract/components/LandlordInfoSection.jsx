import React from "react";

export default function LandlordInfoSection({ landlordInfo }) {
  return (
    <div className="p-5 rounded-xl border-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
          A
        </div>
        Bên A - Chủ nhà trọ (Bên cho thuê)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Họ và tên
          </label>
          <div className="px-4 py-2.5 bg-white border-2 rounded-lg text-gray-900 font-medium">
            {landlordInfo.name}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Số CCCD/CMND
          </label>
          <div className="px-4 py-2.5 bg-white border-2 rounded-lg text-gray-900 font-medium">
            {landlordInfo.cccd}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Số điện thoại
          </label>
          <div className="px-4 py-2.5 bg-white border-2 rounded-lg text-gray-900 font-medium">
            {landlordInfo.phone}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Địa chỉ
          </label>
          <div className="px-4 py-2.5 bg-white border-2 rounded-lg text-gray-900 font-medium">
            {landlordInfo.address}
          </div>
        </div>
      </div>
    </div>
  );
}
