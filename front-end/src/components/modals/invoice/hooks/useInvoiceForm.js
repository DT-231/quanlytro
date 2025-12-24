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
  const [contractId, setContractId] = useState(null);

  const [formData, setFormData] = useState({
    buildingId: "",
    roomId: "",
    tenantName: "",
    billingMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    dueDate: "",
    numberOfPeople: 1,
    elecOld: 0,
    elecNew: "",
    internetFee: 0,
    parkingFee: 0,
    notes: "",
    // service_fees format mới: {name, amount, description}
    services: [
      { name: "Tiền rác", amount: 30000, description: "" },
    ],
  });

  // --- LOGIC TÍNH TOÁN ---
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
      Number(formData.numberOfPeople) || 
      Number(activeRoomData.current_occupants || activeRoomData.capacity) || 1
    );

    const elecUsage = Math.max(
      0,
      (Number(formData.elecNew) || 0) - (Number(formData.elecOld) || 0)
    );
    const elecTotal = Math.round(elecUsage * priceElec);

    const waterUsage = numPeople;
    const waterTotal = Math.round(numPeople * priceWaterPerson);

    // Tính tổng service fees (dùng amount thay vì price)
    const servicesTotal = Math.round(
      formData.services.reduce(
        (acc, curr) => acc + (Number(curr.amount) || 0),
        0
      )
    );

    // Thêm internet và parking fee
    const internetFee = Math.round(Number(formData.internetFee) || 0);
    const parkingFee = Math.round(Number(formData.parkingFee) || 0);

    const totalAmount = Math.round(
      roomPrice + elecTotal + waterTotal + servicesTotal + internetFee + parkingFee
    );

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
      internetFee,
      parkingFee,
      totalAmount,
    };
  }, [formData, rooms, roomDetail]);

  // --- EFFECTS ---
  useEffect(() => {
    if (!isOpen) {
      setFormData((prev) => ({
        ...prev,
        buildingId: "",
        roomId: "",
        tenantName: "",
        elecNew: "",
        numberOfPeople: 1,
        internetFee: 0,
        parkingFee: 0,
        notes: "",
        services: [
          { name: "Tiền rác", amount: 30000, description: "" },
        ],
      }));
      setRoomDetail(null);
      setContractId(null);
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
    // RoomOption từ API có: id, room_number, tenant_name, tenant_id, contract_id
    const basicRoom = rooms.find((r) => r.id === roomId);
    
    // Lưu contract_id từ dropdown
    if (basicRoom?.contract_id) {
      setContractId(basicRoom.contract_id);
    }
    
    setFormData((prev) => ({
      ...prev,
      roomId,
      tenantName: basicRoom?.tenant_name || "Đang tải...",
      elecNew: "",
    }));

    try {
      const res = await roomService.getById(roomId);
      const fullRoomData = res?.data || res;
      console.log("Room detail:", fullRoomData);

      if (fullRoomData) {
        setRoomDetail(fullRoomData);
        
        // Lấy contract_id từ room detail nếu chưa có
        const roomContractId = 
          fullRoomData.tenants?.[0]?.contract_id ||
          fullRoomData.current_contract_id ||
          fullRoomData.contract_id;
        
        if (roomContractId && !contractId) {
          setContractId(roomContractId);
        }

        // Lấy số người từ room
        const numPeople = fullRoomData.current_occupants || fullRoomData.capacity || 1;

        // Parse default_service_fees từ room -> services cho invoice
        let roomServices = [{ name: "Tiền rác", amount: 30000, description: "" }]; // default
        if (fullRoomData.default_service_fees && fullRoomData.default_service_fees.length > 0) {
          roomServices = fullRoomData.default_service_fees.map(fee => ({
            name: fee.name || "",
            amount: parseFloat(fee.amount) || 0,
            description: fee.description || "",
          }));
        }

        setFormData((prev) => ({
          ...prev,
          tenantName:
            fullRoomData.tenants?.length > 0
              ? fullRoomData.tenants[0].tenant_name
              : basicRoom?.tenant_name || "Chưa có khách",
          elecOld: fullRoomData.current_electricity_index || 0,
          numberOfPeople: numPeople,
          services: roomServices,
        }));
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết phòng:", error);
      toast.error("Không tải được chi tiết phòng.");
    }
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    // Convert field name: price -> amount (backward compat với UI cũ)
    const actualField = field === 'price' ? 'amount' : field;
    newServices[index][actualField] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", amount: 0, description: "" }],
    }));
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  // --- HÀM SUBMIT ---
  const handleSubmit = async () => {
    if (!formData.roomId) return toast.error("Vui lòng chọn phòng!");
    if (!formData.dueDate) return toast.error("Vui lòng chọn hạn thanh toán!");

    // Lấy contract_id từ state hoặc từ rooms dropdown
    const activeContractId = contractId || rooms.find(r => r.id === formData.roomId)?.contract_id;

    if (!activeContractId) {
      return toast.error(
        "Phòng này chưa có hợp đồng đang hoạt động! Không thể tạo hóa đơn."
      );
    }

    setLoading(true);
    try {
      // Format billing_month thành YYYY-MM-01
      const billingMonth = `${formData.billingMonth}-01`;

      // Chuẩn bị payload theo InvoiceCreate schema
      const payload = {
        contract_id: activeContractId,
        billing_month: billingMonth,
        due_date: formData.dueDate,
        
        // Chỉ số điện nước
        electricity_old_index: Number(formData.elecOld) || 0,
        electricity_new_index: Number(formData.elecNew) || 0,
        number_of_people: Number(formData.numberOfPeople) || 1,
        
        // Phí internet và gửi xe (optional)
        internet_fee: Number(formData.internetFee) || null,
        parking_fee: Number(formData.parkingFee) || null,
        
        // Service fees với format {name, amount, description}
        service_fees: formData.services
          .filter(s => s.name && s.amount > 0)
          .map(s => ({
            name: s.name,
            amount: Number(s.amount) || 0,
            description: s.description || null,
          })),
        
        notes: formData.notes || null,
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
    contractId,
    handleRoomChange,
    handleServiceChange,
    addService,
    removeService,
    handleSubmit,
  };
};
