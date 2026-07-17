import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Check, 
  Shirt, 
  AlertCircle, 
  ShoppingBag, 
  Sliders, 
  Type, 
  Palette, 
  Plus, 
  Minus, 
  Move, 
  Trash2, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Maximize2, 
  MessageCircle, 
  ChevronRight, 
  Info, 
  Award, 
  ShieldCheck, 
  Zap, 
  Eye,
  Folder,
  Image
} from "lucide-react";
import { DtfSettings, Product } from "../types";
import { db, storage, auth } from "../lib/firebase";
import MapAddressPicker from "./MapAddressPicker";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface SablonDtfViewProps {
  dtfSettings: DtfSettings;
  products: Product[];
  onAddToCart: (product: Product, sizeOrQuantity?: any, selectedSize?: string) => void;
}

export default function SablonDtfView({
  dtfSettings,
  products,
  onAddToCart
}: SablonDtfViewProps) {
  // Filter only plain t-shirts categorized under "Sablon DTF"
  const dtfProducts = products.filter((p) => p.category === "Sablon DTF");

  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    dtfProducts.length > 0 ? dtfProducts[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [designSize, setDesignSize] = useState<"logo" | "a5" | "a4" | "a3">("a4");
  const [customDesignFile, setCustomDesignFile] = useState<string | null>(null);
  const [customDesignUrl, setCustomDesignUrl] = useState<string>("");
  
  // Custom Text options
  const [customText, setCustomText] = useState<string>("");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [textFont, setTextFont] = useState<string>("Space Grotesk");
  const [textSize, setTextSize] = useState<number>(18);
  const [useTextOnly, setUseTextOnly] = useState<boolean>(false);

  // Layout Tab
  const [activeTab, setActiveTab] = useState<"studio" | "guide" | "gallery">("studio");
  
  // Flip shirt & transparency state
  const [isBackView, setIsBackView] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);

  // Shipping Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({ name: '', address: '', phone: '' });

  // Interactive Position, Scale, Rotation states for the mockup print layer
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(-20);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  // Photo Editor Filter & Transformation States
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [invert, setInvert] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);

  const bannerVideoRef = useRef<HTMLVideoElement>(null);
  const dtfYtId = dtfSettings.bannerVideo ? (() => {
    const match = dtfSettings.bannerVideo.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    return match ? match[1] : null;
  })() : null;

  useEffect(() => {
    const video = bannerVideoRef.current;
    if (video && !dtfYtId) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "true");
      video.setAttribute("playsinline", "true");

      const playVideo = () => {
        video.play().catch((err) => {
          console.log("DTF Banner Autoplay prevented:", err.message);
        });
      };

      const handleCanPlay = () => {
        playVideo();
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("loadedmetadata", handleCanPlay);

      // Force video load/reload when the source URL changes first
      video.load();

      // Then attempt to play
      playVideo();

      const resumePlay = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
        window.removeEventListener("click", resumePlay);
        window.removeEventListener("touchstart", resumePlay);
        window.removeEventListener("scroll", resumePlay, { capture: true });
        window.removeEventListener("mousemove", resumePlay);
        window.removeEventListener("keydown", resumePlay);
      };

      window.addEventListener("click", resumePlay);
      window.addEventListener("touchstart", resumePlay);
      window.addEventListener("scroll", resumePlay, { capture: true, passive: true });
      window.addEventListener("mousemove", resumePlay);
      window.addEventListener("keydown", resumePlay);

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("loadedmetadata", handleCanPlay);
        window.removeEventListener("click", resumePlay);
        window.removeEventListener("touchstart", resumePlay);
        window.removeEventListener("scroll", resumePlay, { capture: true });
        window.removeEventListener("mousemove", resumePlay);
        window.removeEventListener("keydown", resumePlay);
      };
    }
  }, [dtfSettings.bannerVideo, dtfYtId]);

  // Dragging event state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mockupContainerRef = useRef<HTMLDivElement>(null);

  // Design upload states
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const [orderMessage, setOrderMessage] = useState<string>("");

  // Firestore community gallery items
  const [galleryDesigns, setGalleryDesigns] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState<boolean>(false);

  // Customer special gallery states
  const [customerUploads, setCustomerUploads] = useState<any[]>([]);
  const [loadingCustomerUploads, setLoadingCustomerUploads] = useState<boolean>(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState<boolean>(false);

  // Load community gallery and customer uploads on mount
  useEffect(() => {
    fetchCommunityGallery();
    fetchCustomerUploads();
  }, []);

  const fetchCustomerUploads = async () => {
    setLoadingCustomerUploads(true);
    try {
      const q = query(collection(db, "customerUploads"), orderBy("uploadedAt", "desc"), limit(24));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCustomerUploads(items);
    } catch (err) {
      console.warn("Error fetching customer uploads from Firestore:", err);
      handleFirestoreError(err, OperationType.LIST, "customerUploads");
    } finally {
      setLoadingCustomerUploads(false);
    }
  };

  const saveToGalleryDirect = async (base64: string, fileName: string) => {
    setIsSavingToGallery(true);
    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const imageUrl = uploadData.url;

        await addDoc(collection(db, "customerUploads"), {
          imageUrl,
          fileName,
          uploadedAt: serverTimestamp(),
          userId: "customer-public",
          userEmail: "customer@public.com",
          note: `Unggahan - ${fileName}`
        });

        fetchCustomerUploads();
        setOrderMessage("Desain berhasil otomatis disimpan ke Galeri Penyimpanan Khusus!");
        setTimeout(() => setOrderMessage(""), 4000);
      }
    } catch (err) {
      console.error("Auto upload to gallery direct failed:", err);
      handleFirestoreError(err, OperationType.CREATE, "customerUploads");
    } finally {
      setIsSavingToGallery(false);
    }
  };

  const handleSaveToCustomerGallery = async () => {
    let designSrc = customDesignFile || customDesignUrl;
    if (!designSrc) return;

    setIsSavingToGallery(true);
    let finalUrl = designSrc;

    if (designSrc.startsWith("data:image")) {
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: designSrc })
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalUrl = uploadData.url;
        }
      } catch (err) {
        console.error("Local upload in save gallery failed:", err);
      }
    }

    try {
      await addDoc(collection(db, "customerUploads"), {
        imageUrl: finalUrl,
        fileName: "customer_upload_" + Date.now(),
        uploadedAt: serverTimestamp(),
        userId: "customer-public",
        userEmail: "customer@public.com",
        note: `Desain kustom oleh customer`
      });
      fetchCustomerUploads();
      setOrderMessage("Desain berhasil disimpan ke Galeri Penyimpanan Khusus Anda!");
      setTimeout(() => setOrderMessage(""), 4000);
    } catch (fsErr) {
      console.error("Error saving to customerUploads collection:", fsErr);
      handleFirestoreError(fsErr, OperationType.CREATE, "customerUploads");
    } finally {
      setIsSavingToGallery(false);
    }
  };

  const handleDeleteCustomerUpload = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus gambar ini dari galeri penyimpanan kustom Anda?")) return;
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "customerUploads", id));
      setCustomerUploads(prev => prev.filter(item => item.id !== id));
      setOrderMessage("Gambar berhasil dihapus dari penyimpanan khusus!");
      setTimeout(() => setOrderMessage(""), 4000);
    } catch (err) {
      console.error("Error deleting customer upload:", err);
      handleFirestoreError(err, OperationType.DELETE, `customerUploads/${id}`);
    }
  };

  const fetchCommunityGallery = async () => {
    setLoadingGallery(true);
    try {
      const q = query(collection(db, "designs"), orderBy("timestamp", "desc"), limit(12));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setGalleryDesigns(items);
    } catch (err) {
      console.warn("Firestore fetch error, loading beautiful aesthetic presets:", err);
      try {
        handleFirestoreError(err, OperationType.LIST, "designs");
      } catch (diagErr) {
        console.error("Diagnostics uploaded:", diagErr);
      }
      // Premium default preset gallery items
      setGalleryDesigns([
        {
          id: "preset-1",
          imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=300",
          note: "Design streetwear retro - Merah Combed 30s"
        },
        {
          id: "preset-2",
          imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=300",
          note: "Tokyo cyberpunk glow - Hitam Combed 30s"
        },
        {
          id: "preset-3",
          imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300",
          note: "Retro sunset outdoor - Putih Combed 30s"
        },
        {
          id: "preset-4",
          imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300",
          note: "Geometric cosmos - Navy Combed 30s"
        }
      ]);
    } finally {
      setLoadingGallery(false);
    }
  };

  // WhatsApp configuration
  const whatsappNumber = dtfSettings?.whatsappNumber || "6281219154973";
  const handleWhatsApp = () => {
    const textMsg = `Halo Admin A-GIN! Saya ingin memesan/berkonsultasi kustom sablon DTF.\n\nDetail Kaos: ${selectedProduct?.name || "Kaos Polos Combed"}\nUkuran Kaos: ${selectedSize}\nUkuran Sablon: ${designSize.toUpperCase()}\nPosisi: ${description || "Dada Depan"}\nJumlah: ${quantity} pcs.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMsg)}`, "_blank");
  };

  // Preset Design Samples (Clipart options for customers to test-play)
  const premiumPresets = [
    {
      name: "Cyber Streetwear",
      url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=300",
      description: "Desain cyberpunk warna warni futuristik"
    },
    {
      name: "Retro Outdoor",
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300",
      description: "Desain sunset pegunungan klasik"
    },
    {
      name: "Neon Sakura",
      url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=300",
      description: "Ilustrasi gerbang jepang bernuansa synthwave"
    },
    {
      name: "Cosmic Galaxy",
      url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300",
      description: "Abstrak nebula astronomi modern"
    }
  ];

  // Available t-shirt sizes with dimension details
  const sizes = [
    { code: "S", label: "47 x 67 cm" },
    { code: "M", label: "49 x 69 cm" },
    { code: "L", label: "51 x 71 cm" },
    { code: "XL", label: "53 x 73 cm" },
    { code: "XXL", label: "55 x 75 cm" },
    { code: "XXXL", label: "58 x 78 cm" }
  ];

  // Design sizes and additional pricing
  const designSizeOptions = [
    { value: "logo", label: "Logo Dada (10x10 cm)", surcharge: dtfSettings?.surchargeLogo !== undefined ? Number(dtfSettings.surchargeLogo) : 10000, width: "w-16 h-16 sm:w-20 sm:h-20" },
    { value: "a5", label: "A5 (15x21 cm)", surcharge: dtfSettings?.surchargeA5 !== undefined ? Number(dtfSettings.surchargeA5) : 20000, width: "w-24 h-32 sm:w-28 sm:h-36" },
    { value: "a4", label: "A4 (21x30 cm)", surcharge: dtfSettings?.surchargeA4 !== undefined ? Number(dtfSettings.surchargeA4) : 35000, width: "w-36 h-48 sm:w-44 sm:h-56" },
    { value: "a3", label: "A3 (30x42 cm)", surcharge: dtfSettings?.surchargeA3 !== undefined ? Number(dtfSettings.surchargeA3) : 55000, width: "w-48 h-64 sm:w-56 sm:h-72" }
  ];

  // Calculate size surcharge
  const getSizeSurcharge = (sz: string) => {
    if (sz === "XXL") return dtfSettings?.surchargeXXL !== undefined ? Number(dtfSettings.surchargeXXL) : 10000;
    if (sz === "XXXL") return dtfSettings?.surchargeXXXL !== undefined ? Number(dtfSettings.surchargeXXXL) : 15000;
    return 0;
  };

  // Get current prices
  const basePrice = selectedProduct ? selectedProduct.price : 55000;
  const sizeSurcharge = getSizeSurcharge(selectedSize);
  const dSizeSurcharge = designSizeOptions.find((opt) => opt.value === designSize)?.surcharge || 35000;
  const totalPricePerItem = dSizeSurcharge; // Only the printing / sablon price
  const totalOrderPrice = totalPricePerItem * quantity;

  // Handle Drag / Move Events on the print layer mockup
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - posX, y: e.clientY - posY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosX(e.clientX - dragStart.x);
    setPosY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for Mobile Dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - posX, y: e.touches[0].clientY - posY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setPosX(e.touches[0].clientX - dragStart.x);
    setPosY(e.touches[0].clientY - dragStart.y);
  };

  // File drop/input reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomDesignFile(base64);
        setCustomDesignUrl(""); // Clear other inputs
        setUseTextOnly(false);
        // Reset scale and position
        setPosX(0);
        setPosY(-20);
        setScale(1.0);
        setRotation(0);

        // Auto-save to dedicated customer uploads gallery
        saveToGalleryDirect(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag over dropzone
  const [dragOver, setDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomDesignFile(base64);
        setCustomDesignUrl("");
        setUseTextOnly(false);
        // Reset positioning
        setPosX(0);
        setPosY(-20);
        setScale(1.0);
        setRotation(0);

        // Auto-save to dedicated customer uploads gallery
        saveToGalleryDirect(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const bakeImageEdits = (
    imageSrc: string,
    b: number,
    c: number,
    s: number,
    hr: number,
    g: number,
    se: number,
    inv: number,
    fx: boolean,
    fy: boolean
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imageSrc);
            return;
          }

          // Apply filters
          ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${hr}deg) grayscale(${g}%) sepia(${se}%) invert(${inv}%)`;

          ctx.save();
          if (fx || fy) {
            ctx.translate(fx ? canvas.width : 0, fy ? canvas.height : 0);
            ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          const bakedUrl = canvas.toDataURL("image/png");
          resolve(bakedUrl);
        } catch (e) {
          console.error("Failed to bake image canvas edits:", e);
          resolve(imageSrc);
        }
      };
      img.onerror = () => {
        resolve(imageSrc);
      };
      img.src = imageSrc;
    });
  };

  // Handle local submit to cart & background sync to Firestore/Storage
  const handleAddCustomToCart = async () => {
    if (!selectedProduct) return;

    setUploading(true);
    let designSrc = customDesignFile || customDesignUrl || "";
    let finalImageUrl = designSrc;

    // Detect if any photo edits/filters were applied by the user
    const hasEdits = brightness !== 100 || contrast !== 100 || saturation !== 100 || hueRotate !== 0 || grayscale !== 0 || sepia !== 0 || invert !== 0 || flipX || flipY;

    if (designSrc && hasEdits) {
      try {
        const bakedDataUrl = await bakeImageEdits(
          designSrc,
          brightness,
          contrast,
          saturation,
          hueRotate,
          grayscale,
          sepia,
          invert,
          flipX,
          flipY
        );
        designSrc = bakedDataUrl;
        finalImageUrl = bakedDataUrl;
      } catch (err) {
        console.error("Failed to bake image edits, using original image:", err);
      }
    }

    // If design is base64 (or newly baked base64), compile/upload to local Express upload API (highly reliable, instant)
    if (designSrc && designSrc.startsWith("data:image")) {
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: designSrc })
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.url;

          // Save reference to Firestore public gallery so other customers get inspired
          try {
            await addDoc(collection(db, "designs"), {
              imageUrl: finalImageUrl,
              note: `Hasil Sablon kustom ${designSize.toUpperCase()} oleh customer (${selectedProduct.name.replace("Kaos Polos Cotton Combed 30s Premium - ", "")})`,
              timestamp: serverTimestamp()
            });
          } catch (fsErr) {
            console.warn("Could not write to Firestore designs collection:", fsErr);
          }
        } else {
          console.warn("Local server upload returned non-OK status, falling back to base64");
        }
      } catch (err) {
        console.error("Local server upload process failed, proceeding with base64 data URL:", err);
      }
    }

    const printLabel = designSizeOptions.find(o => o.value === designSize)?.label || "A4";
    const customName = `Jasa Cetak Sablon [${designSize.toUpperCase()}] (${selectedSize})`;
    
    let customDescription = `JASA CETAK SABLON DTF PREMIUM (Hanya Jasa Cetak)\n`;
    customDescription += `--------------------------------------\n`;
    customDescription += `• Catatan: Belum termasuk kaos polos (Beli kaos polos terpisah di halaman utama)\n`;
    customDescription += `• Ukuran Kaos Cetak: ${selectedSize}\n`;
    customDescription += `• Ukuran Sablon: ${printLabel}\n`;
    customDescription += `• Posisi Cetak: ${description || "Depan Dada (Tengah)"}\n`;
    if (customText) {
      customDescription += `• Kustom Teks: "${customText}" (Font: ${textFont}, Warna: ${textColor})\n`;
    }
    customDescription += `• Koordinat Desain: X: ${posX}px, Y: ${posY}px, Scale: ${scale.toFixed(1)}x, Rotasi: ${rotation}°\n`;
    
    // Add photo editor variables if any edits are present
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || hueRotate !== 0 || grayscale !== 0 || sepia !== 0 || invert !== 0 || flipX || flipY) {
      customDescription += `• Edit Foto: Brightness: ${brightness}%, Contrast: ${contrast}%, Saturation: ${saturation}%, Hue: ${hueRotate}°, Grayscale: ${grayscale}%, Sepia: ${sepia}%, Invert: ${invert}%, Flip Horisontal: ${flipX ? 'Ya' : 'Tidak'}, Flip Vertikal: ${flipY ? 'Ya' : 'Tidak'}\n`;
    }
    
    customDescription += `• Karakteristik Sablon: Elastis, Anti-Retak, Warna Terang Reaktif`;

    const customProduct: Product = {
      id: `custom-dtf-${Date.now()}`,
      name: customName,
      price: totalPricePerItem,
      originalPrice: undefined,
      image: selectedProduct.image, // Base shirt image
      images: [finalImageUrl || selectedProduct.image, selectedProduct.image],
      category: "Sablon DTF",
      stock: 999,
      description: customDescription,
      createdAt: Date.now()
    };

    onAddToCart(customProduct, quantity, selectedSize);

    setUploading(false);
    setOrderMessage("Pesanan Kustom berhasil dimasukkan ke keranjang!");
    setIsOrdered(true);

    // Refresh public inspiration list
    fetchCommunityGallery();

    setTimeout(() => {
      setIsOrdered(false);
      setOrderMessage("");
    }, 4000);
  };

  const handleSaveDesign = async () => {
    const designState = {
       designImage: customDesignFile || customDesignUrl || "",
       productName: selectedProduct?.name || "Kaos",
       selectedSize,
       designSize,
       isBackView,
       shippingData: shippingInfo
    };
    
    try {
      const res = await fetch("/api/save-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designState)
      });
      if (res.ok) {
         alert("Desain berhasil disimpan untuk ditinjau Admin!");
         setIsCheckoutOpen(false);
      } else {
         alert("Gagal menyimpan desain.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    }
  };

  const handleAutoCenter = () => {
    setPosX(0);
    setPosY(-20);
    setScale(1.0);
    setRotation(0);
  };

  const handleDownloadMockup = async () => {
    if (!mockupContainerRef.current) return;
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mockupContainerRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2 // High quality
      });
      
      const link = document.createElement("a");
      link.download = `GIN-DTF-Mockup-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      setOrderMessage("Mockup berhasil diunduh!");
      setTimeout(() => setOrderMessage(""), 3000);
    } catch (err) {
      console.error("Failed to generate mockup image:", err);
      alert("Gagal mengunduh mockup. Pastikan koneksi internet stabil.");
    }
  };

  const handleResetDesign = () => {
    setCustomDesignFile(null);
    setCustomDesignUrl("");
    setCustomText("");
    setPosX(0);
    setPosY(-20);
    setScale(1.0);
    setRotation(0);
    setUseTextOnly(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotate(0);
    setGrayscale(0);
    setSepia(0);
    setInvert(0);
    setFlipX(false);
    setFlipY(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 bg-slate-50/50">
      {/* DTF COVER BRANDING BANNER */}
      <div className="relative overflow-hidden h-[240px] md:h-[360px] rounded-3xl mx-4 md:mx-6 shadow-2xl border border-slate-200 bg-slate-950">
        {dtfSettings.bannerVideo ? (
          dtfYtId ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${dtfYtId}?autoplay=1&mute=1&loop=1&playlist=${dtfYtId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
                className="w-full h-full pointer-events-none opacity-50 scale-[1.35] origin-center"
                allow="autoplay; encrypted-media"
                title="DTF Banner Video"
              />
            </div>
          ) : (
            <video
              key={dtfSettings.bannerVideo}
              ref={bannerVideoRef}
              src={dtfSettings.bannerVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            />
          )
        ) : (
          <img
            src={dtfSettings.bannerImage || "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400"}
            alt="DTF Printing Studio"
            className="w-full h-full object-cover select-none opacity-80"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
              <Zap className="w-3 h-3 text-yellow-300 animate-pulse" />
              <span>SABLON DTF PROFESSIONAL</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-tight leading-none text-white uppercase">
              {dtfSettings.identityTitle || "A-GIN DTF & SABLON PREMIUM"}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-bold tracking-wide">
              {dtfSettings.identitySubtitle || "Hasil Cetak Detail Tinggi, Sangat Elastis, & Anti-Crack"}
            </p>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed max-w-xl hidden sm:block">
              {dtfSettings.description || "Kami menggunakan teknologi Digital Transfer Film tercanggih dengan tinta Plastisol Premium untuk menjamin hasil cetak sehalus sutra, lentur, dan tahan dicuci hingga puluhan kali."}
            </p>
          </div>
        </div>
      </div>

      {/* VIEW SELECTION TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 md:px-8">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab("studio")}
            className={`py-3.5 px-1 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "studio"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Studio Kustom Desain</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-3.5 px-1 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "guide"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Panduan Bahan & Ukuran</span>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`py-3.5 px-1 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "gallery"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Galeri Karya Customer</span>
          </button>
        </div>
        <button
          onClick={handleWhatsApp}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide rounded-full transition-all border border-emerald-200/60"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Tanya Admin</span>
        </button>
      </div>

      {/* RENDER PAGES BASED ON TAB */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start px-[4vw] py-4">
          {/* LEFT: PHYSICAL INTERACTIVE SIMULATOR (STAYS STICKY ON DESKTOP!) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 z-10 space-y-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black bg-slate-900 text-white py-1 px-3.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <Move className="w-3 h-3 text-red-500 animate-pulse" />
                    <span>Interactive Mockup Simulator</span>
                  </span>
                  <div className="flex gap-1">
                    <button onClick={handleAutoCenter} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200" title="Auto Center">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownloadMockup} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200" title="Download Mockup PNG">
                      <Folder className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsBackView(!isBackView)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200" title="Balik Kaos">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsTransparent(!isTransparent)} className={`p-2 rounded-xl text-slate-600 hover:bg-slate-200 ${isTransparent ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`} title="Hapus Background">
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsCheckoutOpen(true)} className="w-full py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">
                  Simpan Desain & Checkout
                </button>
              </div>

              {/* LIVE T-SHIRT INTERACTIVE STAGE */}
              <div 
                ref={mockupContainerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative aspect-square w-full rounded-3xl bg-radial from-slate-50 to-slate-100/90 shadow-xl overflow-hidden flex items-center justify-center select-none group border border-slate-200/50"
              >
                {/* T-Shirt Image Base */}
                <img
                  src={isBackView 
                    ? (selectedProduct?.images?.[1] || selectedProduct?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") 
                    : (selectedProduct?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")}
                  alt="Kaos Polos Base"
                  className="absolute inset-0 w-full h-full object-contain p-4 transition-all duration-300 pointer-events-none select-none"
                />

                {/* Printable Bounding Box Overlay according to Selected Size Option */}
                <div 
                  className={`absolute border border-dashed border-red-500/45 rounded flex items-center justify-center pointer-events-none ${
                    designSize === "logo" ? "w-[24%] h-[24%]" :
                    designSize === "a5" ? "w-[35%] h-[45%]" :
                    designSize === "a4" ? "w-[50%] h-[65%]" :
                    "w-[65%] h-[80%]" // A3
                  } transition-all duration-300`}
                >
                  {/* Visual bounding labels */}
                  <span className="absolute top-0 right-1 text-[7px] text-red-600/70 font-black tracking-widest bg-white/70 px-1 rounded-bl">
                    SAFE PRINT ZONE: {designSize.toUpperCase()}
                  </span>

                  {/* Interactive Drag Layer */}
                  {(customDesignFile || customDesignUrl || customText) && (
                    <div
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleMouseUp}
                      style={{
                        transform: `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotation}deg)`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                      }}
                      className="absolute p-2 flex flex-col items-center justify-center pointer-events-auto transition-transform duration-75 max-w-full max-h-full"
                    >
                      {/* Render Image overlay if present */}
                      {(customDesignFile || customDesignUrl) && !useTextOnly ? (
                        <div className="relative group/overlay">
                          <img
                            src={customDesignFile || customDesignUrl || ""}
                            alt="Mockup Layer"
                            style={{
                              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%)`,
                              mixBlendMode: isTransparent ? 'multiply' : 'normal',
                              transform: `${flipX ? 'scaleX(-1)' : ''} ${flipY ? 'scaleY(-1)' : ''}`
                            }}
                            className="max-h-36 sm:max-h-48 object-contain rounded drop-shadow-md select-none pointer-events-none"
                          />
                          <div className="absolute inset-0 border-2 border-transparent group-hover/overlay:border-red-500 transition-colors pointer-events-none rounded" />
                        </div>
                      ) : null}

                      {/* Render Custom text if present */}
                      {customText && (
                        <span
                          style={{
                            color: textColor,
                            fontFamily: textFont === "Space Grotesk" ? "Space Grotesk, sans-serif" :
                                        textFont === "Playfair Display" ? "Playfair Display, serif" :
                                        textFont === "JetBrains Mono" ? "JetBrains Mono, monospace" : "Inter, sans-serif",
                            fontSize: `${textSize}px`,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                          }}
                          className="font-extrabold text-center select-none pointer-events-none whitespace-pre-line tracking-wide drop-shadow-lg leading-tight p-1.5"
                        >
                          {customText}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Empty state overlay inside print zone */}
                  {!(customDesignFile || customDesignUrl || customText) && (
                    <div className="flex flex-col items-center justify-center p-4 text-center opacity-40">
                      <Layers className="w-6 h-6 text-slate-400 mb-1 animate-pulse" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Letakkan Desain Di Sini
                      </span>
                    </div>
                  )}
                </div>

                {/* Helpful drag indicator tooltips */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-black tracking-wider uppercase py-1 px-2.5 rounded-lg">
                  💡 Tips: Geser langsung gambar kustom Anda di kaos!
                </div>
              </div>

              {/* FINE TUNING DESIGN SLIDERS */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider block flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-600" />
                  <span>Pengaturan Posisi Desain Sablon</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                      <span>POSISI HORIZONTAL (X)</span>
                      <span className="text-slate-700 font-black">{posX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={posX}
                      onChange={(e) => setPosX(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                      <span>POSISI VERTIKAL (Y)</span>
                      <span className="text-slate-700 font-black">{posY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-160"
                      max="160"
                      value={posY}
                      onChange={(e) => setPosY(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                      <span>UKURAN DESAIN (SCALE)</span>
                      <span className="text-slate-700 font-black">{scale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                      <span>ROTASI DESAIN (DERAJAT)</span>
                      <span className="text-slate-700 font-black">{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* PHOTO EDITOR PANEL (LENGKAP) */}
              {((customDesignFile || customDesignUrl) && !useTextOnly) && (
                <div className="space-y-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider block flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                      <span>⚙️ FITUR EDIT FOTO & FILTER DESAIN</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBrightness(100);
                        setContrast(100);
                        setSaturation(100);
                        setHueRotate(0);
                        setGrayscale(0);
                        setSepia(0);
                        setInvert(0);
                        setFlipX(false);
                        setFlipY(false);
                      }}
                      className="text-[9px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest bg-red-50 hover:bg-red-100/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-1">
                    {/* Brightness slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>BRIGHTNESS (KECERAHAN)</span>
                        <span className="text-slate-700 font-black">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Contrast slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>CONTRAST (KONTRAS)</span>
                        <span className="text-slate-700 font-black">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Saturation slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>SATURASI WARNA</span>
                        <span className="text-slate-700 font-black">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Hue Rotate slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>EFEK WARNA (HUE ROTATE)</span>
                        <span className="text-slate-700 font-black">{hueRotate}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hueRotate}
                        onChange={(e) => setHueRotate(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Grayscale slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>GRAYSCALE (HITAM PUTIH)</span>
                        <span className="text-slate-700 font-black">{grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={grayscale}
                        onChange={(e) => setGrayscale(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Sepia slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>SEPIA (EFEK VINTAGE)</span>
                        <span className="text-slate-700 font-black">{sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onChange={(e) => setSepia(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Invert slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[9px] text-slate-400 tracking-wider">
                        <span>INVERT (WARNA NEGATIF)</span>
                        <span className="text-slate-700 font-black">{invert}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={invert}
                        onChange={(e) => setInvert(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Flip buttons */}
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="font-bold text-[9px] text-slate-400 tracking-wider mb-1.5 uppercase font-black">TRANSFORMASI (FLIP)</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFlipX(!flipX)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            flipX
                              ? "bg-red-50 border-red-400 text-red-600"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>Flip Horisontal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipY(!flipY)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            flipY
                              ? "bg-red-50 border-red-400 text-red-600"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>Flip Vertikal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INTERACTIVE CONFIGURATOR STEPS (7 cols) */}
          <div className="lg:col-span-7 space-y-10 pl-2 lg:pl-8">
            <div className="space-y-10">
              
              {/* STEP 1: CHOOSE BASE T-SHIRT COLOR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                    1
                  </div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    PILIH WARNA KAOS POLOS PREMIUM
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dtfProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    const cleanColorName = p.name.replace("Kaos Polos Cotton Combed 30s Premium - ", "");
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                        }}
                        className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-red-600 bg-red-50/10 ring-2 ring-red-500/10 shadow-sm"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative w-12 h-12 mb-3 flex items-center justify-center">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 rounded-full flex items-center justify-center text-white shadow">
                              <Check className="w-2.5 h-2.5 font-bold" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-800 line-clamp-1">
                          {cleanColorName}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-1">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: SIZE SELECTOR WITH DIMENSIONS GRID */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                      2
                    </div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      TENTUKAN UKURAN KAOS
                    </label>
                  </div>
                  {sizeSurcharge > 0 && (
                    <span className="text-[8px] bg-red-50 text-red-600 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                      XXL+ Surcharge: +Rp {sizeSurcharge.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {sizes.map((sz) => {
                    const isSelected = selectedSize === sz.code;
                    const surcharge = getSizeSurcharge(sz.code);
                    return (
                      <button
                        key={sz.code}
                        onClick={() => setSelectedSize(sz.code)}
                        className={`py-3 px-1 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                            : "bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-black tracking-wide">{sz.code}</span>
                        <span className={`text-[8px] mt-1 font-bold leading-none ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {sz.label}
                        </span>
                        {surcharge > 0 && (
                          <span className={`text-[8px] font-black mt-1.5 leading-none ${isSelected ? 'text-white bg-slate-800 px-1 py-0.5 rounded' : 'text-red-600 bg-red-50 px-1 py-0.5 rounded'}`}>
                            +{surcharge / 1000}k
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: DTF PRINT SIZE ILLUSTRATION */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                    3
                  </div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    UKURAN CETAK SABLON DTF
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {designSizeOptions.map((opt) => {
                    const isSelected = designSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDesignSize(opt.value as any)}
                        className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-red-600 bg-red-50/10 ring-2 ring-red-500/10 shadow-sm"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{opt.value.toUpperCase()}</span>
                            {isSelected && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold leading-tight">{opt.label}</p>
                        </div>
                        <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-xl">
                          +Rp {opt.surcharge.toLocaleString("id-ID")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: UPLOAD OR TYPE CUSTOM TEXT */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                      4
                    </div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      KUSTOMISASI LOGO / GAMBAR / TEKS
                    </label>
                  </div>
                </div>

                {/* GRAPHIC / TEXT METHOD TABS */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUseTextOnly(false)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !useTextOnly
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Desain Sendiri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseTextOnly(true);
                      if (!customText) setCustomText("KUSTOM SABLON");
                    }}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      useTextOnly
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Tambah Teks Kustom</span>
                  </button>
                </div>

                {!useTextOnly ? (
                  /* UPLOAD INTERACTIVE BOX */
                  <div className="space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        dragOver 
                          ? "border-red-600 bg-red-50/20" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                      }`}
                    >
                      <input
                        type="file"
                        id="dtf-upload-input"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="dtf-upload-input" className="cursor-pointer space-y-2.5 block">
                        <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-slate-100 text-red-600">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800">
                            Drag & Drop file Anda di sini, atau <span className="text-red-600 underline">Cari File</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Format yang disarankan: PNG Transparan atau JPG berkualitas tinggi (Maks. 15MB)
                          </p>
                        </div>
                      </label>
                    </div>



                    {/* CUSTOMER DEDICATED PRIVATE/SPECIAL STORAGE GALLERY */}
                    <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                          <span>✦ PENYIMPANAN GALERI KHUSUS SAYA (CLOUD)</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="customer-gallery-upload-input"
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const base64 = reader.result as string;
                                  setCustomDesignFile(base64);
                                  setCustomDesignUrl("");
                                  setUseTextOnly(false);
                                  // Auto save
                                  saveToGalleryDirect(base64, file.name);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="customer-gallery-upload-input"
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-[9px] font-black uppercase tracking-wider text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Unggah Foto</span>
                          </label>
                        </div>
                      </div>

                      {loadingCustomerUploads ? (
                        <div className="py-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                          <span>Memuat Galeri Khusus...</span>
                        </div>
                      ) : customerUploads.length === 0 ? (
                        <div className="p-4 bg-white border border-slate-150 rounded-xl text-center text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                          Belum ada foto di galeri khusus Anda. Foto yang Anda drop/upload di atas akan otomatis disimpan di sini agar tidak hilang!
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {customerUploads.map((item) => (
                            <div key={item.id} className="relative group/gallery-item bg-white p-1.5 border border-slate-200 hover:border-red-500 rounded-xl transition-all flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomDesignFile(null);
                                  setCustomDesignUrl(item.imageUrl);
                                  setUseTextOnly(false);
                                  // Reset positioning
                                  setPosX(0);
                                  setPosY(-20);
                                  setScale(1.2);
                                }}
                                className="w-full text-center cursor-pointer"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt="Customer upload"
                                  className="w-10 h-10 object-cover rounded-lg mx-auto"
                                />
                              </button>
                              
                              {/* Quick delete for customer */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomerUpload(item.id)}
                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover/gallery-item:opacity-100 transition-opacity cursor-pointer shadow-md"
                                title="Hapus dari Galeri"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* TEXT CONFIGURATOR BOX */
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        ISI TEKS KUSTOM ANDA
                      </label>
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Ketik teks yang ingin dicetak di sini..."
                        rows={2}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:outline-none bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Font Family Choice */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                          PILIH FONT
                        </label>
                        <select
                          value={textFont}
                          onChange={(e) => setTextFont(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600"
                        >
                          <option value="Space Grotesk">Space Grotesk (Tech)</option>
                          <option value="Playfair Display">Playfair Display (Serif)</option>
                          <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                          <option value="Inter">Inter (Sans-Serif)</option>
                        </select>
                      </div>

                      {/* Font Color Choice */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                          <Palette className="w-3.5 h-3.5 text-slate-500" />
                          <span>WARNA TEKS</span>
                        </label>
                        <div className="flex gap-1.5 items-center bg-white p-1 rounded-xl border border-slate-200">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-6 h-6 border-0 p-0 rounded-lg cursor-pointer accent-transparent bg-transparent"
                          />
                          <span className="text-[9px] font-black text-slate-600 tracking-wider">
                            {textColor.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Font Size Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>UKURAN FONT</span>
                          <span>{textSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          value={textSize}
                          onChange={(e) => setTextSize(Number(e.target.value))}
                          className="w-full accent-red-600 cursor-pointer h-1 bg-slate-200 rounded-lg mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: POSITION AND ADDITIONAL NOTES */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 font-black text-xs flex items-center justify-center">
                    5
                  </div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    POSISI & INSTRUKSI TAMBAHAN
                  </label>
                </div>
                
                {/* Standard presets of printing positions */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    "Depan Dada (Tengah)",
                    "Depan Dada (Kiri)",
                    "Bagian Punggung"
                  ].map((pos) => {
                    const isSelected = description === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setDescription(pos)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black text-center transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="Ketik instruksi tambahan posisi cetak di sini (Contoh: Sablon di belakang, berjarak 10cm dari jahitan leher)..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* ACTIVE ORDER PRICING BREAKDOWN & ACTIONS */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 text-white space-y-3">
                  <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Rincian Biaya Cetak Kustom
                  </h4>
                  
                  <div className="space-y-1.5 text-xs font-medium text-slate-300">
                    <div className="flex justify-between">
                      <span>Biaya Cetak Sablon ({designSize.toUpperCase()})</span>
                      <span className="font-bold text-white">Rp {dSizeSurcharge.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Kaos Polos Premium</span>
                      <span className="font-semibold text-amber-500">Belum Termasuk (Beli di Toko Utama)</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                      <span>Harga Cetak Satuan</span>
                      <span className="font-black text-white">Rp {totalPricePerItem.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        TOTAL ESTIMASI BIAYA ({quantity} PCS)
                      </p>
                      <p className="text-xl md:text-2xl font-black text-red-500 leading-none">
                        Rp {totalOrderPrice.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Quantity Selector inside billing box */}
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* PRICE BREAKDOWN PANEL */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Rincian Estimasi Biaya</span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white rounded uppercase tracking-widest">Harga Terbaik</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Layanan Sablon ({designSize.toUpperCase()})</span>
                      <span className="text-white font-mono font-bold">Rp {totalPricePerItem.toLocaleString()}</span>
                    </div>
                    {sizeSurcharge > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Surcharge Ukuran Kaos ({selectedSize})</span>
                        <span className="text-white font-mono font-bold">+ Rp {sizeSurcharge.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                      <span className="text-slate-400 font-bold">Subtotal ({quantity} pcs)</span>
                      <span className="text-white font-mono font-bold">Rp {totalOrderPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/30">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-[9px] text-emerald-100 font-medium leading-relaxed">
                        *Harga di atas adalah estimasi jasa cetak DTF. Total akhir akan dihitung otomatis di keranjang belanja termasuk harga kaos polos pilihan Anda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION SUBMIT BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleAddCustomToCart}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>MENGUNGGAH DESAIN ANDA...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4.5 h-4.5" />
                        <span>Tambahkan Kustom Ke Keranjang</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-150"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    <span>Chat Admin</span>
                  </button>
                </div>

                {/* TRUST & SATISFACTION BANNER */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-150">
                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-wide">
                        GARANSI ANTI RETAK
                      </p>
                      <p className="text-[8px] text-slate-400 font-semibold leading-relaxed">
                        Tinta Plastisol reaktif dijamin lentur, ditarik tidak crack.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Award className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-wide">
                        KATUN 100% COMBED 30S
                      </p>
                      <p className="text-[8px] text-slate-400 font-semibold leading-relaxed">
                        Kualitas distro tebal, sejuk menyerap keringat alami.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Zap className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-wide">
                        PENGERJAAN KILAT 24 JAM
                      </p>
                      <p className="text-[8px] text-slate-400 font-semibold leading-relaxed">
                        Proses sablon instan tanpa antrean lama khusus pesanan web.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ORDER FEEDBACK NOTICE */}
                {isOrdered && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 flex items-center gap-2.5 text-xs font-bold animate-bounce">
                    <Check className="w-4.5 h-4.5 bg-emerald-500 text-white rounded-full p-0.5 shrink-0" />
                    <span>{orderMessage || "Kustomisasi berhasil ditambahkan!"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FABRIC & SIZE INSTRUCTION TAB */}
      {activeTab === "guide" && (
        <div className="max-w-4xl mx-auto px-6 md:px-8 space-y-8 animate-fade-in">
          {/* Section 1: Detailed physical dimensions chart */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Shirt className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Panduan Ukuran & Dimensi Kaos (Regular Fit Unisex)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  Gunakan ukuran ini sebagai acuan untuk mencocokkan tubuh Anda sebelum membeli.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-black uppercase border-b border-slate-200">
                    <th className="py-3 px-4">UKURAN</th>
                    <th className="py-3 px-4">LEBAR DADA</th>
                    <th className="py-3 px-4">PANJANG BADAN</th>
                    <th className="py-3 px-4">REKOMENDASI BERAT BADAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">S</td>
                    <td className="py-3 px-4">47 cm</td>
                    <td className="py-3 px-4">67 cm</td>
                    <td className="py-3 px-4">45 - 55 kg</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">M</td>
                    <td className="py-3 px-4">49 cm</td>
                    <td className="py-3 px-4">69 cm</td>
                    <td className="py-3 px-4">55 - 65 kg</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">L</td>
                    <td className="py-3 px-4">51 cm</td>
                    <td className="py-3 px-4">71 cm</td>
                    <td className="py-3 px-4">65 - 75 kg</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">XL</td>
                    <td className="py-3 px-4">53 cm</td>
                    <td className="py-3 px-4">73 cm</td>
                    <td className="py-3 px-4">75 - 85 kg</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">XXL</td>
                    <td className="py-3 px-4">55 cm</td>
                    <td className="py-3 px-4">75 cm</td>
                    <td className="py-3 px-4">85 - 95 kg</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-red-600">XXXL</td>
                    <td className="py-3 px-4">58 cm</td>
                    <td className="py-3 px-4">78 cm</td>
                    <td className="py-3 px-4">95 - 105 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 font-bold leading-relaxed flex items-start gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>* Toleransi deviasi ukuran jahitan pabrik ±1.5 cm. Jika Anda ragu atau berada di antara dua batas ukuran, kami selalu menyarankan untuk memilih ukuran yang lebih besar.</span>
            </p>
          </div>

          {/* Section 2: Cotton Combed physical specifications */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Award className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Detail Material Cotton Combed 30s Premium
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  Kami mengedepankan kualitas kenyamanan maksimal untuk kulit Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    🍀 100% SERAT ORGANIK KATUN ALAMI
                  </p>
                  <p className="leading-relaxed">
                    Ditenun murni dari kapas organik terbaik, tanpa campuran serat polyester sintetis. Bahan terasa sangat sejuk, menyerap keringat dengan prima, dan ramah terhadap kulit sensitif.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    🌈 PROSES PEWARNAAN REAKTIF (REACTIVE DYED)
                  </p>
                  <p className="leading-relaxed">
                    Seluruh kain dicelup menggunakan formula reaktif premium. Warna kaos terasa lebih solid, dalam, dan tidak luntur meskipun dicuci berulang kali di mesin cuci rumah tangga.
                  </p>
                </div>
              </div>

              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    🧵 STANDAR JAHITAN KELAS DISTRO
                  </p>
                  <p className="leading-relaxed">
                    Dilengkapi dengan jahitan pundak rantaian super rapat, jahitan obras leher ganda (double-stitch), dan overdeck jarum 3 pada lengan dan ujung bawah untuk menjaga integritas kaos dari penyusutan/pelonggaran.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    🧪 DURABILITAS SABLON DTF
                  </p>
                  <p className="leading-relaxed">
                    Dicetak memakai tinta pigmen tekstil Plastisol grade tertinggi yang dimatangkan menggunakan bubuk pelekat super elastis. Hasil sablon fleksibel, awet, elastis saat ditarik, dan tahan setrika jika disetrika dari bagian belakang kain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIRESTORE COMMUNITY SHOWCASE / GALLERY */}
      {activeTab === "gallery" && (
        <div className="max-w-6xl mx-auto px-6 md:px-8 space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-red-600 animate-bounce" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Inspirasi Karya & Desain Sablon Pelanggan
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Berikut adalah hasil karya kustom sablon DTF terbaru yang diunggah oleh komunitas pelanggan kami.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchCommunityGallery}
                className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingGallery ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                <span>Sedang menyinkronkan data galeri Firestore...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryDesigns.map((item, idx) => (
                  <div 
                    key={item.id ? `gallery-${item.id}` : `gallery-${idx}`}
                    className="bg-slate-50 rounded-2xl p-3 border border-slate-250/50 hover:shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full rounded-xl bg-white overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
                      <img
                        src={item.imageUrl}
                        alt="Kustom Sablon"
                        className="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white font-mono text-[7px] py-0.5 px-2 rounded-full uppercase tracking-widest">
                        COMMUNITY WORK
                      </span>
                    </div>
                    <div className="pt-2 text-left space-y-1">
                      <p className="text-[10px] font-black text-slate-700 line-clamp-2">
                        {item.note || "Kustom Sablon DTF Premium"}
                      </p>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                        {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString("id-ID") : "Baru saja"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-slate-900">Checkout Pengiriman</h2>
            <input type="text" placeholder="Nama Lengkap" value={shippingInfo.name} onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Alamat Lengkap</label>
              <MapAddressPicker
                value={shippingInfo.address}
                onChange={(address) => setShippingInfo({...shippingInfo, address})}
                placeholder="Alamat Lengkap"
                isTextArea={false}
              />
            </div>
            <input type="text" placeholder="No Telepon" value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            <button onClick={handleSaveDesign} className="w-full py-2 bg-red-600 text-white rounded-lg font-black text-sm">Simpan Desain & Kirim</button>
            <button onClick={() => setIsCheckoutOpen(false)} className="w-full py-2 text-slate-600 text-sm font-bold">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
