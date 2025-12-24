import { useState, useEffect } from "react";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";

export function useContractData(isOpen) {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchResources = async () => {
      setLoadingData(true);
      try {
        const [resRooms, resTenants] = await Promise.all([
          // Lấy cả AVAILABLE và OCCUPIED để có thể tạo hợp đồng cho phòng ở ghép
          roomService.getAll({ size: 100 }),
          userService.getAll({ size: 100, role_code: "TENANT" }),
        ]);

        let fetchedRooms = [];
        if (resRooms?.data?.items) {
          fetchedRooms = resRooms.data.items;
        } else if (resRooms?.items) {
          fetchedRooms = resRooms.items;
        }
        
        // Filter phòng có thể tạo hợp đồng: AVAILABLE hoặc OCCUPIED còn chỗ
        const availableRooms = fetchedRooms.filter((room) => {
          const currentOccupants = room.current_occupants || 0;
          const capacity = room.capacity || 1;
          return room.status === "AVAILABLE" || 
                 (room.status === "OCCUPIED" && currentOccupants < capacity);
        });
        setRooms(availableRooms);

        if (resTenants?.data?.items) {
          setTenants(resTenants.data.items);
        } else if (resTenants?.items) {
          setTenants(resTenants.items);
        } else {
          setTenants([]);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchResources();
  }, [isOpen]);

  return { rooms, tenants, loadingData };
}
