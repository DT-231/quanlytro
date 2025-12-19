import { useState, useEffect } from "react";
import { roomService } from "@/services/roomService";

export function useRoomSearch(rooms) {
  const [roomQuery, setRoomQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!roomQuery) {
      setSearchResults(rooms);
      return;
    }

    const searchRooms = async () => {
      try {
        const res = await roomService.getAll({ 
          size: 50, 
          status: "AVAILABLE",
          search: roomQuery
        });

        if (res?.data?.items) setSearchResults(res.data.items);
        else if (res?.items) setSearchResults(res.items);
        else setSearchResults([]);
      } catch (error) {
        console.error("Lỗi tìm kiếm phòng:", error);
        const filtered = rooms.filter((room) => {
          const searchStr = `${room.room_number} ${room.building_name || ''}`.toLowerCase();
          return searchStr.includes(roomQuery.toLowerCase());
        });
        setSearchResults(filtered);
      }
    };

    const timeoutId = setTimeout(searchRooms, 300);
    return () => clearTimeout(timeoutId);
  }, [roomQuery, rooms]);

  return { roomQuery, setRoomQuery, searchResults, setSearchResults };
}
