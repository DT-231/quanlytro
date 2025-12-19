# Hướng dẫn Frontend - Tạo Hóa Đơn

## Flow tạo hóa đơn

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Chọn Tòa   │ --> │ Chọn Phòng  │ --> │ Lấy Thông   │ --> │  Tạo Hóa    │
│   Nhà       │     │             │     │ Tin Hợp Đồng│     │   Đơn       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Bước 1: Lấy danh sách tòa nhà

### API Endpoint
```http
GET /api/v1/invoices/buildings
```

### Request
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/invoices/buildings' \
  -H 'Authorization: Bearer {access_token}'
```

### Response
```json
{
  "success": true,
  "message": "Lấy danh sách tòa nhà thành công",
  "data": [
    {
      "id": "8590e05c-d0f9-4c06-acab-504e572607bb",
      "building_name": "Vincom Office Đà Nẵng"
    },
    {
      "id": "abc-123-def",
      "building_name": "Chung cư Hoàng Anh Gia Lai"
    }
  ]
}
```

### Frontend Usage
```javascript
// Fetch danh sách tòa nhà
const fetchBuildings = async () => {
  const response = await fetch('/api/v1/invoices/buildings', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data; // Array of buildings
};

// Hiển thị dropdown
<select onChange={(e) => setSelectedBuilding(e.target.value)}>
  <option value="">-- Chọn tòa nhà --</option>
  {buildings.map(b => (
    <option key={b.id} value={b.id}>{b.building_name}</option>
  ))}
</select>
```

---

## Bước 2: Lấy danh sách phòng theo tòa nhà

### API Endpoint
```http
GET /api/v1/invoices/buildings/{building_id}/rooms
```

### Request
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/invoices/buildings/8590e05c-d0f9-4c06-acab-504e572607bb/rooms' \
  -H 'Authorization: Bearer {access_token}'
```

### Response
```json
{
  "success": true,
  "message": "Lấy danh sách phòng thành công",
  "data": [
    {
      "id": "cc712c15-d8f5-4945-9574-566fde1a848b",
      "room_number": "A101",
      "tenant_name": "Nguyễn Văn Tú",
      "tenant_id": "f0fbe733-3f90-4e3f-a684-deb960eccb52",
      "contract_id": "49e2ff44-5000-46f9-b168-eb38ccf1c13d"
    },
    {
      "id": "xyz-456-ghi",
      "room_number": "A102",
      "tenant_name": "Trần Thị Mai",
      "tenant_id": "user-789-jkl",
      "contract_id": "contract-abc-123"
    }
  ]
}
```

**Lưu ý**: Chỉ trả về các phòng có hợp đồng ACTIVE

### Frontend Usage
```javascript
// Fetch phòng theo building_id
const fetchRooms = async (buildingId) => {
  const response = await fetch(`/api/v1/invoices/buildings/${buildingId}/rooms`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data;
};

// Khi chọn tòa nhà
const handleBuildingChange = async (buildingId) => {
  setSelectedBuilding(buildingId);
  const roomsData = await fetchRooms(buildingId);
  setRooms(roomsData);
  setSelectedRoom(null); // Reset phòng đã chọn
};

// Hiển thị dropdown phòng
<select onChange={(e) => {
  const room = rooms.find(r => r.id === e.target.value);
  setSelectedRoom(room);
}}>
  <option value="">-- Chọn phòng --</option>
  {rooms.map(r => (
    <option key={r.id} value={r.id}>
      {r.room_number} - {r.tenant_name}
    </option>
  ))}
</select>
```

---

## Bước 3: Lấy thông tin hợp đồng (Auto-fill)

### API Endpoint
```http
GET /api/v1/contracts/{contract_id}
```

### Request
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/contracts/49e2ff44-5000-46f9-b168-eb38ccf1c13d' \
  -H 'Authorization: Bearer {access_token}'
```

### Response
```json
{
  "success": true,
  "message": "Lấy thông tin hợp đồng thành công",
  "data": {
    "id": "49e2ff44-5000-46f9-b168-eb38ccf1c13d",
    "contract_number": "HD001",
    "room_id": "cc712c15-d8f5-4945-9574-566fde1a848b",
    "tenant_id": "f0fbe733-3f90-4e3f-a684-deb960eccb52",
    "rental_price": "6500000.00",
    "electricity_price": "3500.00",
    "water_price": "80000.00",
    "number_of_tenants": 1,
    "start_date": "2025-12-14",
    "end_date": "2026-12-14",
    "status": "ACTIVE"
  }
}
```

### Frontend Usage - Auto Fill Form
```javascript
// Khi chọn phòng, fetch thông tin hợp đồng
const handleRoomChange = async (room) => {
  setSelectedRoom(room);
  
  // Fetch contract details
  const response = await fetch(`/api/v1/contracts/${room.contract_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  const contract = data.data;
  
  // Auto-fill form
  setFormData({
    building_id: selectedBuilding,
    room_id: room.id,
    tenant_id: room.tenant_id,
    
    // Auto-fill từ contract
    number_of_people: contract.number_of_tenants, // Số người ở = số người trong HĐ
    
    // Hiển thị thông tin tham khảo (không gửi lên)
    rental_price: contract.rental_price,
    electricity_unit_price: contract.electricity_price,
    water_unit_price: contract.water_price,
    
    // User nhập
    billing_month: '',
    due_date: '',
    electricity_old_index: '',
    electricity_new_index: '',
    internet_fee: '',
    parking_fee: '',
    service_fees: [],
    notes: ''
  });
};
```

---

## Bước 4: Tạo hóa đơn

### API Endpoint
```http
POST /api/v1/invoices
```

### Request Body
```json
{
  "building_id": "8590e05c-d0f9-4c06-acab-504e572607bb",
  "room_id": "cc712c15-d8f5-4945-9574-566fde1a848b",
  "tenant_id": "f0fbe733-3f90-4e3f-a684-deb960eccb52",
  "billing_month": "2025-12-01",
  "due_date": "2025-12-15",
  "electricity_old_index": 100,
  "electricity_new_index": 150,
  "number_of_people": 1,
  "internet_fee": 100000,
  "parking_fee": 50000,
  "service_fees": [
    {
      "name": "Thang máy",
      "amount": 50000,
      "description": "Phí thang máy tháng 12"
    },
    {
      "name": "Vệ sinh",
      "amount": 30000,
      "description": ""
    }
  ],
  "notes": "Hóa đơn tháng 12/2025"
}
```

### Request Example
```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/invoices' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "building_id": "8590e05c-d0f9-4c06-acab-504e572607bb",
  "room_id": "cc712c15-d8f5-4945-9574-566fde1a848b",
  "tenant_id": "f0fbe733-3f90-4e3f-a684-deb960eccb52",
  "billing_month": "2025-12-01",
  "due_date": "2025-12-15",
  "electricity_old_index": 100,
  "electricity_new_index": 150,
  "number_of_people": 1,
  "internet_fee": 100000,
  "parking_fee": 50000,
  "service_fees": [
    {"name": "Thang máy", "amount": 50000}
  ]
}'
```

### Response
```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công",
  "data": {
    "id": "invoice-uuid",
    "invoice_number": "INV-202512-001",
    "contract_id": "49e2ff44-5000-46f9-b168-eb38ccf1c13d",
    "billing_month": "2025-12-01",
    "due_date": "2025-12-15",
    "status": "PENDING",
    "room_number": "A101",
    "building_name": "Vincom Office Đà Nẵng",
    "tenant_name": "Nguyễn Văn Tú",
    "room_price": "6500000.00",
    "electricity_old_index": 100,
    "electricity_new_index": 150,
    "electricity_usage": 50,
    "electricity_unit_price": "3500.00",
    "electricity_cost": "175000.00",
    "number_of_people": 1,
    "water_unit_price": "80000.00",
    "water_cost": "80000.00",
    "service_fee": "80000.00",
    "internet_fee": "100000.00",
    "parking_fee": "50000.00",
    "other_fees": "0.00",
    "other_fees_description": "Thang máy: 50,000đ",
    "total_amount": "6985000.00",
    "notes": "Hóa đơn tháng 12/2025",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z"
  }
}
```

### Frontend Usage - Submit Form
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const invoiceData = {
    building_id: formData.building_id,
    room_id: formData.room_id,
    tenant_id: formData.tenant_id,
    billing_month: formData.billing_month,
    due_date: formData.due_date,
    electricity_old_index: parseFloat(formData.electricity_old_index),
    electricity_new_index: parseFloat(formData.electricity_new_index),
    number_of_people: parseInt(formData.number_of_people),
    internet_fee: parseFloat(formData.internet_fee) || null,
    parking_fee: parseFloat(formData.parking_fee) || null,
    service_fees: formData.service_fees,
    notes: formData.notes
  };
  
  try {
    const response = await fetch('/api/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invoiceData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Tạo hóa đơn thành công!');
      // Redirect hoặc reset form
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    alert('Có lỗi xảy ra khi tạo hóa đơn');
  }
};
```

---

## Complete React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const CreateInvoiceForm = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    building_id: '',
    room_id: '',
    tenant_id: '',
    billing_month: '',
    due_date: '',
    electricity_old_index: '',
    electricity_new_index: '',
    number_of_people: 1,
    internet_fee: '',
    parking_fee: '',
    service_fees: [],
    notes: ''
  });

  // 1. Load buildings on mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    const response = await fetch('/api/v1/invoices/buildings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setBuildings(data.data);
  };

  // 2. Load rooms when building changes
  const handleBuildingChange = async (buildingId) => {
    setSelectedBuilding(buildingId);
    setRooms([]);
    setSelectedRoom(null);
    
    if (buildingId) {
      const response = await fetch(`/api/v1/invoices/buildings/${buildingId}/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRooms(data.data);
    }
  };

  // 3. Auto-fill when room changes
  const handleRoomChange = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    setSelectedRoom(room);
    
    // Fetch contract để auto-fill
    const response = await fetch(`/api/v1/contracts/${room.contract_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const contract = data.data;
    
    setFormData(prev => ({
      ...prev,
      building_id: selectedBuilding,
      room_id: room.id,
      tenant_id: room.tenant_id,
      number_of_people: contract.number_of_tenants
    }));
  };

  // 4. Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Tạo hóa đơn thành công!');
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Chọn tòa nhà */}
      <div>
        <label>Tòa nhà</label>
        <select onChange={(e) => handleBuildingChange(e.target.value)} required>
          <option value="">-- Chọn tòa nhà --</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.building_name}</option>
          ))}
        </select>
      </div>

      {/* Chọn phòng */}
      <div>
        <label>Phòng</label>
        <select onChange={(e) => handleRoomChange(e.target.value)} required disabled={!selectedBuilding}>
          <option value="">-- Chọn phòng --</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>
              {r.room_number} - {r.tenant_name}
            </option>
          ))}
        </select>
      </div>

      {/* Các trường khác */}
      <div>
        <label>Tháng lập hóa đơn</label>
        <input 
          type="date" 
          value={formData.billing_month}
          onChange={(e) => setFormData({...formData, billing_month: e.target.value})}
          required 
        />
      </div>

      <div>
        <label>Hạn thanh toán</label>
        <input 
          type="date" 
          value={formData.due_date}
          onChange={(e) => setFormData({...formData, due_date: e.target.value})}
          required 
        />
      </div>

      <div>
        <label>Chỉ số điện cũ</label>
        <input 
          type="number" 
          value={formData.electricity_old_index}
          onChange={(e) => setFormData({...formData, electricity_old_index: e.target.value})}
        />
      </div>

      <div>
        <label>Chỉ số điện mới</label>
        <input 
          type="number" 
          value={formData.electricity_new_index}
          onChange={(e) => setFormData({...formData, electricity_new_index: e.target.value})}
        />
      </div>

      <div>
        <label>Số người ở</label>
        <input 
          type="number" 
          value={formData.number_of_people}
          onChange={(e) => setFormData({...formData, number_of_people: e.target.value})}
          required 
        />
      </div>

      <div>
        <label>Phí Internet</label>
        <input 
          type="number" 
          value={formData.internet_fee}
          onChange={(e) => setFormData({...formData, internet_fee: e.target.value})}
        />
      </div>

      <div>
        <label>Phí gửi xe</label>
        <input 
          type="number" 
          value={formData.parking_fee}
          onChange={(e) => setFormData({...formData, parking_fee: e.target.value})}
        />
      </div>

      <button type="submit">Tạo hóa đơn</button>
    </form>
  );
};
```

---

## Error Handling

### Common Errors

1. **Không tìm thấy hợp đồng ACTIVE**
```json
{
  "success": false,
  "message": "Không tìm thấy hợp đồng ACTIVE cho phòng này với người thuê đã chọn. Vui lòng kiểm tra lại thông tin hoặc tạo hợp đồng trước.",
  "data": {}
}
```

2. **Hóa đơn tháng đã tồn tại**
```json
{
  "success": false,
  "message": "Đã tồn tại hóa đơn cho tháng 12/2025",
  "data": {}
}
```

3. **Validation errors**
```json
{
  "success": false,
  "message": "Validation error",
  "data": {
    "errors": [
      {
        "field": "body -> electricity_new_index",
        "message": "Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số điện cũ",
        "type": "value_error"
      }
    ]
  }
}
```

---

## Notes

### Số người ở (number_of_people)
- Được auto-fill từ `contract.number_of_tenants`
- Dùng để tính tiền nước: `water_cost = number_of_people × water_unit_price`
- Chủ nhà có thể điều chỉnh nếu số người thực tế khác với hợp đồng

### Billing Month Format
- Nên dùng ngày đầu tháng: `2025-12-01` thay vì `2025-12-16`
- Backend sẽ dùng year/month để kiểm tra trùng lặp

### Service Fees
- `service_fees`: Array các phí dịch vụ (thang máy, vệ sinh, rác...)
- `internet_fee`: Phí internet riêng
- `parking_fee`: Phí gửi xe riêng
- Tổng tất cả sẽ được tính vào `total_amount`

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/invoices/buildings` | Lấy danh sách tòa nhà |
| GET | `/api/v1/invoices/buildings/{building_id}/rooms` | Lấy danh sách phòng theo tòa |
| GET | `/api/v1/contracts/{contract_id}` | Lấy thông tin hợp đồng |
| POST | `/api/v1/invoices` | Tạo hóa đơn mới |
