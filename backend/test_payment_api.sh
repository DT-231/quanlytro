#!/bin/bash
# Test Payment API Endpoints

echo "=== Testing Payment API ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8000/api/v1"

# You need to set these
ACCESS_TOKEN="your_access_token_here"
INVOICE_ID="your_invoice_id_here"
PAYMENT_ID="your_payment_id_here"

echo -e "${YELLOW}Note: Update ACCESS_TOKEN, INVOICE_ID in this script before running${NC}"
echo ""

# Test 1: Create PayOS Payment
echo -e "${YELLOW}1. Testing: Create PayOS Payment${NC}"
curl -X POST "${BASE_URL}/payments/create-payos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{\"invoice_id\": \"${INVOICE_ID}\"}" \
  | python3 -m json.tool
echo ""
echo ""

# Test 2: Create COD Payment
echo -e "${YELLOW}2. Testing: Create COD Payment${NC}"
curl -X POST "${BASE_URL}/payments/create-cod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "invoice_id": "'"${INVOICE_ID}"'",
    "cod_receiver_name": "Nguyễn Văn A",
    "cod_receiver_phone": "0912345678",
    "note": "Test COD payment"
  }' \
  | python3 -m json.tool
echo ""
echo ""

# Test 3: Get Payment by ID
echo -e "${YELLOW}3. Testing: Get Payment by ID${NC}"
curl -X GET "${BASE_URL}/payments/${PAYMENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  | python3 -m json.tool
echo ""
echo ""

# Test 4: Get Payments by Invoice
echo -e "${YELLOW}4. Testing: Get Payments by Invoice${NC}"
curl -X GET "${BASE_URL}/payments/invoice/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  | python3 -m json.tool
echo ""
echo ""

# Test 5: Confirm COD Payment (Landlord)
echo -e "${YELLOW}5. Testing: Confirm COD Payment${NC}"
curl -X POST "${BASE_URL}/payments/confirm-cod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
    \"payment_id\": \"${PAYMENT_ID}\",
    \"note\": \"Đã nhận tiền mặt\"
  }" \
  | python3 -m json.tool
echo ""
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
echo ""
echo -e "${YELLOW}Note: Some tests may fail if you haven't updated the variables above${NC}"
