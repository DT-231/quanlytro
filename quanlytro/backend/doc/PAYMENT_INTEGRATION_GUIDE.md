# 💳 Payment Integration - PayOS & COD

## Tổng Quan

Hệ thống hỗ trợ 2 phương thức thanh toán:
1. **Banking (PayOS)**: Thanh toán qua QR code ngân hàng
2. **COD (Cash on Delivery)**: Thanh toán tiền mặt

## Flow Thanh Toán

### 1. Banking (PayOS)

```
[Người thuê] -> Xem hóa đơn -> Chọn "Banking" 
              -> API tạo QR code (PayOS)
              -> Quét QR và thanh toán
              -> PayOS gửi webhook
              -> Status = COMPLETED ✅
```

**Steps:**
1. Người thuê gọi API `POST /api/v1/payments/create-payos`
2. Backend tạo payment record (status=PENDING)
3. Backend gọi PayOS API để tạo QR code
4. Frontend hiển thị QR code cho người thuê
5. Người thuê quét QR và thanh toán qua app ngân hàng
6. PayOS gửi webhook đến `POST /api/v1/payments/webhook/payos`
7. Backend xác thực signature và cập nhật payment (status=COMPLETED)
8. Invoice được đánh dấu là đã thanh toán

### 2. COD (Cash)

```
[Người thuê] -> Xem hóa đơn -> Chọn "COD"
              -> Nhập thông tin người nhận
              -> Status = PENDING ⏳
              -> Đưa tiền cho chủ nhà
              -> [Chủ nhà] Nhấn "Xác nhận"
              -> Status = COMPLETED ✅
```

**Steps:**
1. Người thuê gọi API `POST /api/v1/payments/create-cod`
2. Backend tạo payment record (status=PENDING)
3. Người thuê đưa tiền mặt cho chủ nhà
4. Chủ nhà gọi API `POST /api/v1/payments/confirm-cod`
5. Backend cập nhật payment (status=COMPLETED)

## API Endpoints

### 1. Tạo Payment Banking (PayOS)

**POST** `/api/v1/payments/create-payos`

**Request:**
```json
{
  "invoice_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "payment_id": "123e4567-e89b-12d3-a456-426614174001",
  "payos_order_id": 123456789,
  "checkout_url": "https://payos.vn/checkout/...",
  "qr_code": "https://img.vietqr.io/...",
  "amount": "1500000.00",
  "description": "P101-INV-202401-001"
}
```

**Frontend Implementation:**
```javascript
async function createPayOSPayment(invoiceId) {
  const response = await fetch('/api/v1/payments/create-payos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ invoice_id: invoiceId })
  });
  
  const data = await response.json();
  
  // Hiển thị QR code
  document.getElementById('qr-image').src = data.qr_code;
  
  // Hoặc redirect đến checkout URL
  window.location.href = data.checkout_url;
}
```

---

### 2. Tạo Payment COD

**POST** `/api/v1/payments/create-cod`

**Request:**
```json
{
  "invoice_id": "123e4567-e89b-12d3-a456-426614174000",
  "cod_receiver_name": "Nguyễn Văn A",
  "cod_receiver_phone": "0912345678",
  "note": "Giao tiền buổi chiều"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "payment_id": "123e4567-e89b-12d3-a456-426614174002",
  "invoice_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": "1500000.00",
  "method": "cod",
  "status": "pending",
  "cod_receiver_name": "Nguyễn Văn A",
  "cod_receiver_phone": "0912345678",
  "note": "Giao tiền buổi chiều",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### 3. Xác Nhận COD (Landlord Only)

**POST** `/api/v1/payments/confirm-cod`

**Request:**
```json
{
  "payment_id": "123e4567-e89b-12d3-a456-426614174002",
  "note": "Đã nhận tiền mặt từ khách"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "payment_id": "123e4567-e89b-12d3-a456-426614174002",
  "status": "completed",
  "paid_at": "2024-01-15T14:30:00Z",
  "note": "Giao tiền buổi chiều\n[Landlord confirmed] Đã nhận tiền mặt từ khách"
}
```

---

### 4. PayOS Webhook (Internal)

**POST** `/api/v1/payments/webhook/payos`

Endpoint này được PayOS gọi tự động khi thanh toán thành công.

**Request (từ PayOS):**
```json
{
  "data": {
    "orderCode": 123456789,
    "amount": 1500000,
    "description": "P101-INV-202401-001",
    "accountNumber": "123456789",
    "reference": "FT123456789",
    "transactionDateTime": "2024-01-15T10:30:00Z",
    "currency": "VND",
    "paymentLinkId": "abc123",
    "code": "00",
    "desc": "Thanh toán thành công",
    "counterAccountBankName": "Vietcombank",
    "counterAccountNumber": "9876543210"
  },
  "signature": "abc123def456..."
}
```

**Response:**
```json
{
  "status": "success",
  "payment_id": "123e4567-e89b-12d3-a456-426614174002",
  "amount": 1500000.0
}
```

**⚠️ Lưu ý:** Cần config webhook URL trong PayOS dashboard:
```
https://your-domain.com/api/v1/payments/webhook/payos
```

---

### 5. Lấy Thông Tin Payment

**GET** `/api/v1/payments/{payment_id}`

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "payment_id": "123e4567-e89b-12d3-a456-426614174002",
  "invoice_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": "1500000.00",
  "method": "banking",
  "status": "completed",
  "bank_name": "Vietcombank",
  "banking_transaction_id": "FT123456789",
  "paid_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### 6. Lấy Payments Của Invoice

**GET** `/api/v1/payments/invoice/{invoice_id}`

**Response:**
```json
{
  "payments": [
    {
      "id": "...",
      "payment_id": "...",
      "amount": "1500000.00",
      "method": "banking",
      "status": "completed",
      "paid_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## Database Schema

### Table: payments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (BaseModel) |
| payment_id | UUID | Unique payment identifier |
| invoice_id | UUID | FK to invoices |
| payer_id | UUID | FK to users |
| amount | DECIMAL(10,2) | Số tiền thanh toán |
| **method** | **ENUM** | **'banking', 'cod', 'other'** |
| **status** | **ENUM** | **'pending', 'completed', 'failed', 'cancelled'** |
| bank_name | VARCHAR(100) | Tên ngân hàng (banking) |
| bank_account_number | VARCHAR(50) | Số TK ngân hàng (banking) |
| banking_transaction_id | VARCHAR(100) | Mã GD ngân hàng (banking) |
| cod_receiver_name | VARCHAR(200) | Tên người nhận (COD) |
| cod_receiver_phone | VARCHAR(20) | SĐT người nhận (COD) |
| paid_at | TIMESTAMP | Thời gian thanh toán |
| proof_url | TEXT | URL ảnh chứng từ |
| note | TEXT | Ghi chú |
| created_at | TIMESTAMP | Thời gian tạo |
| updated_at | TIMESTAMP | Thời gian cập nhật |

---

## Setup & Configuration

### 1. Cài Đặt PayOS

**Bước 1:** Đăng ký tài khoản tại https://payos.vn

**Bước 2:** Lấy credentials từ PayOS Dashboard:
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`

**Bước 3:** Thêm vào file `.env.development`:
```bash
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_RETURN_URL=http://localhost:3000/payment/success
PAYOS_CANCEL_URL=http://localhost:3000/payment/cancel
```

**Bước 4:** Config webhook URL trong PayOS Dashboard:
```
https://your-domain.com/api/v1/payments/webhook/payos
```

### 2. Run Migration

```bash
cd backend

# Run migration
alembic upgrade head

# Hoặc nếu có lỗi, reset database
alembic downgrade base
alembic upgrade head
```

### 3. Test APIs

```bash
# Test tạo PayOS payment
curl -X POST http://localhost:8000/api/v1/payments/create-payos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"invoice_id": "123e4567-e89b-12d3-a456-426614174000"}'

# Test tạo COD payment
curl -X POST http://localhost:8000/api/v1/payments/create-cod \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoice_id": "123e4567-e89b-12d3-a456-426614174000",
    "cod_receiver_name": "Nguyễn Văn A",
    "cod_receiver_phone": "0912345678"
  }'

# Test xác nhận COD
curl -X POST http://localhost:8000/api/v1/payments/confirm-cod \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LANDLORD_TOKEN" \
  -d '{
    "payment_id": "123e4567-e89b-12d3-a456-426614174002",
    "note": "Đã nhận tiền"
  }'
```

---

## Frontend Integration Guide

### Invoice Detail Page

```jsx
import { useState } from 'react';

function InvoiceDetailPage({ invoiceId }) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [qrCode, setQrCode] = useState('');
  
  const handlePayment = async () => {
    if (paymentMethod === 'banking') {
      // Tạo PayOS payment
      const response = await fetch('/api/v1/payments/create-payos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      
      const data = await response.json();
      setQrCode(data.qr_code);
      
      // Hoặc redirect
      // window.location.href = data.checkout_url;
      
    } else if (paymentMethod === 'cod') {
      // Tạo COD payment
      const response = await fetch('/api/v1/payments/create-cod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          cod_receiver_name: 'Chủ nhà',
          cod_receiver_phone: '0912345678'
        })
      });
      
      const data = await response.json();
      alert('Payment COD đã được tạo. Vui lòng đưa tiền cho chủ nhà.');
    }
  };
  
  return (
    <div>
      <h1>Chi Tiết Hóa Đơn</h1>
      
      {/* Invoice details */}
      <div>...</div>
      
      {/* Payment method selection */}
      <div>
        <label>
          <input
            type="radio"
            value="banking"
            checked={paymentMethod === 'banking'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Banking (PayOS)
        </label>
        
        <label>
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          COD (Cash)
        </label>
      </div>
      
      <button onClick={handlePayment}>Thanh Toán</button>
      
      {/* Display QR code */}
      {qrCode && (
        <div>
          <h3>Quét QR Code để thanh toán</h3>
          <img src={qrCode} alt="QR Code" />
        </div>
      )}
    </div>
  );
}
```

### Landlord Confirm COD

```jsx
function PendingPaymentsList() {
  const [payments, setPayments] = useState([]);
  
  const confirmCOD = async (paymentId) => {
    const response = await fetch('/api/v1/payments/confirm-cod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${landlordToken}`
      },
      body: JSON.stringify({
        payment_id: paymentId,
        note: 'Đã nhận tiền mặt'
      })
    });
    
    if (response.ok) {
      alert('Xác nhận thanh toán thành công');
      // Reload list
    }
  };
  
  return (
    <div>
      <h2>Payments Chờ Xác Nhận</h2>
      {payments.map(payment => (
        <div key={payment.id}>
          <p>Amount: {payment.amount}</p>
          <p>Receiver: {payment.cod_receiver_name}</p>
          <button onClick={() => confirmCOD(payment.payment_id)}>
            Xác Nhận Đã Nhận Tiền
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Unit Tests

```python
# tests/test_payment_api.py

def test_create_payos_payment():
    response = client.post(
        "/api/v1/payments/create-payos",
        json={"invoice_id": str(invoice_id)},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert "qr_code" in response.json()

def test_create_cod_payment():
    response = client.post(
        "/api/v1/payments/create-cod",
        json={
            "invoice_id": str(invoice_id),
            "cod_receiver_name": "Test",
            "cod_receiver_phone": "0912345678"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
```

---

## Troubleshooting

### 1. PayOS API Error

**Problem:** `PayOS Error: Invalid credentials`

**Solution:**
- Kiểm tra `.env` có đúng credentials không
- Kiểm tra PayOS account còn active không

### 2. Webhook Không Nhận Được

**Problem:** Thanh toán thành công nhưng status vẫn pending

**Solution:**
- Kiểm tra webhook URL đã config đúng chưa
- Kiểm tra logs: `docker-compose logs -f api`
- Test webhook locally với ngrok:
  ```bash
  ngrok http 8000
  # Update webhook URL: https://xxx.ngrok.io/api/v1/payments/webhook/payos
  ```

### 3. Migration Error

**Problem:** `relation "payment_method" already exists`

**Solution:**
```bash
# Drop và recreate
alembic downgrade -1
alembic upgrade head
```

---

## Security Considerations

1. **Webhook Signature:** Always verify PayOS webhook signature
2. **Authorization:** Check user permissions before confirming COD
3. **Idempotency:** Prevent duplicate payments (check existing payments)
4. **HTTPS:** Always use HTTPS in production for webhook
5. **Rate Limiting:** Implement rate limiting on payment endpoints

---

## Production Checklist

- [ ] Set real PayOS credentials in production `.env`
- [ ] Update webhook URL in PayOS dashboard
- [ ] Enable HTTPS for webhook endpoint
- [ ] Add logging and monitoring
- [ ] Implement retry mechanism for failed webhooks
- [ ] Add email notifications for payment confirmations
- [ ] Implement refund flow (if needed)
- [ ] Add payment history page
- [ ] Test with real payments (small amounts)

---

**Happy Coding! 💰**
