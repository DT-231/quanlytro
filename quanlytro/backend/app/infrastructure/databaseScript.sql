CREATE TYPE "status_type" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);

CREATE TYPE "room_status" AS ENUM (
  'AVAILABLE',
  'OCCUPIED',
  'MAINTENANCE',
  'RESERVED'
);

CREATE TYPE "contract_status" AS ENUM (
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'PENDING'
);

CREATE TYPE "invoice_status" AS ENUM (
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED'
);

CREATE TYPE "maintenance_priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE "maintenance_status" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "addresses" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "address_line" nvarchar(255) NOT NULL,
  "ward" nvarchar(100) NOT NULL,
  "city" nvarchar(100) NOT NULL,
  "country" nvarchar(100) DEFAULT 'Vietnam',
  "full_address" nvarchar(500),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "buildings" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "building_code" nvarchar(20) UNIQUE NOT NULL,
  "building_name" nvarchar(100) NOT NULL,
  "address_id" uuid NOT NULL,
  "total_floors" int,
  "description" nvarchar(max),
  "status" status_type DEFAULT 'ACTIVE',
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "role_code" varchar(20) UNIQUE NOT NULL,
  "role_name" nvarchar(50) NOT NULL,
  "description" nvarchar(max),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "first_name" nvarchar(50) NOT NULL,
  "last_name" nvarchar(50) NOT NULL,
  "password" varchar(255) NOT NULL,
  "email" varchar(100) UNIQUE NOT NULL,
  "phone" varchar(13),
  "cccd" varchar(20) UNIQUE,
  "date_of_birth" date,
  "role_id" uuid NOT NULL,
  "status" status_type DEFAULT 'ACTIVE',
  "is_temporary_residence" bit DEFAULT 0,
  "temporary_residence_date" date,
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "rooms" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "building_id" uuid NOT NULL,
  "room_number" nvarchar(20) NOT NULL,
  "room_name" nvarchar(100),
  "area" float,
  "capacity" int DEFAULT 1,
  "base_price" decimal(10,2) NOT NULL,
  "electricity_price" decimal(10,2),
  "water_price_per_person" decimal(10,2),
  "deposit_amount" decimal(10,2),
  "status" room_status DEFAULT 'AVAILABLE',
  "description" nvarchar(max),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "room_utilities" (
  "utility_id" uuid PRIMARY KEY DEFAULT (newid()),
  "room_id" uuid NOT NULL,
  "utility_name" nvarchar(100) NOT NULL,
  "description" nvarchar(max),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "contracts" (
  "contract_id" uuid PRIMARY KEY DEFAULT (newid()),
  "contract_number" nvarchar(50) UNIQUE NOT NULL,
  "room_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "rental_price" decimal(10,2) NOT NULL,
  "deposit_amount" decimal(10,2) NOT NULL,
  "payment_day" int,
  "number_of_tenants" int NOT NULL DEFAULT 1,
  "status" contract_status DEFAULT 'ACTIVE',
  "terms_and_conditions" nvarchar(max),
  "notes" nvarchar(max),
  "created_by" uuid,
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "invoices" (
  "invoice_id" uuid PRIMARY KEY DEFAULT (newid()),
  "invoice_number" nvarchar(50) UNIQUE NOT NULL,
  "contract_id" uuid NOT NULL,
  "billing_month" date NOT NULL,
  "room_price" decimal(10,2) NOT NULL,
  "electricity_old_index" float,
  "electricity_new_index" float,
  "electricity_unit_price" decimal(10,2) NOT NULL,
  "number_of_people" int NOT NULL DEFAULT 1,
  "water_unit_price" decimal(10,2) NOT NULL,
  "service_fee" decimal(10,2) DEFAULT 0,
  "internet_fee" decimal(10,2) DEFAULT 0,
  "parking_fee" decimal(10,2) DEFAULT 0,
  "other_fees" decimal(10,2) DEFAULT 0,
  "other_fees_description" nvarchar(max),
  "due_date" date NOT NULL,
  "status" invoice_status DEFAULT 'PENDING',
  "notes" nvarchar(max),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "payments" (
  "payment_id" uuid PRIMARY KEY DEFAULT (newid()),
  "invoice_id" uuid NOT NULL,
  "payer_id" uuid,
  "amount" decimal(10,2) NOT NULL,
  "method" nvarchar(50) NOT NULL,
  "paid_at" datetime2 NOT NULL DEFAULT (getdate()),
  "reference_code" nvarchar(100),
  "proof_url" nvarchar(max),
  "note" nvarchar(max)
);

CREATE TABLE "maintenance_requests" (
  "request_id" uuid PRIMARY KEY DEFAULT (newid()),
  "room_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "request_type" nvarchar(50) NOT NULL,
  "title" nvarchar(200) NOT NULL,
  "description" nvarchar(max) NOT NULL,
  "priority" maintenance_priority DEFAULT 'MEDIUM',
  "status" maintenance_status DEFAULT 'PENDING',
  "estimated_cost" decimal(10,2),
  "actual_cost" decimal(10,2),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate()),
  "completed_at" datetime2
);

CREATE TABLE "notifications" (
  "notification_id" uuid PRIMARY KEY DEFAULT (newid()),
  "user_id" uuid,
  "title" nvarchar(200) NOT NULL,
  "content" nvarchar(max) NOT NULL,
  "type" nvarchar(50) NOT NULL,
  "related_id" uuid,
  "related_type" nvarchar(50),
  "is_read" bit DEFAULT 0,
  "created_at" datetime2 DEFAULT (getdate()),
  "read_at" datetime2
);

CREATE TABLE "reviews" (
  "review_id" uuid PRIMARY KEY DEFAULT (newid()),
  "room_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "contract_id" uuid,
  "rating" int NOT NULL,
  "comment" nvarchar(max),
  "created_at" datetime2 DEFAULT (getdate()),
  "updated_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "building_photos" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "building_id" uuid NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "is_primary" bit DEFAULT 0,
  "sort_order" int DEFAULT 0,
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "room_photos" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "room_id" uuid NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "is_primary" bit DEFAULT 0,
  "sort_order" int DEFAULT 0,
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "user_documents" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "user_id" uuid NOT NULL,
  "document_type" nvarchar(20) NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "maintenance_photos" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "request_id" uuid NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "is_before" bit DEFAULT 1,
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "contract_documents" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "contract_id" uuid NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "document_type" nvarchar(20) DEFAULT 'CONTRACT',
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE TABLE "invoice_proofs" (
  "id" uuid PRIMARY KEY DEFAULT (newid()),
  "invoice_id" uuid NOT NULL,
  "url" nvarchar(500) NOT NULL,
  "uploaded_by" uuid NOT NULL,
  "created_at" datetime2 DEFAULT (getdate())
);

CREATE INDEX ON "addresses" ("city");

CREATE INDEX ON "addresses" ("city", "ward");

CREATE INDEX ON "buildings" ("building_code");

CREATE INDEX ON "buildings" ("status");

CREATE INDEX ON "buildings" ("address_id");

CREATE INDEX ON "roles" ("role_code");

CREATE INDEX ON "users" ("email");

CREATE INDEX ON "users" ("phone");

CREATE INDEX ON "users" ("cccd");

CREATE INDEX ON "users" ("role_id");

CREATE INDEX ON "users" ("status");

CREATE UNIQUE INDEX ON "rooms" ("building_id", "room_number");

CREATE INDEX ON "rooms" ("building_id");

CREATE INDEX ON "rooms" ("status");

CREATE INDEX ON "room_utilities" ("room_id");

CREATE UNIQUE INDEX ON "room_utilities" ("room_id", "utility_name");

CREATE INDEX ON "contracts" ("contract_number");

CREATE INDEX ON "contracts" ("room_id");

CREATE INDEX ON "contracts" ("tenant_id");

CREATE INDEX ON "contracts" ("status");

CREATE INDEX ON "contracts" ("start_date", "end_date");

CREATE INDEX ON "contracts" ("created_by");

CREATE INDEX ON "invoices" ("invoice_number");

CREATE INDEX ON "invoices" ("contract_id");

CREATE INDEX ON "invoices" ("billing_month");

CREATE INDEX ON "invoices" ("status");

CREATE INDEX ON "invoices" ("due_date");

CREATE UNIQUE INDEX ON "invoices" ("contract_id", "billing_month");

CREATE INDEX ON "payments" ("invoice_id");

CREATE INDEX ON "payments" ("payer_id");

CREATE INDEX ON "payments" ("paid_at");

CREATE INDEX ON "maintenance_requests" ("room_id");

CREATE INDEX ON "maintenance_requests" ("tenant_id");

CREATE INDEX ON "maintenance_requests" ("status");

CREATE INDEX ON "maintenance_requests" ("priority");

CREATE INDEX ON "notifications" ("user_id");

CREATE INDEX ON "notifications" ("is_read");

CREATE INDEX ON "notifications" ("created_at");

CREATE INDEX ON "notifications" ("type");

CREATE INDEX ON "reviews" ("room_id");

CREATE INDEX ON "reviews" ("tenant_id");

CREATE INDEX ON "reviews" ("rating");

CREATE INDEX ON "reviews" ("contract_id");

CREATE INDEX ON "building_photos" ("building_id");

CREATE INDEX ON "building_photos" ("building_id", "is_primary");

CREATE INDEX ON "room_photos" ("room_id");

CREATE INDEX ON "room_photos" ("room_id", "is_primary");

CREATE INDEX ON "user_documents" ("user_id");

CREATE INDEX ON "user_documents" ("user_id", "document_type");

CREATE INDEX ON "maintenance_photos" ("request_id");

CREATE INDEX ON "maintenance_photos" ("request_id", "is_before");

CREATE INDEX ON "contract_documents" ("contract_id");

CREATE INDEX ON "invoice_proofs" ("invoice_id");

COMMENT ON COLUMN "addresses"."address_line" IS 'Số nhà, tên đường';

COMMENT ON COLUMN "addresses"."ward" IS 'Phường/Xã';

COMMENT ON COLUMN "addresses"."city" IS 'Thành phố/Tỉnh';

COMMENT ON COLUMN "addresses"."full_address" IS 'Auto-generated: address_line, ward, city';

COMMENT ON TABLE "buildings" IS 'total_rooms được tính từ COUNT(rooms)';

COMMENT ON COLUMN "roles"."role_code" IS 'ADMIN,  TENANT, CUSTOMER';

COMMENT ON COLUMN "users"."cccd" IS 'Căn cước công dân';

COMMENT ON COLUMN "users"."is_temporary_residence" IS 'Tạm trú tạm vắng';

COMMENT ON TABLE "rooms" IS 'Không lưu floor_number vì có thể parse từ room_number hoặc lưu ở bảng riêng nếu cần';

COMMENT ON COLUMN "rooms"."room_number" IS 'Ví dụ: 101, A202';

COMMENT ON COLUMN "rooms"."room_name" IS 'Ví dụ: Căn hộ 1PN';

COMMENT ON COLUMN "rooms"."area" IS 'm²';

COMMENT ON COLUMN "rooms"."capacity" IS 'Số người tối đa';

COMMENT ON COLUMN "rooms"."base_price" IS 'Giá thuê cơ bản/tháng';

COMMENT ON COLUMN "rooms"."electricity_price" IS 'Giá điện/kWh';

COMMENT ON COLUMN "rooms"."water_price_per_person" IS 'Giá nước/người/tháng';

COMMENT ON COLUMN "rooms"."deposit_amount" IS 'Tiền cọc';

COMMENT ON COLUMN "room_utilities"."utility_name" IS 'Tủ lạnh, điều hòa, giường, tủ...';

COMMENT ON COLUMN "contracts"."rental_price" IS 'Giá thuê thỏa thuận';

COMMENT ON COLUMN "contracts"."deposit_amount" IS 'Tiền đặt cọc';

COMMENT ON COLUMN "contracts"."payment_day" IS 'Ngày thanh toán hàng tháng (1-31)';

COMMENT ON COLUMN "contracts"."number_of_tenants" IS 'Số người ở trong phòng để tính tiền nước';

COMMENT ON COLUMN "contracts"."terms_and_conditions" IS 'Các điều khoản, quy định trong hợp đồng';

COMMENT ON COLUMN "contracts"."created_by" IS 'Admin/Manager tạo hợp đồng';

COMMENT ON COLUMN "invoices"."billing_month" IS 'YYYY-MM-01 format';

COMMENT ON COLUMN "invoices"."electricity_old_index" IS 'Chỉ số điện cũ';

COMMENT ON COLUMN "invoices"."electricity_new_index" IS 'Chỉ số điện mới';

COMMENT ON COLUMN "invoices"."electricity_unit_price" IS 'Giá điện/kWh tại thời điểm lập HĐ';

COMMENT ON COLUMN "invoices"."number_of_people" IS 'Số người trong tháng';

COMMENT ON COLUMN "invoices"."water_unit_price" IS 'Giá nước/người tại thời điểm lập HĐ';

COMMENT ON COLUMN "invoices"."service_fee" IS 'Phí dịch vụ';

COMMENT ON COLUMN "invoices"."internet_fee" IS 'Phí internet';

COMMENT ON COLUMN "invoices"."parking_fee" IS 'Phí gửi xe';

COMMENT ON COLUMN "payments"."method" IS 'Cash, Bank Transfer, Momo, etc.';

COMMENT ON COLUMN "payments"."reference_code" IS 'Mã giao dịch ngân hàng';

COMMENT ON COLUMN "payments"."proof_url" IS 'URL ảnh chứng từ';

COMMENT ON COLUMN "maintenance_requests"."request_type" IS 'Plumbing, Electrical, AC, etc.';

COMMENT ON COLUMN "notifications"."type" IS 'INVOICE, CONTRACT, MAINTENANCE, SYSTEM';

COMMENT ON COLUMN "notifications"."related_id" IS 'ID của invoice, contract, etc.';

COMMENT ON COLUMN "notifications"."related_type" IS 'INVOICE, CONTRACT, MAINTENANCE, etc.';

COMMENT ON COLUMN "reviews"."rating" IS '1-5 stars';

COMMENT ON COLUMN "user_documents"."document_type" IS 'AVATAR, CCCD_FRONT, CCCD_BACK';

COMMENT ON COLUMN "maintenance_photos"."is_before" IS 'true=ảnh trước sửa, false=ảnh sau sửa';

COMMENT ON COLUMN "contract_documents"."document_type" IS 'CONTRACT, ADDENDUM, OTHER';

ALTER TABLE "buildings" ADD FOREIGN KEY ("address_id") REFERENCES "addresses" ("id");

ALTER TABLE "users" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");

ALTER TABLE "rooms" ADD FOREIGN KEY ("building_id") REFERENCES "buildings" ("id");

ALTER TABLE "room_utilities" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id");

ALTER TABLE "contracts" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id");

ALTER TABLE "contracts" ADD FOREIGN KEY ("tenant_id") REFERENCES "users" ("id");

ALTER TABLE "contracts" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "invoices" ADD FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id");

ALTER TABLE "payments" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("invoice_id");

ALTER TABLE "payments" ADD FOREIGN KEY ("payer_id") REFERENCES "users" ("id");

ALTER TABLE "maintenance_requests" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id");

ALTER TABLE "maintenance_requests" ADD FOREIGN KEY ("tenant_id") REFERENCES "users" ("id");

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "reviews" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id");

ALTER TABLE "reviews" ADD FOREIGN KEY ("tenant_id") REFERENCES "users" ("id");

ALTER TABLE "reviews" ADD FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id");

ALTER TABLE "building_photos" ADD FOREIGN KEY ("building_id") REFERENCES "buildings" ("id");

ALTER TABLE "building_photos" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");

ALTER TABLE "room_photos" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id");

ALTER TABLE "room_photos" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");

ALTER TABLE "user_documents" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_documents" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");

ALTER TABLE "maintenance_photos" ADD FOREIGN KEY ("request_id") REFERENCES "maintenance_requests" ("request_id");

ALTER TABLE "maintenance_photos" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");

ALTER TABLE "contract_documents" ADD FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id");

ALTER TABLE "contract_documents" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");

ALTER TABLE "invoice_proofs" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("invoice_id");

ALTER TABLE "invoice_proofs" ADD FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id");
