export const generateContractCode = () => {
  const timestamp = Date.now();
  const last6Digits = String(timestamp).slice(-6);
  return `INV-${last6Digits}`;
};

export const calculateEndDate = (startDate, months) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

export const validateCCCD = (cccd) => {
  if (!cccd || cccd.trim() === "") {
    return { valid: false, message: "Vui lòng nhập số CCCD/CMND của người thuê" };
  }
  if (cccd.length < 9 || cccd.length > 12) {
    return { valid: false, message: "Số CCCD/CMND phải từ 9-12 ký tự" };
  }
  return { valid: true };
};

export const formatServiceFeesPayload = (services) => {
  return services
    .filter((s) => s.name.trim() !== "")
    .map((s) => ({
      name: s.name,
      amount: s.amount || 0,
      description: s.description || "",
    }));
};

export const createContractPayload = (values, cccd, services) => {
  return {
    room_id: values.roomId,
    tenant_id: values.tenantId,
    tenant_cccd: cccd,
    contract_number: values.contractCode,
    start_date: values.startDate,
    end_date: values.endDate,
    rental_price: values.rentPrice,
    deposit_amount: values.deposit,
    payment_day: values.paymentDate,
    payment_cycle_months: parseInt(values.paymentCycle),
    electricity_price: values.electricityPrice,
    water_price: values.waterPrice,
    number_of_tenants: 1,
    terms_and_conditions: values.terms || "",
    notes: "",
    service_fees: formatServiceFeesPayload(services),
    status: values.status,
  };
};
