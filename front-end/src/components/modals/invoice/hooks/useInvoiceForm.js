import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { invoiceService } from "@/services/invoiceService";
import { roomService } from "@/services/roomService";

const DEFAULT_PRICES = {
  ELEC: 3500,
  WATER_PERSON: 100000,
};

export const useInvoiceForm = ({ isOpen, buildings, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomDetail, setRoomDetail] = useState(null);

  const [formData, setFormData] = useState({
    buildingId: "",
    roomId: "",
    tenantName: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "PENDING",
    paidAmount: 0,
    elecOld: 0,
    elecNew: "",
    services: [
      { name: "Tiền rác", price: 30000 },
      { name: "Tiền giữ xe", price: 100000 },
    ],
  });

  // --- LOGIC TÍNH TOÁN (Giữ nguyên) ---
  const calculations = useMemo(() => {
    const listRoomInfo = rooms.find((r) => r.id === formData.roomId) || {};
    const activeRoomData =
      roomDetail && roomDetail.id === formData.roomId
        ? roomDetail
        : listRoomInfo;

    const roomPrice = Math.round(
      Number(activeRoomData.price || activeRoomData.base_price) || 0
    );
    const priceElec = Math.round(
      Number(activeRoomData.electricity_price) || DEFAULT_PRICES.ELEC
    );
    const priceWaterPerson = Math.round(
      Number(activeRoomData.water_price_per_person) ||
        DEFAULT_PRICES.WATER_PERSON
    );
    const numPeople = Math.round(
      Number(activeRoomData.current_occupants || activeRoomData.capacity) || 1
    );

    const elecUsage = Math.max(
      0,
      (Number(formData.elecNew) || 0) - (Number(formData.elecOld) || 0)
    );
    const elecTotal = Math.round(elecUsage * priceElec);

    const waterUsage = numPeople;
    const waterTotal = Math.round(numPeople * priceWaterPerson);

    const servicesTotal = Math.round(
      formData.services.reduce(
        (acc, curr) => acc + (Number(curr.price) || 0),
        0
      )
    );

    const totalAmount = Math.round(
      roomPrice + elecTotal + waterTotal + servicesTotal
    );
    const remaining =
      totalAmount - Math.round(Number(formData.paidAmount) || 0);

    return {
      priceElec,
      priceWaterPerson,
      roomPrice,
      elecUsage,
      elecTotal,
      waterUsage,
      waterTotal,
      numPeople,
      servicesTotal,
      totalAmount,
      remaining,
    };
  }, [formData, rooms, roomDetail]);

  // --- EFFECTS (Giữ nguyên) ---
  useEffect(() => {
    if (!isOpen) {
      setFormData((prev) => ({
        ...prev,
        buildingId: "",
        roomId: "",
        tenantName: "",
        elecNew: "",
        paidAmount: 0,
        services: [
          { name: "Tiền rác", price: 30000 },
          { name: "Tiền giữ xe", price: 100000 },
        ],
      }));
      setRoomDetail(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.buildingId) {
      const fetchRooms = async () => {
        try {
          const res = await invoiceService.getRoomsByBuilding(
            formData.buildingId
          );
          const roomList = Array.isArray(res) ? res : res?.data || [];
          setRooms(roomList);
        } catch (error) {
          console.error(error);
          setRooms([]);
        }
      };
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [formData.buildingId]);

  // --- ACTIONS ---
  const handleRoomChange = async (roomId) => {
    const basicRoom = rooms.find((r) => r.id === roomId);
    setFormData((prev) => ({
      ...prev,
      roomId,
      tenantName: basicRoom?.tenant_name || "Đang tải...",
      elecNew: "",
    }));

    try {
      const res = await roomService.getById(roomId);
      const fullRoomData = res?.data || res;

      if (fullRoomData) {
        setRoomDetail(fullRoomData);

        setFormData((prev) => ({
          ...prev,
          tenantName:
            fullRoomData.tenant_info?.tenant_name ||
            fullRoomData.tenant_name ||
            "Chưa có khách",
          elecOld: fullRoomData.current_electricity_index || 0,
        }));
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết phòng:", error);
      toast.error("Không tải được chi tiết phòng.");
    }
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", price: 0 }],
    }));
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  // --- HÀM SUBMIT QUAN TRỌNG (ĐÃ SỬA) ---
  const handleSubmit = async () => {
    if (!formData.roomId) return toast.error("Vui lòng chọn phòng!");

    const contractId =
      roomDetail?.tenant_info?.contract_id ||
      roomDetail?.current_contract_id ||
      roomDetail?.contract_id;

    if (!contractId) {
      return toast.error(
        "Phòng này chưa có hợp đồng đang hoạt động! Không thể tạo hóa đơn."
      );
    }

    setLoading(true);
    try {
      const invoiceDateObj = new Date(formData.invoiceDate);
      const year = invoiceDateObj.getFullYear();
      const month = String(invoiceDateObj.getMonth() + 1).padStart(2, "0");
      const billingMonth = `${year}-${month}-01`;

      const payload = {
        contract_id: contractId,
        billing_month: billingMonth,
        due_date: formData.dueDate,

        room_id: formData.roomId,
        building_id: formData.buildingId,
        invoice_date: formData.invoiceDate,
        status: formData.status,

        electricity_old_index: formData.elecOld,
        electricity_new_index: Number(formData.elecNew),
        electricity_usage: calculations.elecUsage, 
        electricity_cost: calculations.elecTotal, 
        water_cost: calculations.waterTotal,
        room_price: calculations.roomPrice,
        service_fee: calculations.servicesTotal,
        total_amount: calculations.totalAmount,
        paid_amount: Number(formData.paidAmount),
        services_detail: formData.services,
      };
      console.log("Payload gửi đi:", payload);

      await invoiceService.create(payload);
      toast.success("Tạo hóa đơn thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi API:", error);
      const msg =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    rooms,
    loading,
    calculations,
    handleRoomChange,
    handleServiceChange,
    addService,
    removeService,
    handleSubmit,
  };
};