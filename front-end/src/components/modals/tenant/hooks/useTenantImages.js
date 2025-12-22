import { useState, useRef } from "react";

export const useTenantImages = () => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === "front") setFrontImage({ file, preview: previewUrl });
      else setBackImage({ file, preview: previewUrl });
    }
  };

  const removeImage = (type) => {
    if (type === "front") {
      setFrontImage(null);
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setBackImage(null);
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  const resetImages = () => {
    setFrontImage(null);
    setBackImage(null);
  };

  return {
    frontImage, setFrontImage,
    backImage, setBackImage,
    frontInputRef, backInputRef,
    handleImageChange, removeImage, resetImages
  };
};