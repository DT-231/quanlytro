#!/bin/bash
# Test User Registration & Role Management

echo "=== Testing User Registration & Role Management ==="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:8000/api/v1"

# Test variables
ADMIN_TOKEN="your_admin_token_here"
TENANT_ID="tenant_id_after_creation"

echo -e "${YELLOW}=== Test 1: Register CUSTOMER (Public) ===${NC}"
echo "POST /auth/register"
curl -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Nguyen Van",
    "last_name": "A",
    "email": "customer@example.com",
    "password": "password123",
    "confirm_password": "password123"
  }' | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}=== Test 2: Login CUSTOMER ===${NC}"
echo "POST /auth/login"
curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }' | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}=== Test 3: Landlord Create TENANT (New User) ===${NC}"
echo "POST /auth/create-tenant"
curl -X POST "${BASE_URL}/auth/create-tenant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "first_name": "Tran Thi",
    "last_name": "B",
    "email": "tenant@example.com",
    "phone": "0912345678",
    "password": "password123",
    "confirm_password": "password123",
    "role_id": "00000000-0000-0000-0000-000000000000"
  }' | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}=== Test 4: Landlord Create TENANT (Upgrade from CUSTOMER) ===${NC}"
echo "POST /auth/create-tenant with existing CUSTOMER email"
curl -X POST "${BASE_URL}/auth/create-tenant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "first_name": "Nguyen Van",
    "last_name": "A",
    "email": "customer@example.com",
    "phone": "0923456789",
    "password": "password123",
    "confirm_password": "password123",
    "role_id": "00000000-0000-0000-0000-000000000000"
  }' | python3 -m json.tool
echo ""
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
echo ""
echo -e "${YELLOW}Flow Summary:${NC}"
echo "1. Public register → Role = CUSTOMER"
echo "2. Landlord create tenant → Role = TENANT (or upgrade CUSTOMER)"
echo "3. When contract created → CUSTOMER auto upgrade to TENANT"
