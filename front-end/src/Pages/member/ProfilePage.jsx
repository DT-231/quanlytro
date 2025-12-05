import React from 'react';

const ProfilePage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hồ sơ cá nhân</h1>
      <div className="bg-white p-6 rounded-lg shadow border">
        <p><strong>Họ tên:</strong> Nguyễn Văn A</p>
        <p><strong>Email:</strong> user@gmail.com</p>
        <p><strong>Phòng đang thuê:</strong> Phòng 101</p>
      </div>
    </div>
  );
};

// QUAN TRỌNG: Phải có dòng này thì Router mới import được
export default ProfilePage;