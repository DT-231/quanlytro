import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { roomSchema } from "../schema/roomSchema";
import { buildingService } from "@/services/buildingService";
import { roomTypeService } from "@/services/roomTypeService";
import { roomService } from "@/services/roomService";

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const useRoomForm = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  // Quản lý tiện ích
  const [availableAmenities, setAvailableAmenities] = useState([
    { id: "ac", label: "Điều hoà", checked: false },
    { id: "kitchen", label: "Bếp", checked: false },
    { id: "bed", label: "Giường", checked: false },
    { id: "tv", label: "TV", checked: false },
    { id: "balcony", label: "Ban công", checked: false },
    { id: "window", label: "Cửa sổ", checked: false },
    { id: "wifi", label: "Wifi", checked: false },
    { id: "fridge", label: "Tủ lạnh", checked: false },
    { id: "wm", label: "Máy giặt", checked: false },
  ]);

  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: "",
      room_name: "",
      status: "AVAILABLE",
      building_id: "",
      room_type_id: "",
      area: 0,
      capacity: 2,
      description: "",
      base_price: 0,
      deposit_amount: 0,
      electricity_cost: 3500,
      water_cost: 20000,
      extraCosts: [{ name: "Tiền rác", price: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "extraCosts",
  });

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const [buildingRes, roomTypeRes] = await Promise.all([
            buildingService.getAll(),
            roomTypeService.getSimpleList(),
          ]);
          const rawBuildings = buildingRes?.data;
          const listBuildings = Array.isArray(rawBuildings)
            ? rawBuildings
            : rawBuildings?.data || rawBuildings?.items || [];
          setBuildings(listBuildings);
          const responseBody = roomTypeRes?.data;
          let listTypes = [];

          if (responseBody?.data && Array.isArray(responseBody.data)) {
            listTypes = responseBody.data;
          } else if (Array.isArray(responseBody)) {
            listTypes = responseBody;
          } else if (responseBody?.items && Array.isArray(responseBody.items)) {
            listTypes = responseBody.items;
          }
          setRoomTypes(listTypes);
        } catch (error) {
          console.error("Lỗi lấy danh mục:", error);
          toast.error("Không thể tải danh sách tòa nhà/loại phòng");
        }
      };
      fetchCategories();
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && initialData) {
      const fetchRoomDetail = async () => {
        try {
          const res = await roomService.getById(initialData.id);
          const data = res.data;

          if (data) {
            // Parse default_service_fees thành extraCosts format
            let extraCostsData = [];
            if (data.default_service_fees && data.default_service_fees.length > 0) {
              extraCostsData = data.default_service_fees.map(fee => ({
                name: fee.name,
                price: fee.amount || 0
              }));
            } else if (data.extra_costs && data.extra_costs.length > 0) {
              // Fallback cho data cũ
              extraCostsData = data.extra_costs;
            }
            
            form.reset({
              room_number: data.room_number,
              room_name: data.room_name,
              status: data.status,
              building_id: data.building_id || data.building?.id || "",
              room_type_id: data.room_type_id || data.room_type?.id || "",
              area: data.area,
              capacity: data.capacity,
              description: data.description,
              base_price: data.base_price,
              deposit_amount: data.deposit_amount,
              electricity_cost: data.electricity_price,
              water_cost: data.water_price_per_person,
              extraCosts: extraCostsData.length > 0 ? extraCostsData : [],
            });

            if (extraCostsData.length > 0) {
              replace(extraCostsData);
            }

            const currentUtils = data.utilities || [];
            setAvailableAmenities((prev) =>
              prev.map((a) => ({
                ...a,
                checked: currentUtils.includes(a.label),
              }))
            );

            if (data.photos && data.photos.length > 0) {
              const oldImages = data.photos.map((p) => ({
                id: p.id,
                preview: p.url || p.image_base64,
                isOld: true,
              }));
              setSelectedImages(oldImages);
            }
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết phòng:", error);
          toast.error("Không thể tải thông tin phòng");
        }
      };
      fetchRoomDetail();
    } else if (isOpen && !initialData) {
      form.reset({
        room_number: "",
        room_name: "",
        status: "AVAILABLE",
        building_id: "",
        room_type_id: "",
        area: 0,
        capacity: 2,
        description: "",
        base_price: 0,
        deposit_amount: 0,
        electricity_cost: 3500,
        water_cost: 20000,
        extraCosts: [{ name: "Tiền rác", price: 0 }],
      });
      setSelectedImages([]);
      setAvailableAmenities((prev) =>
        prev.map((item) => ({ ...item, checked: false }))
      );
      setActiveTab("info");
    }
  }, [isOpen, initialData, form, replace]);

  // Logic Ảnh
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 10) {
      toast.error("Tối đa 10 ảnh.");
      return;
    }
    const newImages = files.map((file) => ({
      file: file,
      preview: URL.createObjectURL(file),
      isOld: false, // Ảnh mới
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];

      if (!newImages[index].isOld) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Logic Tiện ích
  const toggleAmenity = (id) => {
    setAvailableAmenities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddNewAmenity = (name) => {
    const newId = name.toLowerCase().replace(/\s+/g, "-");
    const exists = availableAmenities.find(
      (a) => a.id === newId || a.label.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      setAvailableAmenities([
        ...availableAmenities,
        { id: newId, label: name, checked: true },
      ]);
    } else {
      setAvailableAmenities((prev) =>
        prev.map((a) =>
          a.id === newId || a.label.toLowerCase() === name.toLowerCase()
            ? { ...a, checked: true }
            : a
        )
      );
    }
  };

  // SUBMIT
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const selectedAmenities = availableAmenities
        .filter((item) => item.checked)
        .map((item) => item.label);

      const newPhotos = await Promise.all(
        selectedImages
          .filter((img) => !img.isOld)
          .map(async (img) => ({
            image_base64: await fileToBase64(img.file),
          }))
      );
      const keepPhotoIds = selectedImages
        .filter((img) => img.isOld)
        .map((img) => img.id);

      const finalData = {
        building_id: values.building_id,
        room_type_id: values.room_type_id,
        room_number: values.room_number,
        room_name: values.room_name,
        area: values.area,
        capacity: values.capacity,
        base_price: values.base_price,
        electricity_price: values.electricity_cost,
        water_price_per_person: values.water_cost,
        deposit_amount: values.deposit_amount,
        status: values.status,
        description: values.description || "",
        utilities: selectedAmenities,
        // Gửi default_service_fees với format {name, amount}
        default_service_fees: (values.extraCosts || []).map(cost => ({
          name: cost.name,
          amount: cost.price || 0,
          description: ""
        })),
        new_photos: newPhotos,
        keep_photo_ids: keepPhotoIds,
      };

      console.log("Payload:", finalData);

      if (initialData) {
        await roomService.update(initialData.id, finalData);
        toast.success("Cập nhật phòng thành công!");
      } else {
        const createPayload = {
          ...finalData,
          photos: newPhotos.map((p, index) => ({
            ...p,
            is_primary: index === 0,
            sort_order: index,
          })),
        };
        await roomService.create(createPayload);
        toast.success("Thêm phòng thành công!");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi submit:", error);
      toast.error("Có lỗi xảy ra, vui lòng kiểm tra lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    activeTab,
    setActiveTab,
    buildings,
    roomTypes,
    isSubmitting,
    selectedImages,
    availableAmenities,
    fileInputRef,
    fields,
    append,
    remove,
    handleFileSelect,
    removeImage,
    toggleAmenity,
    handleAddNewAmenity,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
