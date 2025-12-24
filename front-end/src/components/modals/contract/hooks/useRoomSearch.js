import { useState, useEffect } from "react";
import { roomService } from "@/services/roomService";

/**
 * Lọc phòng có thể tạo hợp đồng: AVAILABLE hoặc OCCUPIED còn chỗ trống
 * @param {Array} rooms - Danh sách phòng
 * @returns {Array} - Phòng đủ điều kiện
 */
function filterAvailableRooms(rooms) {
  return rooms.filter((room) => {
    const currentOccupants = room.current_occupants || 0;
    const capacity = room.capacity || 1;
    // Phòng trống hoặc phòng chưa đầy
    return room.status === "AVAILABLE" || 
           (room.status === "OCCUPIED" && currentOccupants < capacity);
  });
}

export function useRoomSearch(rooms) {
  const [roomQuery, setRoomQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!roomQuery) {
      // Lọc phòng có thể tạo hợp đồng
      setSearchResults(filterAvailableRooms(rooms));
      return;
    }

    const searchRooms = async () => {
      try {
        // Không filter status, lấy cả AVAILABLE và OCCUPIED
        const res = await roomService.getAll({ 
          size: 100, 
          search: roomQuery
        });

        let fetchedRooms = [];
        if (res?.data?.items) fetchedRooms = res.data.items;
        else if (res?.items) fetchedRooms = res.items;
        
        // Lọc phòng còn chỗ trống
        setSearchResults(filterAvailableRooms(fetchedRooms));
      } catch (error) {
        console.error("Lỗi tìm kiếm phòng:", error);
        const filtered = rooms.filter((room) => {
          const searchStr = `${room.room_number} ${room.building_name || ''}`.toLowerCase();
          return searchStr.includes(roomQuery.toLowerCase());
        });
        setSearchResults(filterAvailableRooms(filtered));
      }
    };

    const timeoutId = setTimeout(searchRooms, 300);
    return () => clearTimeout(timeoutId);
  }, [roomQuery, rooms]);

  return { roomQuery, setRoomQuery, searchResults, setSearchResults };
}
