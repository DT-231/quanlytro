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
          roomService.getAll({ size: 100 }),
          userService.getAll({ size: 100, role_code: "TENANT" }),
        ]);

        if (resRooms?.data?.items) {
          setRooms(resRooms.data.items);
        } else if (resRooms?.items) {
          setRooms(resRooms.items);
        } else {
          setRooms([]);
        }

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
