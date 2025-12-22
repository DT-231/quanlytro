import React, { useState, useEffect } from "react";
// Import UI dùng chung
import GenericCombobox from "@/components/GenericCombobox"; 
// Import Service lấy API
import { getCity, getWard } from "@/services/locationService";

export default function AddressSelector({ 
  city, 
  ward, 
  onCityChange, 
  onWardChange,
  showWard = true,
  cityLabel = "Thành phố / Tỉnh",
}) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);


  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCity(true);
      try {
        const res = await getCity();
        const data = res.data || res;
        if (Array.isArray(data)) setProvinces(data);
      } catch (err) {
        console.error("Lỗi tải tỉnh thành:", err);
      } finally {
        setLoadingCity(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      const selectedProvince = provinces.find(p => p.name === city || p.full_name === city);
      
      if (selectedProvince && showWard) {
        setLoadingWard(true);
        try {
          const res = await getWard(selectedProvince.id);
          const data = res.data || res;
          if (Array.isArray(data)) setDistricts(data);
        } catch (err) {
          console.error("Lỗi tải quận huyện:", err);
        } finally {
          setLoadingWard(false);
        }
      } else {
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [city, provinces, showWard]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={showWard ? "col-span-1" : "col-span-2"}>
        <label className="text-xs font-semibold mb-2 block">
            {cityLabel} 
        </label>
        <GenericCombobox
          value={city}
          onChange={(val) => {
            onCityChange(val);
            if (showWard) onWardChange(""); 
          }}
          options={provinces}
          loading={loadingCity}
          placeholder={`Chọn ${cityLabel}`}
          searchPlaceholder="Tìm tỉnh..."
        />
      </div>

      {showWard && (
        <div className="col-span-1">
          <label className="text-xs font-semibold mb-2 block">Quận / Huyện</label>
          <GenericCombobox
            value={ward}
            onChange={onWardChange}
            options={districts}
            loading={loadingWard}
            placeholder="Chọn Quận/Huyện"
            searchPlaceholder="Tìm quận..."
          />
        </div>
      )}
    </div>
  );
}