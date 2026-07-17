import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2,
  Play, 
  Eye, 
  RefreshCw, 
  Package, 
  Coins, 
  Flame, 
  Folder,
  Image,
  AlertCircle,
  FileText,
  BadgeAlert,
  Sliders,
  Check,
  Tag,
  Palette,
  FileJson,
  X,
  Sparkles,
  User as UserIcon,
  MessageCircle,
  Layout,
  Video,
  Film,
  Heart,
  FolderOpen,
  Activity,
  Megaphone,
} from "lucide-react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Product, Banner, VideoBanner, User, MarketingText } from "../types";
import ImageUploadButton from "./ImageUploadButton";
import VideoUploadButton from "./VideoUploadButton";
import MediaGalleryModal from "./MediaGalleryModal";
import AdminOrdersTab from "./AdminOrdersTab";

interface VideoStatusBadgeProps {
  videoUrl: string;
}

function VideoStatusBadge({ videoUrl }: VideoStatusBadgeProps) {
  const [status, setStatus] = useState<"processing" | "active" | "error">("processing");

  useEffect(() => {
    if (!videoUrl) {
      setStatus("error");
      return;
    }
    
    // Create an offline video element to test the URL
    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    const handleCanPlay = () => {
      setStatus("active");
    };

    const handleWaiting = () => {
      setStatus("processing");
    };

    const handleError = () => {
      setStatus("error");
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("error", handleError);

    // Trigger load
    video.load();

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("error", handleError);
    };
  }, [videoUrl]);

  return (
    <span
      className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border shadow-sm flex items-center gap-1 ${
        status === "active"
          ? "bg-emerald-500 text-white border-emerald-400"
          : status === "processing"
          ? "bg-amber-500 text-white border-amber-400 animate-pulse"
          : "bg-red-500 text-white border-red-400"
      }`}
    >
      <span className={`w-1 h-1 rounded-full bg-white ${status === "processing" ? "animate-ping" : ""}`} />
      <span>{status === "active" ? "Active" : status === "processing" ? "Processing" : "Error"}</span>
    </span>
  );
}

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (productData: Partial<Product>) => Promise<boolean>;
  onUpdateProduct: (productId: string, productData: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onDeleteProducts?: () => Promise<boolean>;
  onReloadProducts: () => void;
  onReloadSettings?: () => void;
  onViewDetail?: (product: Product) => void;
  user: User | null;
}

export default function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteProducts,
  onReloadProducts,
  onReloadSettings,
  onViewDetail,
  user
}: AdminPanelProps) {
  // Navigation tabs inside Admin Panel
  const [adminTab, setAdminTab] = useState<string>("dashboard");


  // Custom configuration states
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"product" | "banner" | "dtf" | "category" | "additional" | "small-banner" | "info-banner" | "mockup" | "branding" | "video-banner-video" | "video-banner-poster" | "dtf-video" | "explore-video" | "explore-thumb" | "video-banner-product">("product");

  const openMediaModal = (target: "product" | "banner" | "dtf" | "category" | "additional" | "small-banner" | "info-banner" | "mockup" | "branding" | "video-banner-video" | "video-banner-poster" | "dtf-video" | "explore-video" | "explore-thumb" | "video-banner-product") => {
    setMediaTarget(target);
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === "product") {
      setImage(url);
    } else if (mediaTarget === "video-banner-product") {
      setQuickPImage(url);
    } else if (mediaTarget === "banner") {
      setBImage(url);
    } else if (mediaTarget === "dtf") {
      setDtfBannerUrl(url);
    } else if (mediaTarget === "dtf-video") {
      setDtfVideoUrl(url);
    } else if (mediaTarget === "category") {
      setCatImage(url);
    } else if (mediaTarget === "additional") {
      handleAddGalleryImage(url);
    } else if (mediaTarget === "small-banner") {
      setSbImage(url);
    } else if (mediaTarget === "info-banner") {
      setIbImage(url);
    } else if (mediaTarget === "mockup") {
      setDtfMockupUrl(url);
    } else if (mediaTarget === "branding") {
      setBrandLogoUrl(url);
    } else if (mediaTarget === "video-banner-video") {
      setVbVideoUrl(url);
    } else if (mediaTarget === "video-banner-poster") {
      setVbPosterUrl(url);
    } else if (mediaTarget === "explore-video") {
      setEvVideoUrl(url);
    } else if (mediaTarget === "explore-thumb") {
      setEvThumbUrl(url);
    }
  };

  // Small Banner State
  const [smallBanners, setSmallBanners] = useState<any[]>([]);
  const [smallBannersLoading, setSmallBannersLoading] = useState(false);
  const [sbImage, setSbImage] = useState("");
  const [sbTitle, setSbTitle] = useState("");
  const [sbSubtitle, setSbSubtitle] = useState("");
  const [isEditingSmallBanner, setIsEditingSmallBanner] = useState(false);
  const [editSmallBannerId, setEditSmallBannerId] = useState<string | null>(null);

  // Info Banner State
  const [infoBanners, setInfoBanners] = useState<any[]>([]);
  const [infoBannersLoading, setInfoBannersLoading] = useState(false);
  const [ibImage, setIbImage] = useState("");
  const [ibTitle, setIbTitle] = useState("");
  const [ibSubtitle, setIbSubtitle] = useState("");
  const [ibButtonText, setIbButtonText] = useState("");
  const [ibButtonUrl, setIbButtonUrl] = useState("");
  const [ibBgColor, setIbBgColor] = useState("#dc2626");
  const [ibTextColor, setIbTextColor] = useState("#ffffff");
  const [ibIsActive, setIbIsActive] = useState(true);
  const [isEditingInfoBanner, setIsEditingInfoBanner] = useState(false);
  const [editInfoBannerId, setEditInfoBannerId] = useState<string | null>(null);

  const [dtfBannerUrl, setDtfBannerUrl] = useState("");
  const [dtfVideoUrl, setDtfVideoUrl] = useState("");
  const [dtfTitle, setDtfTitle] = useState("");
  const [dtfSubtitle, setDtfSubtitle] = useState("");
  const [dtfDesc, setDtfDesc] = useState("");
  const [surchargeLogo, setSurchargeLogo] = useState<number>(10000);
  const [surchargeA5, setSurchargeA5] = useState<number>(20000);
  const [surchargeA4, setSurchargeA4] = useState<number>(35000);
  const [surchargeA3, setSurchargeA3] = useState<number>(55000);
  const [surchargeXXL, setSurchargeXXL] = useState<number>(10000);
  const [surchargeXXXL, setSurchargeXXXL] = useState<number>(15000);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("6281219154973");
  const [dtfMockupUrl, setDtfMockupUrl] = useState("");
  const [bulkJson, setBulkJson] = useState("");

  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDesc, setMediaDesc] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [catLabel, setCatLabel] = useState("");
  const [catImage, setCatImage] = useState("");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [galleryDesigns, setGalleryDesigns] = useState<any[]>([]);
  const [customerUploads, setCustomerUploads] = useState<any[]>([]);
  const [loadingCustomerUploads, setLoadingCustomerUploads] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [loadingSavedDesigns, setLoadingSavedDesigns] = useState(false);

  // Branding States
  const [brandText, setBrandText] = useState("A-GIN");
  const [brandHighlight, setBrandHighlight] = useState("FASHION");
  const [brandSlogan, setBrandSlogan] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandOriginCityId, setBrandOriginCityId] = useState("444");
  const [brandOriginCityName, setBrandOriginCityName] = useState("Surabaya");
  const [brandOriginPostalCode, setBrandOriginPostalCode] = useState("60181");
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [removeLogoBg, setRemoveLogoBg] = useState(false);
  const [logoBgType, setLogoBgType] = useState<"white" | "black" | "white_to_dark" | "black_to_dark" | "none">("white");
  const [cropLogoBottom, setCropLogoBottom] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [isSavingCustomLogos, setIsSavingCustomLogos] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const res = await fetch("/api/admin/check-config");
      if (res.ok) {
        setDiagnostics(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  // Video Banner State
  const [videoBanners, setVideoBanners] = useState<VideoBanner[]>([]);
  const [videoBannersLoading, setVideoBannersLoading] = useState(false);
  const [vbVideoUrl, setVbVideoUrl] = useState("");
  const [vbPosterUrl, setVbPosterUrl] = useState("");
  const [vbTitle, setVbTitle] = useState("");
  const [vbSubtitle, setVbSubtitle] = useState("");
  const [vbButtonText, setVbButtonText] = useState("");
  const [vbButtonUrl, setVbButtonUrl] = useState("");
  const [vbIsActive, setVbIsActive] = useState(true);
  const [vbPosition, setVbPosition] = useState<"top" | "middle" | "bottom">("top");
  const [isEditingVideoBanner, setIsEditingVideoBanner] = useState(false);
  const [editVideoBannerId, setEditVideoBannerId] = useState<string | null>(null);

  // Dedicated Video Banner Products management state
  const [selectedBannerForProducts, setSelectedBannerForProducts] = useState<VideoBanner | null>(null);
  const [quickPName, setQuickPName] = useState("");
  const [quickPPrice, setQuickPPrice] = useState("");
  const [quickPImage, setQuickPImage] = useState("");
  const [quickPCategory, setQuickPCategory] = useState("Kaos");
  const [quickPStock, setQuickPStock] = useState("100");
  const [quickPDesc, setQuickPDesc] = useState("Koleksi eksklusif untuk kampanye video banner.");
  const [quickPMsg, setQuickPMsg] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [quickDeleteConfirmId, setQuickDeleteConfirmId] = useState<string | null>(null);

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBannerForProducts) return;
    if (!quickPName || !quickPPrice || !quickPImage || !quickPCategory) {
      setQuickPMsg({ text: "Nama, Harga, Gambar, dan Kategori wajib diisi!", type: "error" });
      return;
    }

    const payload: Partial<Product> = {
      name: quickPName,
      price: Number(quickPPrice),
      image: quickPImage.trim(),
      images: [],
      sizes: ["S", "M", "L", "XL"],
      category: quickPCategory,
      stock: Number(quickPStock) || 100,
      description: quickPDesc || "Koleksi eksklusif untuk kampanye video banner.",
      isFlashSale: false,
      isPromo: false,
      isBannerProduct: true,
      bannerId: selectedBannerForProducts.id,
      productType: "fashion",
      status: "active",
      tags: ["Video Banner", selectedBannerForProducts.title].filter(Boolean)
    };

    const success = await onAddProduct(payload);
    if (success) {
      setQuickPMsg({ text: "Produk berhasil diupload dan dikaitkan ke video banner ini!", type: "success" });
      setQuickPName("");
      setQuickPPrice("");
      setQuickPImage("");
      setTimeout(() => setQuickPMsg({ text: "", type: "" }), 3000);
    } else {
      setQuickPMsg({ text: "Gagal menyimpan produk ke database.", type: "error" });
    }
  };

  const handleUnlinkProduct = async (pId: string) => {
    const success = await onUpdateProduct(pId, { bannerId: null, isBannerProduct: false });
    if (success) {
      setQuickPMsg({ text: "Hubungan produk dengan banner berhasil dilepas!", type: "success" });
      setTimeout(() => setQuickPMsg({ text: "", type: "" }), 3000);
    } else {
      setQuickPMsg({ text: "Gagal melepas hubungan produk.", type: "error" });
    }
  };

  const handleDeleteProductQuick = async (pId: string) => {
    const success = await onDeleteProduct(pId);
    if (success) {
      setQuickPMsg({ text: "Produk berhasil dihapus secara permanen!", type: "success" });
      setQuickDeleteConfirmId(null);
      setTimeout(() => setQuickPMsg({ text: "", type: "" }), 3000);
    } else {
      setQuickPMsg({ text: "Gagal menghapus produk.", type: "error" });
    }
  };

  // Explore Videos State
  const [exploreVideos, setExploreVideos] = useState<any[]>([]);
  const [exploreVideosLoading, setExploreVideosLoading] = useState(false);
  const [evVideoUrl, setEvVideoUrl] = useState("");
  const [evThumbUrl, setEvThumbUrl] = useState("");
  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evIsActive, setEvIsActive] = useState(true);
  const [isEditingExploreVideo, setIsEditingExploreVideo] = useState(false);
  const [editExploreVideoId, setEditExploreVideoId] = useState<string | null>(null);

  // Centralized deletion states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");
  const [confirmDeleteType, setConfirmDeleteType] = useState<"product" | "banner" | "small-banner" | "info-banner" | "video-banner" | "explore-video" | "category" | "video" | "gallery" | "all-products" | "customer-upload">("product");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGalleryDesigns = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "designs"));
      const designs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryDesigns(designs);
    } catch (err) {
      console.error("Error fetching designs:", err);
    }
  };

  const [marketingTexts, setMarketingTexts] = useState<MarketingText[]>([]);
  const [loadingMarketing, setLoadingMarketing] = useState(false);

  const fetchMarketingTexts = async () => {
    setLoadingMarketing(true);
    try {
      const response = await fetch("/api/marketing-texts");
      const data = await response.json();
      setMarketingTexts(data);
    } catch (err) {
      console.error("Error fetching marketing texts:", err);
    } finally {
      setLoadingMarketing(false);
    }
  };

  const fetchCustomerUploads = async () => {
    setLoadingCustomerUploads(true);
    try {
      const response = await fetch("/api/media?type=customer-upload");
      const data = await response.json();
      setCustomerUploads(data || []);
    } catch (err) {
      console.error("Error fetching customer uploads:", err);
    } finally {
      setLoadingCustomerUploads(false);
    }
  };

  const saveMarketingText = async (data: any) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing ? `/api/marketing-texts/${data.id}` : "/api/marketing-texts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchMarketingTexts();
      }
    } catch (err) {
      console.error("Error saving marketing text:", err);
    }
  };

  const deleteMarketingText = async (id: string) => {
    try {
      const response = await fetch(`/api/marketing-texts/${id}`, { method: "DELETE" });
      if (response.ok) fetchMarketingTexts();
    } catch (err) {
      console.error("Error deleting marketing text:", err);
    }
  };

  useEffect(() => {
    if (adminTab === "marketing") {
      fetchMarketingTexts();
    }
  }, [adminTab]);

  const fetchSavedDesigns = async () => {
    setLoadingSavedDesigns(true);
    try {
      const res = await fetch("/api/saved-designs");
      if (res.ok) {
        const data = await res.json();
        setSavedDesigns(data);
      }
    } catch (err) {
      console.error("Error fetching saved designs:", err);
    } finally {
      setLoadingSavedDesigns(false);
    }
  };

  const handleDeleteSavedDesign = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus desain ini dari daftar tinjauan?")) return;
    try {
      const res = await fetch(`/api/saved-designs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSavedDesigns(prev => prev.filter(d => d.id !== id));
        setMsg({ text: "Desain berhasil dihapus!", type: "success" });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal menghapus desain.", type: "error" });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      console.error("Error deleting saved design:", err);
      setMsg({ text: "Terjadi kesalahan.", type: "error" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    }
  };

  // Product Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Product Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [sizesText, setSizesText] = useState("S, M, L, XL");
  const [category, setCategory] = useState("Kaos");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [isBannerProduct, setIsBannerProduct] = useState(false);
  const [bannerId, setBannerId] = useState("");
  const [productType, setProductType] = useState<"fashion" | "dtf">("fashion");

  // DTF Specific State
  const [printSize, setPrintSize] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<"cm" | "mm" | "inch">("cm");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [displayOrder, setDisplayOrder] = useState("");
  const [tags, setTags] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [productCode, setProductCode] = useState("");

  // Gallery State (Max 6 additional images)
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  const handleAddGalleryImage = (url: string) => {
    if (additionalImages.length >= 6) {
      alert("Maksimal 6 gambar tambahan!");
      return;
    }
    setAdditionalImages(prev => [...prev, url]);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const [adminProductFilter, setAdminProductFilter] = useState<"all" | "fashion" | "dtf">("all");
  const [productTab, setProductTab] = useState<"main" | "banner">("main");

  // Inventory products grouped by 6
  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const filteredAdminProducts = products.filter(p => {
    if (p.isBannerProduct) return false;
    if (adminProductFilter === "all") return true;
    if (adminProductFilter === "fashion") return p.productType === "fashion" || !p.productType;
    return p.productType === "dtf";
  });

  const filteredBannerProducts = products.filter(p => p.isBannerProduct);

  const productChunks = chunkArray(filteredAdminProducts, 6);
  const bannerProductChunks = chunkArray(filteredBannerProducts, 6);

  // Banner List State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  // Banner Form State
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBannerId, setEditBannerId] = useState<string | null>(null);

  // Banner Form Fields
  const [bImage, setBImage] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bDescription, setBDescription] = useState("");
  const [bBadge, setBBadge] = useState("");
  const [bBgColor, setBBgColor] = useState("transparent");
  const [bLinkUrl, setBLinkUrl] = useState("");

  // Notification Feedbacks
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (onReloadSettings) onReloadSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const res = await fetch("/api/settings/logo");
      if (res.ok) {
        const data = await res.json();
        setBrandText(data.text || "A-GIN");
        setBrandHighlight(data.highlightText || "FASHION");
        setBrandSlogan(data.slogan || "");
        setBrandLogoUrl(data.logoUrl || "");
        setBrandOriginCityId(data.originCityId || "444");
        setBrandOriginCityName(data.originCityName || "Surabaya");
        setBrandOriginPostalCode(data.originPostalCode || "60181");
      }

      const resCustom = await fetch("/api/settings/custom-logos");
      if (resCustom.ok) {
        setCustomLogos(await resCustom.json());
      }
    } catch (err) {
      console.error("Failed to fetch branding settings:", err);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      const res = await fetch("/api/settings/logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: brandText,
          highlightText: brandHighlight,
          slogan: brandSlogan,
          logoUrl: brandLogoUrl,
          originCityId: brandOriginCityId,
          originCityName: brandOriginCityName,
          originPostalCode: brandOriginPostalCode
        })
      });
      if (res.ok) {
        setMsg({ text: "Pengaturan Brand & Logo berhasil diperbarui!", type: "success" });
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal memperbarui pengaturan brand.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleSaveCustomLogos = async (updatedLogos: Record<string, string>) => {
    setIsSavingCustomLogos(true);
    try {
      const res = await fetch("/api/settings/custom-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLogos)
      });
      if (res.ok) {
        setMsg({ text: "Logo Kurir & Pembayaran berhasil diperbarui!", type: "success" });
        const data = await res.json();
        setCustomLogos(data);
        const { reloadBrandLogos } = await import("./BrandLogo");
        await reloadBrandLogos();
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal memperbarui kustom logo.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    } finally {
      setIsSavingCustomLogos(false);
    }
  };

  const handleProcessActiveLogo = async () => {
    if (!brandLogoUrl) {
      setMsg({ text: "Tidak ada logo aktif untuk diproses.", type: "error" });
      return;
    }
    setIsProcessingLogo(true);
    try {
      const res = await fetch("/api/process-active-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: brandLogoUrl,
          bgType: logoBgType,
          cropBottom: cropLogoBottom
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBrandLogoUrl(data.url);
        if (onReloadSettings) onReloadSettings();
        setMsg({ text: "Latar belakang logo berhasil dibersihkan!", type: "success" });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        const errData = await res.json();
        setMsg({ text: errData.error || "Gagal memproses transparansi logo.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  useEffect(() => {
    if (adminTab === "whatsapp") {
      fetchDtfSettings();
    } else if (adminTab === "categories") {
      fetchCategories();
    } else if (adminTab === "banners") {
      fetchBanners();
    } else if (adminTab === "users") {
      fetchRegisteredUsers();
    } else if (adminTab === "small-banners") {
      fetchSmallBanners();
    } else if (adminTab === "info-banners") {
      fetchInfoBanners();
    } else if (adminTab === "gallery") {
      fetchGalleryDesigns();
    } else if (adminTab === "customer-uploads") {
      fetchCustomerUploads();
    } else if (adminTab === "branding") {
      fetchBrandingSettings();
    } else if (adminTab === "settings") {
      fetchBrandingSettings();
    } else if (adminTab === "video-banners") {
      fetchVideoBanners();
    } else if (adminTab === "explore") {
      fetchExploreVideos();
    } else if (adminTab === "saved-designs") {
      fetchSavedDesigns();
    } else if (adminTab === "orders") {
      fetchSavedDesigns();
    } else if (adminTab === "diagnostics") {
      fetchDiagnostics();
    }
  }, [adminTab]);

  const fetchExploreVideos = async () => {
    setExploreVideosLoading(true);
    try {
      const res = await fetch("/api/explore-videos");
      if (res.ok) {
        const data = await res.json();
        setExploreVideos(data);
      }
    } catch (err) {
      console.error("Gagal memuat video explore:", err);
    } finally {
      setExploreVideosLoading(false);
    }
  };

  const handleExploreVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evVideoUrl || !evTitle) {
      alert("Video URL dan Judul wajib diisi.");
      return;
    }

    const payload = {
      videoUrl: evVideoUrl,
      thumbnailUrl: evThumbUrl,
      title: evTitle,
      description: evDesc,
      isActive: evIsActive
    };

    try {
      const url = isEditingExploreVideo && editExploreVideoId ? `/api/explore-videos/${editExploreVideoId}` : "/api/explore-videos";
      const method = isEditingExploreVideo ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEvVideoUrl("");
        setEvThumbUrl("");
        setEvTitle("");
        setEvDesc("");
        setEvIsActive(true);
        setIsEditingExploreVideo(false);
        setEditExploreVideoId(null);
        fetchExploreVideos();
        alert(isEditingExploreVideo ? "Video Explore berhasil diperbarui!" : "Video Explore berhasil ditambahkan!");
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.error || "Gagal menyimpan video explore"}`);
      }
    } catch (err) {
      console.error("Error submitting explore video:", err);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleEditExploreVideo = (video: any) => {
    setIsEditingExploreVideo(true);
    setEditExploreVideoId(video.id);
    setEvVideoUrl(video.videoUrl);
    setEvThumbUrl(video.thumbnailUrl);
    setEvTitle(video.title);
    setEvDesc(video.description || "");
    setEvIsActive(video.isActive);
  };

  const handleDeleteExploreVideo = (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName("Video Explore");
    setConfirmDeleteType("explore-video");
    setIsConfirmOpen(true);
  };


  const fetchVideoBanners = async () => {
    setVideoBannersLoading(true);
    try {
      const res = await fetch("/api/video-banners");
      if (res.ok) {
        const data = await res.json();
        setVideoBanners(data);
      }
    } catch (err) {
      console.error("Gagal memuat video banner:", err);
    } finally {
      setVideoBannersLoading(false);
    }
  };

  const handleVideoBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vbVideoUrl) {
      alert("Video URL wajib diisi.");
      return;
    }

    const payload = {
      videoUrl: vbVideoUrl,
      posterUrl: vbPosterUrl,
      title: vbTitle || "",
      subtitle: vbSubtitle || "",
      buttonText: vbButtonText || "",
      buttonUrl: vbButtonUrl || "",
      isActive: vbIsActive,
      position: vbPosition
    };

    try {
      const url = isEditingVideoBanner && editVideoBannerId ? `/api/video-banners/${editVideoBannerId}` : "/api/video-banners";
      const method = isEditingVideoBanner ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setVbVideoUrl("");
        setVbPosterUrl("");
        setVbTitle("");
        setVbSubtitle("");
        setVbButtonText("");
        setVbButtonUrl("");
        setVbIsActive(true);
        setVbPosition("top");
        setIsEditingVideoBanner(false);
        setEditVideoBannerId(null);
        fetchVideoBanners();
        if (onReloadSettings) onReloadSettings();
        alert(isEditingVideoBanner ? "Video banner berhasil diperbarui!" : "Video banner berhasil ditambahkan!");
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.error || "Gagal menyimpan video banner"}`);
      }
    } catch (err) {
      console.error("Error submitting video banner:", err);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleEditVideoBanner = (banner: VideoBanner) => {
    setIsEditingVideoBanner(true);
    setEditVideoBannerId(banner.id);
    setVbVideoUrl(banner.videoUrl);
    setVbPosterUrl(banner.posterUrl);
    setVbTitle(banner.title);
    setVbSubtitle(banner.subtitle || "");
    setVbButtonText(banner.buttonText || "");
    setVbButtonUrl(banner.buttonUrl || "");
    setVbIsActive(banner.isActive);
    setVbPosition(banner.position);
  };

  const handleDeleteVideoBanner = (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName("Video Banner");
    setConfirmDeleteType("video-banner");
    setIsConfirmOpen(true);
  };

  const fetchDtfSettings = async () => {
    try {
      const res = await fetch("/api/settings/dtf");
      if (res.ok) {
        const data = await res.json();
        setDtfBannerUrl(data.bannerImage || "");
        setDtfVideoUrl(data.bannerVideo || "");
        setDtfTitle(data.identityTitle || "");
        setDtfSubtitle(data.identitySubtitle || "");
        setDtfDesc(data.description || "");
        setSurchargeLogo(data.surchargeLogo !== undefined ? Number(data.surchargeLogo) : 10000);
        setSurchargeA5(data.surchargeA5 !== undefined ? Number(data.surchargeA5) : 20000);
        setSurchargeA4(data.surchargeA4 !== undefined ? Number(data.surchargeA4) : 35000);
        setSurchargeA3(data.surchargeA3 !== undefined ? Number(data.surchargeA3) : 55000);
        setSurchargeXXL(data.surchargeXXL !== undefined ? Number(data.surchargeXXL) : 10000);
        setSurchargeXXXL(data.surchargeXXXL !== undefined ? Number(data.surchargeXXXL) : 15000);
        setWhatsappNumber(data.whatsappNumber || "6281219154973");
        setDtfMockupUrl(data.mockupImage || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel) return;
    try {
      const url = isEditingCategory && editCategoryId ? `/api/categories/${editCategoryId}` : "/api/categories";
      const method = isEditingCategory ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: catLabel, image: catImage })
      });
      if (res.ok) {
        setCatLabel("");
        setCatImage("");
        setIsEditingCategory(false);
        setEditCategoryId(null);
        fetchCategories();
        setMsg({ text: isEditingCategory ? "Kategori berhasil diperbarui!" : "Kategori baru berhasil ditambahkan!", type: "success" });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategory = (cat: any) => {
    setIsEditingCategory(true);
    setEditCategoryId(cat.id);
    setCatLabel(cat.label);
    setCatImage(cat.image || "");
    // Scroll to form
    const form = document.getElementById("category-form");
    if (form) form.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteCategory = async (id: string) => {
    console.log("Deleting category:", id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      console.log("Delete category response:", res);
      if (res.ok) fetchCategories();
      else {
        const err = await res.json();
        console.error("Delete category failed:", err);
      }
    } catch (err) {
      console.error("Delete category error:", err);
    }
  };

  const fetchRegisteredUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        setRegisteredUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const res = await fetch("/api/banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error("Gagal memuat banner:", err);
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchSmallBanners = async () => {
    setSmallBannersLoading(true);
    try {
      const res = await fetch("/api/small-banners");
      if (res.ok) {
        const data = await res.json();
        setSmallBanners(data);
      }
    } catch (err) {
      console.error("Gagal memuat banner kecil:", err);
    } finally {
      setSmallBannersLoading(false);
    }
  };

  const fetchInfoBanners = async () => {
    setInfoBannersLoading(true);
    try {
      const res = await fetch("/api/info-banners");
      if (res.ok) {
        const data = await res.json();
        setInfoBanners(data);
      }
    } catch (err) {
      console.error("Gagal memuat banner info:", err);
    } finally {
      setInfoBannersLoading(false);
    }
  };

  const handleInfoBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibImage || !ibTitle) {
      alert("Gambar dan Judul wajib diisi.");
      return;
    }

    const payload = {
      image: ibImage,
      title: ibTitle,
      subtitle: ibSubtitle,
      buttonText: ibButtonText,
      buttonUrl: ibButtonUrl,
      bgColor: ibBgColor,
      textColor: ibTextColor,
      isActive: ibIsActive
    };

    try {
      const url = isEditingInfoBanner && editInfoBannerId ? `/api/info-banners/${editInfoBannerId}` : "/api/info-banners";
      const method = isEditingInfoBanner ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIbImage("");
        setIbTitle("");
        setIbSubtitle("");
        setIbButtonText("");
        setIbButtonUrl("");
        setIbBgColor("#dc2626");
        setIbTextColor("#ffffff");
        setIbIsActive(true);
        setIsEditingInfoBanner(false);
        setEditInfoBannerId(null);
        fetchInfoBanners();
        if (onReloadSettings) onReloadSettings();
        alert(isEditingInfoBanner ? "Banner info berhasil diperbarui!" : "Banner info berhasil ditambahkan!");
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.error || "Gagal menyimpan banner"}`);
      }
    } catch (err) {
      console.error("Error submitting info banner:", err);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleEditInfoBanner = (banner: any) => {
    setIsEditingInfoBanner(true);
    setEditInfoBannerId(banner.id);
    setIbImage(banner.image);
    setIbTitle(banner.title);
    setIbSubtitle(banner.subtitle || "");
    setIbButtonText(banner.buttonText || "");
    setIbButtonUrl(banner.buttonUrl || "");
    setIbBgColor(banner.bgColor || "#dc2626");
    setIbTextColor(banner.textColor || "#ffffff");
    setIbIsActive(banner.isActive !== false);
  };

  const handleDeleteInfoBanner = (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName("Banner Info");
    setConfirmDeleteType("info-banner");
    setIsConfirmOpen(true);
  };

  const handleSmallBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbImage) {
      alert("Gambar wajib diupload/diisi!");
      return;
    }
    try {
      const url = isEditingSmallBanner && editSmallBannerId ? `/api/small-banners/${editSmallBannerId}` : "/api/small-banners";
      const method = isEditingSmallBanner ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: sbImage,
          title: sbTitle || "MADE TO MOVE",
          subtitle: sbSubtitle
        })
      });
      if (res.ok) {
        setMsg({ text: isEditingSmallBanner ? "Foto banner berhasil diperbarui!" : "Foto banner berhasil diposting!", type: "success" });
        setSbImage("");
        setSbTitle("");
        setSbSubtitle("");
        setIsEditingSmallBanner(false);
        setEditSmallBannerId(null);
        fetchSmallBanners();
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        let errorMsg = "unknown error";
        try {
          const errData = await res.json();
          errorMsg = errData.error || "unknown error";
        } catch {
          errorMsg = await res.text();
        }
        alert("Gagal: " + errorMsg);
      }
    } catch (err) {
      console.error("Error posting small banner:", err);
    }
  };

  const handleEditSmallBanner = (banner: any) => {
    setIsEditingSmallBanner(true);
    setEditSmallBannerId(banner.id);
    setSbImage(banner.image);
    setSbTitle(banner.title);
    setSbSubtitle(banner.subtitle || "");
    // Scroll to form
    const form = document.getElementById("small-banner-form");
    if (form) form.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteSmallBanner = (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName("Foto Banner");
    setConfirmDeleteType("small-banner");
    setIsConfirmOpen(true);
  };

  const handleSaveDtfSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/dtf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerImage: dtfBannerUrl,
          bannerVideo: dtfVideoUrl,
          identityTitle: dtfTitle,
          identitySubtitle: dtfSubtitle,
          description: dtfDesc,
          surchargeLogo,
          surchargeA5,
          surchargeA4,
          surchargeA3,
          surchargeXXL,
          surchargeXXXL,
          whatsappNumber,
          mockupImage: dtfMockupUrl
        })
      });
      if (res.ok) {
        setMsg({ text: "Branding & Harga Sablon DTF berhasil diperbarui!", type: "success" });
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal memperbarui branding DTF.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    }
  };

  const handleResetDtfDefaults = () => {
    if (!window.confirm("Apakah Anda yakin ingin mengatur ulang semua pengaturan Sablon DTF ke default?")) return;
    setDtfBannerUrl("https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400");
    setDtfVideoUrl("");
    setDtfTitle("A-GIN DTF & SABLON PREMIUM");
    setDtfSubtitle("Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci");
    setDtfDesc("Layanan sablon Digital Transfer Film (DTF) premium dengan hasil cetak terbaik.");
    setSurchargeLogo(10000);
    setSurchargeA5(20000);
    setSurchargeA4(35000);
    setSurchargeA3(55000);
    setSurchargeXXL(10000);
    setSurchargeXXXL(15000);
    setWhatsappNumber("6281219154973");
    setDtfMockupUrl("");
  };

  const clearForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName("");
    setPrice("");
    setOriginalPrice("");
    setImage("");
    setImagesText("");
    setAdditionalImages([]);
    setSizesText("S, M, L, XL");
    setCategory("Kaos");
    setStock("");
    setDescription("");
    setIsFlashSale(false);
    setIsPromo(false);
    setIsBannerProduct(false);
    setBannerId("");
    setProductType("fashion");
    setPrintSize("");
    setWidth("");
    setHeight("");
    setUnit("cm");
    setStatus("active");
    setDisplayOrder("");
    setTags("");
    setMetaTitle("");
    setMetaDescription("");
    setSlug("");
    setProductCode("");
  };

  const clearBannerForm = () => {
    setIsEditingBanner(false);
    setEditBannerId(null);
    setBImage("");
    setBTitle("");
    setBSubtitle("");
    setBDescription("");
    setBBadge("");
    setBBgColor("transparent");
    setBLinkUrl("");
  };

  const handleBulkUpload = async () => {
    if (!bulkJson) {
      setMsg({ text: "Masukkan data JSON produk terlebih dahulu.", type: "error" });
      return;
    }
    try {
      const products = JSON.parse(bulkJson);
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": user?.email || ""
        },
        body: JSON.stringify({ products })
      });
      if (res.ok) {
        setMsg({ text: "Berhasil mengunggah produk massal!", type: "success" });
        setBulkJson("");
        onReloadProducts();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        const err = await res.json();
        setMsg({ text: err.error || "Gagal mengunggah produk massal.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Format JSON tidak valid. Pastikan array of products.", type: "error" });
    }
  };

  const handleEditClick = (p: Product) => {
    setIsEditing(true);
    setEditId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setOriginalPrice(p.originalPrice ? String(p.originalPrice) : "");
    setImage(p.image);
    setAdditionalImages(p.images || []);
    setSizesText(p.sizes ? p.sizes.join(", ") : "S, M, L, XL");
    setCategory(p.category);
    setStock(String(p.stock));
    setDescription(p.description);
    setIsFlashSale(Boolean(p.isFlashSale));
    setIsPromo(Boolean(p.isPromo));
    setIsBannerProduct(Boolean(p.isBannerProduct));
    setBannerId(p.bannerId || "");
    setProductType(p.productType || "fashion");
    setPrintSize(p.printSize || "");
    setWidth(p.width ? String(p.width) : "");
    setHeight(p.height ? String(p.height) : "");
    setUnit(p.unit || "cm");
    setStatus(p.status || "active");
    setDisplayOrder(p.displayOrder ? String(p.displayOrder) : "");
    setTags(p.tags ? p.tags.join(", ") : "");
    setMetaTitle(p.metaTitle || "");
    setMetaDescription(p.metaDescription || "");
    setSlug(p.slug || "");
    setProductCode(p.code || "");
    
    // Smooth scroll to form
    const formElement = document.getElementById("admin-product-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEditBannerClick = (b: Banner) => {
    setIsEditingBanner(true);
    setEditBannerId(b.id);
    setBImage(b.image);
    setBTitle(b.title);
    setBSubtitle(b.subtitle);
    setBDescription(b.description || "");
    setBBadge(b.badge);
    setBBgColor(b.bgColor || "transparent");
    setBLinkUrl(b.url || "");

    const formElement = document.getElementById("admin-banner-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Price is optional for DTF
    const isPriceReq = productType !== "dtf";
    if (!name || (isPriceReq && !price) || !category || !stock || !description || !image) {
      setMsg({ text: "Silakan isi semua kolom bertanda bintang (*), termasuk mengunggah gambar utama", type: "error" });
      return;
    }

    const mainImgTrimmed = image.trim();
    
    const parsedSizes = sizesText
      ? sizesText.split(",").map((s) => s.trim()).filter(Boolean)
      : ["S", "M", "L", "XL"];

    const payload: Partial<Product> = {
      name,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: mainImgTrimmed,
      images: additionalImages,
      sizes: parsedSizes,
      category,
      stock: Number(stock),
      description,
      isFlashSale,
      isPromo,
      isBannerProduct,
      bannerId: isBannerProduct ? bannerId : null,
      productType,
      printSize,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      unit,
      status,
      displayOrder: displayOrder ? Number(displayOrder) : undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      metaTitle,
      metaDescription,
      slug,
      code: productCode
    };

    let success = false;
    if (isEditing && editId) {
      success = await onUpdateProduct(editId, payload);
    } else {
      success = await onAddProduct(payload);
    }

    if (success) {
      setMsg({
        text: isEditing ? "Produk berhasil diperbarui!" : "Produk baru berhasil ditambahkan!",
        type: "success"
      });
      clearForm();
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } else {
      setMsg({ text: "Gagal menyimpan produk ke database.", type: "error" });
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bImage || !bTitle) {
      setMsg({ text: "Kolom Gambar dan Judul Banner wajib diisi!", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      image: bImage,
      title: bTitle,
      subtitle: bSubtitle,
      description: bDescription,
      badge: bBadge,
      bgColor: bBgColor,
      url: bLinkUrl
    };

    try {
      const url = isEditingBanner && editBannerId ? `/api/banners/${editBannerId}` : "/api/banners";
      const method = isEditingBanner ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMsg({
          text: isEditingBanner ? "Banner berhasil diperbarui!" : "Banner baru berhasil ditambahkan!",
          type: "success"
        });
        clearBannerForm();
        fetchBanners();
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        const errData = await res.json();
        setMsg({ text: errData.error || "Gagal menyimpan banner.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setConfirmDeleteId(productId);
    setConfirmDeleteName(productName);
    setConfirmDeleteType("product");
    setIsConfirmOpen(true);
  };

  const handleDeleteBannerClick = (bannerId: string, bannerTitle: string) => {
    setConfirmDeleteId(bannerId);
    setConfirmDeleteName(bannerTitle);
    setConfirmDeleteType("banner");
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId && confirmDeleteType !== "all-products") return;
    setIsDeleting(true);
    try {
      if (confirmDeleteType === "product") {
        const success = await onDeleteProduct(confirmDeleteId!);
        if (success) {
          setMsg({ text: `Produk "${confirmDeleteName}" berhasil dihapus.`, type: "success" });
          onReloadProducts();
        } else {
          setMsg({ text: "Gagal menghapus produk.", type: "error" });
        }
      } else if (confirmDeleteType === "all-products") {
        if (onDeleteProducts) {
          const success = await onDeleteProducts();
          if (success) {
            setMsg({ text: "Semua produk berhasil dihapus.", type: "success" });
            onReloadProducts();
          } else {
            setMsg({ text: "Gagal menghapus semua produk.", type: "error" });
          }
        }
      } else if (confirmDeleteType === "banner") {
        const res = await fetch(`/api/banners/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: `Banner "${confirmDeleteName}" berhasil dihapus.`, type: "success" });
          fetchBanners();
          if (onReloadSettings) onReloadSettings();
        } else {
          setMsg({ text: "Gagal menghapus banner.", type: "error" });
        }
      } else if (confirmDeleteType === "small-banner") {
        const res = await fetch(`/api/small-banners/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: "Foto banner berhasil dihapus!", type: "success" });
          fetchSmallBanners();
          if (onReloadSettings) onReloadSettings();
        } else {
          setMsg({ text: "Gagal menghapus foto banner.", type: "error" });
        }
      } else if (confirmDeleteType === "category") {
        const res = await fetch(`/api/categories/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: `Kategori "${confirmDeleteName}" berhasil dihapus.`, type: "success" });
          fetchCategories();
        } else {
          const err = await res.json();
          setMsg({ text: "Gagal menghapus kategori: " + (err.error || "Unknown"), type: "error" });
        }
      } else if (confirmDeleteType === "info-banner") {
        const res = await fetch(`/api/info-banners/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: "Banner info berhasil dihapus!", type: "success" });
          fetchInfoBanners();
          if (onReloadSettings) onReloadSettings();
        } else {
          setMsg({ text: "Gagal menghapus banner info.", type: "error" });
        }
      } else if (confirmDeleteType === "video-banner") {
        const res = await fetch(`/api/video-banners/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: "Video banner berhasil dihapus!", type: "success" });
          fetchVideoBanners();
          if (onReloadSettings) onReloadSettings();
        } else {
          setMsg({ text: "Gagal menghapus video banner.", type: "error" });
        }
      } else if (confirmDeleteType === "explore-video") {
        const res = await fetch(`/api/explore-videos/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: "Video explore berhasil dihapus!", type: "success" });
          fetchExploreVideos();
        } else {
          setMsg({ text: "Gagal menghapus video explore.", type: "error" });
        }
      } else if (confirmDeleteType === "video") {
        const res = await fetch(`/api/media/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
          setMsg({ text: "Video berhasil dihapus.", type: "success" });
        } else {
          const errData = await res.json();
          setMsg({ text: "Gagal menghapus video: " + (errData.error || "Unknown error"), type: "error" });
        }
      } else if (confirmDeleteType === "gallery") {
        await deleteDoc(doc(db, "designs", confirmDeleteId!));
        setMsg({ text: "Gambar galeri berhasil dihapus.", type: "success" });
        fetchGalleryDesigns();
      } else if (confirmDeleteType === "customer-upload") {
        await deleteDoc(doc(db, "customerUploads", confirmDeleteId!));
        setMsg({ text: "File penyimpanan khusus customer berhasil dihapus.", type: "success" });
        fetchCustomerUploads();
      }
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (err: any) {
      console.error("Delete execution failed:", err);
      setMsg({ text: "Terjadi kesalahan saat menghapus data.", type: "error" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
      setConfirmDeleteName("");
      setIsConfirmOpen(false);
    }
  };

  return (
    <div id="admin-panel-container" className="space-y-8 animate-fade-in pb-16">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-red-600" />
            <span>A-GIN FASHION Admin Console</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Dashboard kelola (CRUD) katalog busana fashion dan banner promo dinamis
          </p>
        </div>

        {/* Tab Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setAdminTab("dashboard")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "dashboard"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setAdminTab("marketing")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "marketing"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-yellow-500" />
            <span>Marketing</span>
          </button>
          <button
            onClick={() => setAdminTab("products")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "products"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>Produk Print DTF</span>
          </button>
          <button
            onClick={() => setAdminTab("categories")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "categories"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Kategori</span>
          </button>
          <button
            onClick={() => setAdminTab("gallery")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "gallery"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Galeri</span>
          </button>
          <button
            onClick={() => setAdminTab("banners")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "banners" || adminTab === "small-banners" || adminTab === "info-banners" || adminTab === "video-banners" || adminTab === "explore"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-pink-500" />
            <span>Banner</span>
          </button>
          <button
            onClick={() => setAdminTab("whatsapp")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "whatsapp"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => setAdminTab("orders")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "orders" || adminTab === "saved-designs" || adminTab === "customer-uploads"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pesanan</span>
          </button>
          <button
            onClick={() => setAdminTab("settings")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "settings"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-red-500" />
            <span>Pengaturan</span>
          </button>
          <button
            onClick={() => setAdminTab("users")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "users"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>User</span>
          </button>
          <button
            onClick={() => setAdminTab("backup")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "backup"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-blue-500" />
            <span>Backup Database</span>
          </button>
        </div>
      </div>

      {/* Message feedback */}
      {msg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2.5 ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border-red-100"
              : "bg-emerald-50 text-emerald-900 border-emerald-150"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* RENDER ACTIVE ADMIN TAB */}
      {adminTab === "marketing" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Manajemen Marketing</h2>
                <p className="text-xs text-slate-500 font-medium">Kelola pesan promosi dan teks berjalan di halaman depan.</p>
              
           
           <MarketingTextsManager 
              marketingTexts={marketingTexts}
              onSave={saveMarketingText}
              onDelete={deleteMarketingText}
           />
      </div>
    </>
  ) : adminTab === "dashboard" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <Sparkles className="w-10 h-10 text-purple-600" />
            <h2 className="text-2xl font-black text-slate-800">Selamat Datang di Admin A-GIN</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto mt-2">
              Kelola pesanan, produk, dan pengaturan website fashion Anda dari satu panel kontrol yang elegan.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Produk</p>
                <p className="text-2xl font-black text-emerald-950">{products.length}</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Pesanan</p>
                <p className="text-2xl font-black text-blue-950">{savedDesigns.length}</p>
              </div>
              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Total User</p>
                <p className="text-2xl font-black text-purple-950">{registeredUsers.length}</p></div></div>
      </div>
    </>
  ) : adminTab === "products" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Sub Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl inline-flex mb-2">
            <button
              onClick={() => { setProductTab("main"); clearForm(); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                productTab === "main" ? "bg-white text-emerald-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Produk Utama
            </button>
            <button
              onClick={() => { setProductTab("banner"); clearForm(); setIsBannerProduct(true); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                productTab === "banner" ? "bg-white text-emerald-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Produk Koleksi Banner
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Create/Edit - Left side */}
            <div className="lg:col-span-1 space-y-6">
            <div
              id="admin-product-form"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-5 sticky top-20 z-20"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>{isEditing ? "Edit Produk Sablon" : "Upload Produk Print DTF Baru"}</span>
                </h3>
                {isEditing && (
                  <button
                    onClick={clearForm}
                    className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Tipe Produk <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="productType" 
                        value="fashion" 
                        checked={productType === "fashion"} 
                        onChange={() => {
                          setProductType("fashion");
                          if (category === "Kaos" || category === "Hoodie" || category === "Jacket") {
                            setCategory("all");
                          }
                        }}
                        className="accent-red-600"
                      />
                      <span className="text-xs font-bold text-slate-700">Fashion Store</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="productType" 
                        value="dtf" 
                        checked={productType === "dtf"} 
                        onChange={() => {
                          setProductType("dtf");
                          setCategory("Kaos");
                        }}
                        className="accent-red-600"
                      />
                      <span className="text-xs font-bold text-slate-700">Print DTF</span>
                    </label>
                  </div>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Kaos Polos Cotton Combed 30s + Print DTF"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Product Code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Kode Produk (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="PRD-001"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {productType === "dtf" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Ukuran Cetak (e.g. A4, A3, Logo)
                      </label>
                      <input
                        type="text"
                        placeholder="A4 (21 x 29.7 cm)"
                        value={printSize}
                        onChange={(e) => setPrintSize(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Lebar
                      </label>
                      <input
                        type="number"
                        placeholder="21"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Tinggi
                      </label>
                      <input
                        type="number"
                        placeholder="29"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Satuan
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-semibold"
                      >
                        <option value="cm">cm (Centimeter)</option>
                        <option value="mm">mm (Millimeter)</option>
                        <option value="inch">inch (Inchi)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Price & Original Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Harga Jual <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-slate-400 text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2">Rp</span>
                      <input
                        type="number"
                        placeholder="150000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Harga Coret (Rp)
                    </label>
                    <div className="relative">
                      <span className="text-slate-400 text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2">Rp</span>
                      <input
                        type="number"
                        placeholder="250000"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-semibold"
                    >
                      {productType === "dtf" ? (
                        <>
                          <option value="Kaos">Kaos</option>
                          <option value="Hoodie">Hoodie</option>
                          <option value="Jacket">Jacket</option>
                        </>
                      ) : (
                        <>
                          <option value="all">Pilih Kategori</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.label}>{c.label}</option>
                          ))}
                          <option value="Promo">Promo Spesial</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Stok Tersedia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="25"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                    />
                  </div>
                </div>

                {/* Product Media Selection */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Upload Gambar Utama <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <ImageUploadButton 
                        label="Upload Foto"
                        currentUrl={image}
                        onUploadSuccess={setImage}
                      />
                      <button
                        type="button"
                        onClick={() => openMediaModal("product")}
                        className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5" />
                        <span>GALERI</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Upload Gambar Tambahan (Maks 6)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <ImageUploadButton 
                        label="Upload Foto"
                        onUploadSuccess={handleAddGalleryImage}
                      />
                      <button
                        type="button"
                        onClick={() => openMediaModal("additional")}
                        className="bg-emerald-950 text-white rounded-xl flex items-center justify-center p-2 text-[10px] font-bold hover:bg-emerald-900 transition-colors cursor-pointer gap-1.5"
                      >
                        <Image className="w-3.5 h-3.5" />
                        <span>GALERI</span>
                      </button>
                    </div>
                    
                    {additionalImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {additionalImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 transition-opacity shadow-md z-10 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">
                      Gambar tambahan akan tampil di bagian detail produk saat pengguna melakukan scroll.
                    </p>
                  </div>
                </div>

                {/* Sizes Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Pilihan Ukuran Tersedia (Pisahkan dengan Koma)
                  </label>
                  <input
                    type="text"
                    placeholder="S, M, L, XL, XXL"
                    value={sizesText}
                    onChange={(e) => setSizesText(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-semibold"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Contoh: S, M, L, XL, XXL atau 28, 30, 32. Pelanggan bisa memilih ukuran ini saat checkout.</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Deskripsi Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan spesifikasi bahan dan ukuran..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium resize-none"
                  />
                </div>

                {/* Flash Sale Switch */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600 fill-red-500" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Aktifkan Flash Sale</p>
                      <p className="text-[9px] text-slate-400">Tampilkan di Kejar Diskon</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFlashSale}
                    onChange={(e) => setIsFlashSale(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-600 border-slate-300 cursor-pointer"
                  />
                </div>

                {/* Promo Switch */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-red-600 fill-red-500" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Aktifkan Promo Spesial</p>
                      <p className="text-[9px] text-slate-400">Tampilkan di Halaman Kategori Promo</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPromo}
                    onChange={(e) => setIsPromo(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-600 border-slate-300 cursor-pointer"
                  />
                </div>

                {/* Banner Only Switch */}
                <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">Khusus Video Banner</p>
                        <p className="text-[9px] text-slate-400">Hanya tampil di tombol "Shop" video banner</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBannerProduct}
                      onChange={(e) => setIsBannerProduct(e.target.checked)}
                      disabled={productTab === "banner"}
                      className={`w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600 border-slate-300 ${productTab === "banner" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    />
                  </div>
                  
                  {isBannerProduct && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Pilih Target Video Banner *
                      </label>
                      <select
                        value={bannerId}
                        onChange={(e) => setBannerId(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-700 font-semibold"
                        required={isBannerProduct}
                      >
                        <option value="">-- Pilih Banner --</option>
                        {videoBanners.map((vb) => (
                          <option key={vb.id} value={vb.id}>
                            {vb.title} ({vb.position})
                          </option>
                        ))}
                      </select>
                      {videoBanners.length === 0 && (
                        <p className="text-[8px] text-amber-600 font-medium italic">Belum ada video banner aktif. Silakan buat di tab Banners.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* SEO & Status */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pengaturan Lanjutan & SEO</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Status Produk
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-semibold"
                      >
                        <option value="active">Aktif (Tampil)</option>
                        <option value="inactive">Non-Aktif (Sembunyi)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Urutan Tampilan
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Tag (Pisahkan dengan Koma)
                    </label>
                    <input
                      type="text"
                      placeholder="dtf, sablon, kaos, custom"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Slug URL (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="sablon-dtf-kaos-combed"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Meta Title (SEO)
                    </label>
                    <input
                      type="text"
                      placeholder="Jasa Sablon DTF Kaos Surabaya Termurah"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Meta Description (SEO)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Deskripsi untuk mesin pencari..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <button
                  type="submit"
                  className={`w-full text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                    isEditing
                      ? "bg-emerald-950 hover:bg-emerald-900 shadow-slate-900/10"
                      : "bg-red-600 hover:bg-red-700 shadow-red-600/15"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditing ? "Perbarui Produk" : "Simpan Produk Baru"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Inventory Database Table - Right side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>Gudang Produk ({productTab === "main" ? filteredAdminProducts.length : filteredBannerProducts.length} Data)</span>
                </h3>
                <div className="flex items-center gap-4">
                  {products.length > 0 && onDeleteProducts && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(null);
                        setConfirmDeleteName("Semua Produk di Gudang");
                        setConfirmDeleteType("all-products");
                        setIsConfirmOpen(true);
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 border border-red-200 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setAdminProductFilter("all")}
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${adminProductFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setAdminProductFilter("fashion")}
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${adminProductFilter === "fashion" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Fashion
                    </button>
                    <button
                      onClick={() => setAdminProductFilter("dtf")}
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${adminProductFilter === "dtf" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Sablon DTF
                    </button>
                  </div>
                  <button
                    onClick={onReloadProducts}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {(productTab === "main" ? productChunks : bannerProductChunks).map((chunk, chunkIdx) => (
                  <div key={chunkIdx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black">
                          {chunkIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Gudang #{chunkIdx + 1}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{chunk.length} Produk Tersimpan</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {chunk.map((p) => (
                          <div 
                            key={p.id} 
                            className="relative group bg-white rounded-2xl border border-slate-150 p-2.5 transition-all hover:shadow-md hover:border-red-200 overflow-hidden cursor-pointer"
                            onClick={() => onViewDetail && onViewDetail(p)}
                          >
                            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2.5 border border-slate-100 bg-slate-50">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {p.productType === "dtf" ? (
                                  <span className="px-1.5 py-0.5 bg-purple-600 text-[8px] font-black text-white rounded uppercase tracking-tighter shadow-sm border border-purple-400">DTF</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-blue-600 text-[8px] font-black text-white rounded uppercase tracking-tighter shadow-sm border border-blue-400">Fashion</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 mb-2">
                              <p className="text-[10px] font-extrabold text-slate-800 truncate leading-tight" title={p.name}>{p.name}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] text-red-600 font-black">Rp {p.price.toLocaleString("id-ID")}</p>
                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">STOK: {p.stock}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(p);
                                }}
                                className="flex-1 py-1.5 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white text-[8px] font-black rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit className="w-2.5 h-2.5" />
                                EDIT
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(p.id, p.name);
                                }}
                                className="flex-1 py-1.5 bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white text-[8px] font-black rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                HAPUS
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Package className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gudang Kosong</p>
                    <p className="text-[10px] text-slate-300 mt-1 font-bold">Silahkan upload produk baru di panel samping.</p>
                  </div>
                )}</div></div></div></div>
      </div>
    </>
  ) : adminTab === "banners" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-black flex items-center gap-2">
              <Image className="w-5 h-5 text-yellow-400" />
              <span>Manajemen Banner & Konten Visual</span>
            </h3>
            <p className="text-purple-200 text-xs font-medium mt-1">
              Kelola semua banner promo, slogan, dan video banner dari satu tempat untuk tampilan marketplace yang konsisten.
            </p>
          

          {/* Sub-tab Navigation for Banners */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAdminTab("banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-yellow-500" />
              <span>Banner Utama (Hero Slider)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("small-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "small-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layout className="w-3.5 h-3.5 text-pink-500" />
              <span>Banner Promo Kecil</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("info-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "info-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Banner Info Tengah (Nike-Style)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("video-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "video-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Video Banner</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Banner Utama (Hero)</h4>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <form id="admin-banner-form" onSubmit={handleBannerSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Gambar Banner <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <ImageUploadButton 
                        label="Upload Banner"
                        currentUrl={bImage}
                        onUploadSuccess={setBImage}
                      />
                      <button
                        type="button"
                        onClick={() => openMediaModal("product")}
                        className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5" />
                        <span>GALERI</span>
                      </button>
                    </div>
                    {bImage && (
                      <div className="mt-2 aspect-[21/9] w-full rounded-lg overflow-hidden border border-slate-200">
                        <img src={bImage} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Judul Banner</label>
                    <input
                      type="text"
                      value={bTitle}
                      onChange={(e) => setBTitle(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium"
                      placeholder="Promo Gajian"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sub-Judul</label>
                    <input
                      type="text"
                      value={bSubtitle}
                      onChange={(e) => setBSubtitle(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium"
                      placeholder="Diskon 50% All Item"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Deskripsi (Untuk Halaman Banner)</label>
                    <textarea
                      value={bDescription}
                      onChange={(e) => setBDescription(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium min-h-[80px]"
                      placeholder="Detail promo atau deskripsi banner..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Label Badge (Merah)</label>
                    <input
                      type="text"
                      value={bBadge}
                      onChange={(e) => setBBadge(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium"
                      placeholder="TERBATAS"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">URL Tujuan (Opsional)</label>
                    <input
                      type="url"
                      value={bLinkUrl}
                      onChange={(e) => setBLinkUrl(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium"
                      placeholder="https://... atau /products/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Warna Background (Optional)</label>
                    <input
                      type="text"
                      value={bBgColor}
                      onChange={(e) => setBBgColor(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-700 font-medium"
                      placeholder="#F5F5F5 atau transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isEditingBanner ? (
                      <span className="flex items-center gap-2"><Edit className="w-4 h-4" /> Simpan Perubahan Banner</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Banner Slide</span>
                    )}
                  </button>
                  {isEditingBanner && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBanner(false);
                        setEditBannerId(null);
                        setBImage("");
                        setBTitle("");
                        setBSubtitle("");
                        setBDescription("");
                        setBBadge("");
                        setBBgColor("transparent");
                        setBLinkUrl("");
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

          {/* Banner Database Table - Right side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Image className="w-4 h-4 text-slate-400" />
                  <span>Daftar Slide Banner Aktif ({banners.length})</span>
                </h3>
                <button
                  onClick={fetchBanners}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  <span>Reload</span>
                </button>
              </div>

              {bannersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400 font-semibold">Mengambil daftar banner...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Tampilan</th>
                          <th className="py-3 px-4">Judul Banner</th>
                          <th className="py-3 px-4">Badge</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {banners.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Banner image preview */}
                            <td className="py-3 px-4">
                              <div className="w-20 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-150 flex-shrink-0">
                                <img
                                  src={b.image}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>

                            {/* Details */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800">{b.title}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[220px] font-medium">{b.subtitle}</p>
                            </td>

                            {/* Badge label */}
                            <td className="py-3 px-4">
                              <span className="text-[9px] font-extrabold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                {b.badge}
                              </span>
                            </td>

                            {/* Action triggers */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditBannerClick(b)}
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-950 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Banner"
                                >
                                  <Edit className="w-3.5 h-3.5 text-emerald-900" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteBannerClick(b.id, b.title)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Banner"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {banners.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                              Belum ada banner di database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card-List View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {banners.map((b) => (
                      <div key={b.id} className="p-4 space-y-3 hover:bg-slate-50/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-11 bg-slate-100 rounded-lg overflow-hidden border border-slate-150 flex-shrink-0">
                            <img
                              src={b.image}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-slate-800 text-xs truncate">{b.title}</p>
                            <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">{b.subtitle}</p>
                            <div className="mt-1">
                              <span className="inline-block text-[8px] font-extrabold bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                {b.badge}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-100">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditBannerClick(b)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all border border-slate-200 cursor-pointer h-9"
                            title="Edit Banner"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteBannerClick(b.id, b.title)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] rounded-lg transition-all border border-red-100 cursor-pointer h-9"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Hapus</span>
                          </motion.button>
                        </div>
                      </div>
                    ))}

                    {banners.length === 0 && (
                      <div className="text-center py-12 text-slate-400 font-medium text-xs">
                        Belum ada banner di database.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Direct preview panel info card */}
            <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl flex items-start gap-3.5 border border-emerald-900 shadow-lg">
              <Eye className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Syncing Hero Slider</h4>
                <p className="text-[11px] text-emerald-200 mt-1 leading-relaxed">
                  Semua banner promo yang Anda buat atau modifikasi di sini akan disinkronisasikan langsung secara real-time ke halaman utama pelanggan Tokopedia Fashion Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : adminTab === "small-banners" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Sub-tab Navigation for Banners */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAdminTab("banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-yellow-500" />
              <span>Banner Utama (Hero Slider)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("small-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "small-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layout className="w-3.5 h-3.5 text-pink-500" />
              <span>Banner Promo Kecil</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("info-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "info-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Banner Info Tengah (Nike-Style)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("video-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "video-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Video Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Small Banner Edit/Create - Left side */}
          <div className="lg:col-span-1 space-y-6">
            <div
              id="small-banner-form"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-5 "
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-600" />
                  <span>{isEditingSmallBanner ? "Edit Foto Slogan" : "Posting Foto Slogan Baru"}</span>
                </h3>
                {isEditingSmallBanner && (
                  <button 
                    onClick={() => {
                      setIsEditingSmallBanner(false);
                      setEditSmallBannerId(null);
                      setSbImage("");
                      setSbTitle("");
                      setSbSubtitle("");
                    }}
                    className="text-[10px] font-black text-red-600 uppercase hover:underline cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Foto-foto ini akan diputar bergantian pada Banner Kecil di sebelah teks display **MADE TO MOVE**.
              </p>

              <form onSubmit={handleSmallBannerSubmit} className="space-y-4">
                {/* Banner Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Slogan Display <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sbTitle}
                    placeholder="MADE TO MOVE"
                    onChange={(e) => setSbTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Keterangan Singkat / Sub-judul
                  </label>
                  <input
                    type="text"
                    placeholder="A-GIN Sportswear Line"
                    value={sbSubtitle}
                    onChange={(e) => setSbSubtitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Gambar Banner <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <ImageUploadButton 
                      label="Upload Foto"
                      currentUrl={sbImage}
                      onUploadSuccess={setSbImage}
                    />
                    <button
                      type="button"
                      onClick={() => openMediaModal("small-banner")}
                      className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>GALERI</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer bg-red-600 hover:bg-red-700 shadow-red-600/15"
                >
                  {isEditingSmallBanner ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isEditingSmallBanner ? "Perbarui Foto Slogan" : "Post Foto Slogan"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Small Banner Database Table - Right side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Foto Slogan Aktif ({smallBanners.length})</span>
                </h3>
                <button
                  onClick={fetchSmallBanners}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  <span>Reload</span>
                </button>
              </div>

              {smallBannersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400 font-semibold">Mengambil daftar banner kecil...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Tampilan</th>
                          <th className="py-3 px-4">Judul / Slogan</th>
                          <th className="py-3 px-4">Keterangan</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {smallBanners.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="w-20 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                                <img
                                  src={b.image}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-950">
                              {b.title}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-semibold">
                              {b.subtitle || "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditSmallBanner(b)}
                                  className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer inline-flex items-center"
                                  title="Edit Banner Slogan"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(b.id);
                                    setConfirmDeleteName(b.title || "Foto Slogan");
                                    setConfirmDeleteType("small-banner");
                                    setIsConfirmOpen(true);
                                  }}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer inline-flex items-center"
                                  title="Hapus Banner Slogan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {smallBanners.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-slate-400 font-semibold text-xs">
                              Belum ada foto slogan. Upload di form sebelah kiri untuk memulai!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards List View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {smallBanners.map((b) => (
                      <div key={b.id} className="p-4 space-y-3 hover:bg-slate-50/40">
                        <div className="flex gap-4">
                          <div className="w-24 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                            <img
                              src={b.image}
                              alt={b.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-emerald-950 text-xs">{b.title}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">{b.subtitle || "Tidak ada keterangan"}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleEditSmallBanner(b)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(b.id);
                              setConfirmDeleteName(b.title || "Foto Slogan");
                              setConfirmDeleteType("small-banner");
                              setIsConfirmOpen(true);
                            }}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {smallBanners.length === 0 && (
                      <div className="py-10 text-center text-slate-400 font-semibold text-xs">
                        Belum ada foto slogan. Upload di form sebelah kiri untuk memulai!
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Direct preview panel info card */}
            <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl flex items-start gap-3.5 border border-emerald-900 shadow-lg">
              <Eye className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Syncing Banner Slogan</h4>
                <p className="text-[11px] text-emerald-200 mt-1 leading-relaxed">
                  Semua foto slogan yang Anda post di sini akan ter-update secara otomatis di bawah banner promosi utama, di sebelah teks display **MADE TO MOVE**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : adminTab === "info-banners" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Sub-tab Navigation for Banners */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAdminTab("banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-yellow-500" />
              <span>Banner Utama (Hero Slider)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("small-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "small-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layout className="w-3.5 h-3.5 text-pink-500" />
              <span>Banner Promo Kecil</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("info-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "info-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Banner Info Tengah (Nike-Style)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("video-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "video-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Video Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Create/Edit - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-sans font-black text-emerald-950 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{isEditingInfoBanner ? "Edit Banner Info" : "Tambah Banner Info Baru"}</span>
                </h3>
                {isEditingInfoBanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInfoBanner(false);
                      setEditInfoBannerId(null);
                      setIbImage("");
                      setIbTitle("");
                      setIbSubtitle("");
                      setIbButtonText("");
                      setIbButtonUrl("");
                      setIbBgColor("#dc2626");
                      setIbTextColor("#ffffff");
                      setIbIsActive(true);
                    }}
                    className="text-[10px] font-black tracking-wider text-red-600 hover:underline uppercase"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleInfoBannerSubmit} className="space-y-4">
                {/* Image field */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Gambar Latar Belakang (Wajib)
                  </label>
                  <div className="flex gap-2">
                    <ImageUploadButton 
                      label="Upload Gambar"
                      currentUrl={ibImage}
                      onUploadSuccess={setIbImage}
                    />
                    <button
                      type="button"
                      onClick={() => openMediaModal("info-banner")}
                      className="px-3 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800 transition-colors font-bold whitespace-nowrap cursor-pointer"
                    >
                      Pilih Galeri
                    </button>
                  </div>
                  {ibImage && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-150 h-28 bg-slate-100 flex items-center justify-center">
                      <img src={ibImage} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Judul Utama Banner
                  </label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Contoh: KUALITAS PRINTING DTF TERBAIK"
                    value={ibTitle}
                    onChange={(e) => setIbTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Sub-judul / Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Contoh: Menggunakan mesin industri Jepang terbaru & tinta premium..."
                    value={ibSubtitle}
                    onChange={(e) => setIbSubtitle(e.target.value)}
                  />
                </div>

                {/* Button text and link */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Teks Tombol
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                      placeholder="KUSTOM SEKARANG"
                      value={ibButtonText}
                      onChange={(e) => setIbButtonText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Link URL Tombol
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                      placeholder="#Sablon DTF"
                      value={ibButtonUrl}
                      onChange={(e) => setIbButtonUrl(e.target.value)}
                    />
                  </div>
                </div>

                {/* Background Color & Text Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Warna Background
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                        value={ibBgColor}
                        onChange={(e) => setIbBgColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                        value={ibBgColor}
                        onChange={(e) => setIbBgColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Warna Teks
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                        value={ibTextColor}
                        onChange={(e) => setIbTextColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                        value={ibTextColor}
                        onChange={(e) => setIbTextColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ibIsActive"
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    checked={ibIsActive}
                    onChange={(e) => setIbIsActive(e.target.checked)}
                  />
                  <label htmlFor="ibIsActive" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                    Tampilkan di Halaman Utama (Aktif)
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-950 text-white hover:bg-emerald-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                >
                  {isEditingInfoBanner ? "Simpan Perubahan" : "Simpan Banner Info"}
                </button>
              </form>
            </div>
          </div>

          {/* List of existing banners - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-sans font-black text-emerald-950 text-sm uppercase tracking-wider mb-4">
                Daftar Banner Info Tengah ({infoBanners.length})
              </h3>

              {infoBannersLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-950" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {infoBanners.map((b) => (
                    <div
                      key={b.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden h-36 bg-slate-200 border border-slate-100 flex items-center">
                          {b.image ? (
                            <>
                              <img src={b.image} className="w-full h-full object-cover" alt={b.title} referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-slate-900/40 flex items-end p-2.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border shadow-sm ${
                                  b.isActive !== false
                                    ? "bg-emerald-500 text-white border-emerald-400"
                                    : "bg-slate-500 text-white border-slate-400"
                                }`}>
                                  {b.isActive !== false ? "Aktif" : "Non-aktif"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-slate-400 text-xs w-full text-center font-bold">Tidak ada gambar</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-emerald-950 text-sm leading-tight line-clamp-1">{b.title}</h4>
                          {b.subtitle && <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">{b.subtitle}</p>}
                        </div>

                        {/* Styles indicators */}
                        <div className="flex gap-2 text-[10px] font-bold">
                          <span className="px-2 py-1 rounded bg-white border border-slate-200 font-mono">
                            BG: {b.bgColor || "#0f172a"}
                          </span>
                          <span className="px-2 py-1 rounded bg-white border border-slate-200 font-mono">
                            Teks: {b.textColor || "#ffffff"}
                          </span>
                          {b.buttonText && (
                            <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Tombol: {b.buttonText}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleEditInfoBanner(b)}
                          className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInfoBanner(b.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {infoBanners.length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-semibold text-xs col-span-2">
                      Belum ada banner info tengah. Silakan upload menggunakan form di sebelah kiri!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Syncing alert card */}
            <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl flex items-start gap-3.5 border border-emerald-900 shadow-lg">
              <Eye className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Syncing Banner Info Tengah</h4>
                <p className="text-[11px] text-emerald-200 mt-1 leading-relaxed">
                  Semua banner info tengah yang berstatus aktif akan ditampilkan secara otomatis di bawah banner slogan **MADE TO MOVE** pada halaman depan toko Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : adminTab === "video-banners" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Sub-tab Navigation for Banners */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAdminTab("banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-yellow-500" />
              <span>Banner Utama (Hero Slider)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("small-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "small-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layout className="w-3.5 h-3.5 text-pink-500" />
              <span>Banner Promo Kecil</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("info-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "info-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Banner Info Tengah (Nike-Style)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("video-banners")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "video-banners"
                  ? "bg-emerald-950 text-white shadow-sm font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Video Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-20 z-20">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-600" />
                  <span>{isEditingVideoBanner ? "Edit Video Banner" : "Tambah Video Banner Baru"}</span>
                </h3>
                {isEditingVideoBanner && (
                  <button onClick={() => { setIsEditingVideoBanner(false); setEditVideoBannerId(null); setVbVideoUrl(""); setVbPosterUrl(""); setVbTitle(""); setVbSubtitle(""); setVbButtonText(""); setVbButtonUrl(""); setVbIsActive(true); setVbPosition("top"); }} className="text-xs text-red-600 hover:underline font-bold cursor-pointer">Batal</button>
                )}
              </div>

              <form onSubmit={handleVideoBannerSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Video URL <span className="text-red-500">*</span></label>
                  <input type="text" value={vbVideoUrl} onChange={(e) => setVbVideoUrl(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg mb-2" placeholder="Masukkan URL video atau upload" />
                  <div className="flex gap-2">
                    <VideoUploadButton label="Upload Video" currentUrl={vbVideoUrl} onUploadSuccess={setVbVideoUrl} />
                    <button type="button" onClick={() => openMediaModal("video-banner-video")} className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"><Image className="w-3.5 h-3.5" /><span>GALERI</span></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Poster URL (Gambar Thumbnail)</label>
                  <div className="flex gap-2">
                    <ImageUploadButton label="Upload Poster" currentUrl={vbPosterUrl} onUploadSuccess={setVbPosterUrl} />
                    <button type="button" onClick={() => openMediaModal("video-banner-poster")} className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"><Image className="w-3.5 h-3.5" /><span>GALERI</span></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Judul Banner (Kosongkan jika tanpa tulisan)</label>
                  <input type="text" value={vbTitle} onChange={(e) => setVbTitle(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" placeholder="DIVE INTO THE FUTURE" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Sub-judul Banner (Kosongkan jika tanpa deskripsi)</label>
                  <input type="text" value={vbSubtitle} onChange={(e) => setVbSubtitle(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" placeholder="Experience the next generation of fashion" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Teks Tombol</label>
                    <input type="text" value={vbButtonText} onChange={(e) => setVbButtonText(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" placeholder="EXPLORE NOW" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Link Tombol</label>
                    <input type="text" value={vbButtonUrl} onChange={(e) => setVbButtonUrl(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" placeholder="#shop atau #explore" />
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gunakan **#explore** untuk membuka galeri video.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Posisi</label>
                    <select value={vbPosition} onChange={(e) => setVbPosition(e.target.value as any)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                      <option value="top">Atas (Hero)</option>
                      <option value="middle">Tengah</option>
                      <option value="bottom">Bawah</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Status</label>
                    <select value={vbIsActive ? "active" : "inactive"} onChange={(e) => setVbIsActive(e.target.value === "active")} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                      <option value="active">Aktif</option>
                      <option value="inactive">Non-aktif</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer">
                  {isEditingVideoBanner ? "Perbarui Video Banner" : "Simpan Video Banner"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-sans font-black text-emerald-950 text-sm uppercase tracking-wider mb-4">Daftar Video Banners ({videoBanners.length})</h3>
              {videoBannersLoading ? (
                <div className="py-12 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-950" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoBanners.map((b) => (
                    <div key={b.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden h-36 bg-black border border-slate-100 flex items-center justify-center">
                          <video src={b.videoUrl} className="w-full h-full object-cover opacity-60" autoPlay muted playsInline loop />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white opacity-50" />
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1 z-30">
                            <VideoStatusBadge videoUrl={b.videoUrl} />
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border shadow-sm ${b.isActive ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-500 text-white border-slate-400"}`}>{b.isActive ? "Aktif" : "Non-aktif"}</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border shadow-sm bg-indigo-500 text-white border-indigo-400">{b.position}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-emerald-950 text-sm leading-tight line-clamp-1">
                            {b.position === "top" ? "Video Banner Atas (Hero)" : b.position === "middle" ? "Video Banner Tengah" : "Video Banner Bawah"}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{b.videoUrl}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            📦 {products.filter(p => p.bannerId === b.id).length} Produk Terkait
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-3 mt-3 border-t border-slate-200 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedBannerForProducts(b);
                            if (categories && categories.length > 0) {
                              setQuickPCategory(categories[0].slug || categories[0].id || "Kaos");
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-lg transition-colors font-black text-[10px] flex items-center gap-1 cursor-pointer mr-auto"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Upload Produk</span>
                        </button>
                        <button onClick={() => handleEditVideoBanner(b)} className="px-2 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-bold text-[10px] cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteVideoBanner(b.id)} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /><span>Hapus</span></button>
                      </div>
                    </div>
                  ))}
                  {videoBanners.length === 0 && <div className="py-10 text-center text-slate-400 font-semibold text-xs col-span-2">Belum ada video banner.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kelola Produk Video Banner */}
      <AnimatePresence>
        {selectedBannerForProducts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-sans font-black text-emerald-950 text-base uppercase tracking-tight flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600 animate-bounce" />
                    <span>Upload & Kelola Produk: {selectedBannerForProducts.title || "Video Banner"}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Hubungkan produk jualan Anda secara eksklusif ke tampilan banner video ({selectedBannerForProducts.position})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBannerForProducts(null);
                    setQuickPMsg({ text: "", type: "" });
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Quick Add Form */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                    <h4 className="font-sans font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Upload Produk Baru</span>
                    </h4>

                    {quickPMsg.text && (
                      <div className={`p-3 rounded-lg text-[10px] font-bold border ${quickPMsg.type === "error" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}>
                        {quickPMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleQuickProductSubmit} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Nama Produk *</label>
                        <input
                          type="text"
                          required
                          value={quickPName}
                          onChange={(e) => setQuickPName(e.target.value)}
                          placeholder="Contoh: Kaos Oversize Premium"
                          className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Harga (Rp) *</label>
                          <input
                            type="number"
                            required
                            value={quickPPrice}
                            onChange={(e) => setQuickPPrice(e.target.value)}
                            placeholder="149000"
                            className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Stok *</label>
                          <input
                            type="number"
                            required
                            value={quickPStock}
                            onChange={(e) => setQuickPStock(e.target.value)}
                            placeholder="100"
                            className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Kategori *</label>
                        <select
                          required
                          value={quickPCategory}
                          onChange={(e) => setQuickPCategory(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold text-slate-700"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug || c.id}>{c.name}</option>
                          ))}
                          <option value="Kaos">Kaos (Default)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">URL Gambar Produk *</label>
                        <input
                          type="text"
                          required
                          value={quickPImage}
                          onChange={(e) => setQuickPImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold mb-1"
                        />
                        <div className="flex gap-2">
                          <ImageUploadButton label="Upload Gambar" currentUrl={quickPImage} onUploadSuccess={setQuickPImage} />
                          <button
                            type="button"
                            onClick={() => {
                              setMediaTarget("video-banner-product");
                              setIsMediaModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-950 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Image className="w-3 h-3" />
                            <span>GALERI</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Deskripsi Singkat</label>
                        <textarea
                          value={quickPDesc}
                          onChange={(e) => setQuickPDesc(e.target.value)}
                          placeholder="Masukkan deskripsi detail bahan, ukuran, dll."
                          rows={3}
                          className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-emerald-600 font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer mt-2"
                      >
                        Simpan & Kaitkan Produk
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: Existing Products list */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-sans font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Produk Terkait ({products.filter(p => p.bannerId === selectedBannerForProducts.id).length})
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
                      Eksklusif Banner
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {products.filter(p => p.bannerId === selectedBannerForProducts.id).length > 0 ? (
                      products.filter(p => p.bannerId === selectedBannerForProducts.id).map((p) => (
                        <div key={p.id} className="border border-slate-200 rounded-2xl p-3 bg-white hover:border-slate-300 transition-colors flex gap-3 relative">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h5 className="font-black text-xs text-slate-900 uppercase tracking-tight truncate">{p.name}</h5>
                              <p className="text-[10px] text-red-600 font-extrabold">Rp {Number(p.price).toLocaleString("id-ID")}</p>
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md inline-block mt-1">
                                {p.category}
                              </span>
                            </div>
                            <div className="flex gap-1.5 pt-1 mt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleUnlinkProduct(p.id)}
                                className="text-[9px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                                title="Lepas kaitan produk dari banner ini"
                              >
                                Lepas Kaitan
                              </button>
                              {quickDeleteConfirmId === p.id ? (
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProductQuick(p.id)}
                                    className="text-[9px] font-black text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700 transition-colors cursor-pointer"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickDeleteConfirmId(null)}
                                    className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setQuickDeleteConfirmId(p.id)}
                                  className="text-[9px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 font-semibold text-xs col-span-2 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6">
                        <Package className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="font-extrabold uppercase text-[10px] tracking-widest text-slate-400">Belum ada Produk Terkait</p>
                        <p className="text-[9px] text-slate-400 mt-1 max-w-xs leading-normal">Gunakan form di sebelah kiri untuk mengupload produk jualan baru secara langsung ke video banner ini!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  ) : adminTab === "explore" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{isEditingExploreVideo ? "Edit Video Explore" : "Tambah Video Explore"}</span>
                </h3>
                {isEditingExploreVideo && (
                  <button onClick={() => { setIsEditingExploreVideo(false); setEditExploreVideoId(null); setEvVideoUrl(""); setEvThumbUrl(""); setEvTitle(""); setEvDesc(""); setEvIsActive(true); }} className="text-xs text-red-600 hover:underline font-bold cursor-pointer">Batal</button>
                )}
              

              <form onSubmit={handleExploreVideoSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Video URL <span className="text-red-500">*</span></label>
                  <input type="text" value={evVideoUrl} onChange={(e) => setEvVideoUrl(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg mb-2" placeholder="Masukkan URL video atau upload" />
                  <div className="flex gap-2">
                    <VideoUploadButton label="Upload Video" currentUrl={evVideoUrl} onUploadSuccess={setEvVideoUrl} />
                    <button type="button" onClick={() => openMediaModal("explore-video")} className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"><Image className="w-3.5 h-3.5" /><span>GALERI</span></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Thumbnail URL</label>
                  <div className="flex gap-2">
                    <ImageUploadButton label="Upload Thumb" currentUrl={evThumbUrl} onUploadSuccess={setEvThumbUrl} />
                    <button type="button" onClick={() => openMediaModal("explore-thumb")} className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"><Image className="w-3.5 h-3.5" /><span>GALERI</span></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Judul Video <span className="text-red-500">*</span></label>
                  <input type="text" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" placeholder="A-GIN Summer Collection 2026" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Deskripsi Singkat</label>
                  <textarea value={evDesc} onChange={(e) => setEvDesc(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-20" placeholder="Ceritakan tentang video ini..." />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Status</label>
                  <select value={evIsActive ? "active" : "inactive"} onChange={(e) => setEvIsActive(e.target.value === "active")} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="active">Aktif (Tampil)</option>
                    <option value="inactive">Non-aktif (Sembunyikan)</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer">
                  {isEditingExploreVideo ? "Perbarui Video" : "Simpan Video Explore"}
                </button>
              </form>
            
          

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-sans font-black text-emerald-950 text-sm uppercase tracking-wider mb-4">Galeri Explore ({exploreVideos.length})</h3>
              {exploreVideosLoading ? (
                <div className="py-12 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-950" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exploreVideos.map((v) => (
                    <div key={v.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden h-40 bg-black border border-slate-100">
                          {v.thumbnailUrl ? (
                            <img src={v.thumbnailUrl} className="w-full h-full object-cover" alt={v.title} />
                          ) : (
                            <video src={v.videoUrl} className="w-full h-full object-cover opacity-50" autoPlay muted playsInline loop />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1 z-30">
                            <VideoStatusBadge videoUrl={v.videoUrl} />
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border shadow-sm ${v.isActive ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-500 text-white border-slate-400"}`}>{v.isActive ? "Aktif" : "Hidden"}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-emerald-950 text-sm leading-tight line-clamp-1">{v.title}</h4>
                          {v.description && <p className="text-[10px] text-slate-500 font-semibold line-clamp-2">{v.description}</p>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-200">
                        <button onClick={() => handleEditExploreVideo(v)} className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-bold text-[10px] cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteExploreVideo(v.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /><span>Hapus</span></button>
                      </div>
                    </div>
                  ))}
                  {exploreVideos.length === 0 && <div className="py-10 text-center text-slate-400 font-semibold text-xs col-span-2">Belum ada video explore.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
  ) : adminTab === "diagnostics" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2 mb-6">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Connection Status Dashboard</span>
          </h3>
          {diagnosticsLoading ? (
            <p className="text-xs text-slate-500 font-medium">Checking configuration...</p>
          ) : diagnostics ? (
            <div className="space-y-4">
              {Object.entries(diagnostics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-xs font-bold text-slate-700">{key}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${value === "true" || value === "VALID" || value === "CONFIGURED" ? "bg-emerald-100 text-emerald-800" : value === "false" || value === "INVALID KEY" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                    {String(value).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-red-500 font-medium">Failed to fetch diagnostics.</p>
          )}
      </div>
    </>
  ) : adminTab === "categories" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-serif text-2xl text-[#111111]">Kelola Kategori & Ikon</h2>
            {isEditingCategory && (
              <button 
                onClick={() => {
                  setIsEditingCategory(false);
                  setEditCategoryId(null);
                  setCatLabel("");
                  setCatImage("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          
          <form id="category-form" onSubmit={handleAddCategory} className="space-y-4 max-w-xl mb-8">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Nama Kategori</label>
              <input type="text" required value={catLabel} onChange={e => setCatLabel(e.target.value)} className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Gambar Kategori / Ikon</label>
              <div className="flex gap-2">
                <ImageUploadButton 
                  label="Upload Ikon"
                  currentUrl={catImage}
                  onUploadSuccess={setCatImage}
                />
                <button
                  type="button"
                  onClick={() => openMediaModal("category")}
                  className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>GALERI</span>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer">
              {isEditingCategory ? "Perbarui Kategori" : "Simpan Kategori Baru"}
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.map((cat: any) => (
              <div key={cat.id} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center bg-slate-50 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 rounded-full bg-white overflow-hidden mb-3 border shadow-sm flex items-center justify-center">
                  {cat.image ? <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">Sale</div>}
                </div>
                <div className="font-bold text-[11px] mb-3 text-center text-slate-800 uppercase tracking-tight">{cat.label}</div>
                <div className="flex gap-1.5 w-full">
                  <button 
                    onClick={() => handleEditCategory(cat)} 
                    className="flex-1 bg-white text-slate-700 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      setConfirmDeleteId(cat.id);
                      setConfirmDeleteName(cat.label);
                      setConfirmDeleteType("category");
                      setIsConfirmOpen(true);
                    }} 
                    className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg text-[10px] font-bold border border-red-100 hover:bg-red-100 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}</div>
      </div>
    </>
  ) : adminTab === "whatsapp" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <Flame className="w-5 h-5" />
            
            <div>
              <h3 className="text-base font-black text-emerald-950">Pengaturan Halaman Sablon DTF</h3>
              <p className="text-[10px] text-slate-400 font-bold">Ubah gambar banner, judul identitas, dan deskripsi Sablon DTF Anda</p>
            </div>
          

          <form onSubmit={handleSaveDtfSettings} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Gambar Banner Sablon DTF <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <ImageUploadButton 
                  label="Upload Banner"
                  currentUrl={dtfBannerUrl}
                  onUploadSuccess={setDtfBannerUrl}
                />
                <button
                  type="button"
                  onClick={() => openMediaModal("dtf")}
                  className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>GALERI</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Video Banner Sablon DTF <span className="text-slate-400 font-semibold">(Opsional)</span>
                </label>
                {dtfVideoUrl && <VideoStatusBadge videoUrl={dtfVideoUrl} />}
              </div>
              <input type="text" value={dtfVideoUrl} onChange={(e) => setDtfVideoUrl(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg mb-2" placeholder="Masukkan URL video atau upload" />
              <div className="flex gap-2">
                <VideoUploadButton 
                  label="Upload Video"
                  currentUrl={dtfVideoUrl}
                  onUploadSuccess={setDtfVideoUrl}
                />
                <button
                  type="button"
                  onClick={() => openMediaModal("dtf-video")}
                  className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>GALERI</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-none mt-1">
                Jika diisi, video ini akan menggantikan gambar banner pada halaman Sablon DTF.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Gambar Base Mockup Kaos Custom <span className="text-slate-400 font-semibold">(Opsional)</span>
              </label>
              <div className="flex gap-2">
                <ImageUploadButton 
                  label="Upload Mockup"
                  currentUrl={dtfMockupUrl}
                  onUploadSuccess={setDtfMockupUrl}
                />
                <button
                  type="button"
                  onClick={() => openMediaModal("mockup")}
                  className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>GALERI</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-none mt-1">
                Gunakan mockup custom Anda sendiri (seperti kaos polo, hoodie, atau t-shirt custom). Kosongkan untuk menggunakan gambar kaos default dinamis dari produk.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Judul Identitas Sablon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dtfTitle}
                onChange={(e) => setDtfTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Sub-judul Identitas Sablon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dtfSubtitle}
                onChange={(e) => setDtfSubtitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Keterangan / Deskripsi Sablon <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={dtfDesc}
                onChange={(e) => setDtfDesc(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
              />
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Nomor WhatsApp Admin (Konsultasi Sablon) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Contoh: 6281219154973"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
              />
              <p className="text-[9px] text-slate-400 font-semibold leading-none mt-1">Gunakan format internasional tanpa tanda + atau spasi (Contoh: 6281219154973).</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                💵 Tambahan Biaya Ukuran Sablon (Surcharge)
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Logo Dada (10x10 cm) (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeLogo}
                    onChange={(e) => setSurchargeLogo(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Ukuran A5 (15x21 cm) (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeA5}
                    onChange={(e) => setSurchargeA5(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Ukuran A4 (21x30 cm) (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeA4}
                    onChange={(e) => setSurchargeA4(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Ukuran A3 (30x42 cm) (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeA3}
                    onChange={(e) => setSurchargeA3(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                👕 Tambahan Biaya Ukuran Kaos Jumbo
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Tambahan Ukuran XXL (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeXXL}
                    onChange={(e) => setSurchargeXXL(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    Tambahan Ukuran XXXL (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={surchargeXXXL}
                    onChange={(e) => setSurchargeXXXL(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              Simpan Perubahan Sablon DTF
            </button>
            <button
              type="button"
              onClick={handleResetDtfDefaults}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center uppercase tracking-widest mt-2 border border-slate-200"
            >
              Reset ke Pengaturan Default
            </button>
          </form>
      </div>
    </>
  ) : adminTab === "gallery" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
            <Image className="w-4 h-4 text-red-600" />
            <span>Galeri Desain Pelanggan</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {galleryDesigns.map((d: any, idx: number) => (
              <div key={d.id ? `admin-gallery-${d.id}` : `admin-gallery-${idx}`} className="relative group bg-white rounded-2xl border border-slate-150 p-2 shadow-sm">
                <div className="aspect-square rounded-xl overflow-hidden mb-2">
                  <img src={d.imageUrl} alt="Design" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mb-2 line-clamp-2">{d.note}</p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(d.id);
                    setConfirmDeleteName(d.note || "Gambar Galeri");
                    setConfirmDeleteType("gallery");
                    setIsConfirmOpen(true);
                  }}
                  className="w-full py-2 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            ))}</div>
      </div>
    </>
  ) : adminTab === "customer-uploads" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Penyimpanan Galeri Khusus Customer (Cloud)</span>
            </h3>
            <button
              onClick={fetchCustomerUploads}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          

          {loadingCustomerUploads ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
              <span>Memuat data galeri khusus dari Cloud...</span>
            </div>
          ) : customerUploads.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-150 rounded-2xl text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Belum ada file di penyimpanan galeri khusus customer.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {customerUploads.map((d: any, idx: number) => (
                <div key={d.id ? `admin-upload-${d.id}` : `admin-upload-${idx}`} className="relative group bg-white rounded-2xl border border-slate-150 p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <img src={d.imageUrl} alt="Customer Upload" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-slate-750 font-black truncate" title={d.fileName || "File Kustom"}>
                      {d.fileName || "File Tanpa Nama"}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold mb-3">
                      {d.uploadedAt ? (d.uploadedAt.toDate ? d.uploadedAt.toDate().toLocaleString("id-ID") : new Date(d.uploadedAt).toLocaleString("id-ID")) : "Kustom"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(d.id);
                      setConfirmDeleteName(d.fileName || "Gambar Kustom");
                      setConfirmDeleteType("customer-upload");
                      setIsConfirmOpen(true);
                    }}
                    className="w-full py-2 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Hapus Permanen
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  ) : adminTab === "settings" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-red-600" />
              <span>Pengaturan Logo & Branding Website</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Kelola logo gambar transparan, nama brand utama di header, slogan, dan sub-text website Anda.
            </p>
          

          <form onSubmit={handleSaveBranding} className="space-y-6 max-w-2xl">
            {/* Brand Name Text & Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Nama Brand Utama (Teks)
                </label>
                <input
                  type="text"
                  value={brandText}
                  onChange={(e) => setBrandText(e.target.value)}
                  placeholder="A-GIN"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Ditampilkan jika tidak menggunakan logo gambar, atau sebagai teks alt logo. Default: <strong>A-GIN</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Sub-Text / Highlight Text
                </label>
                <input
                  type="text"
                  value={brandHighlight}
                  onChange={(e) => setBrandHighlight(e.target.value)}
                  placeholder="FASHION"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Ditampilkan sebagai sub-text di bawah logo atau nama brand di footer. Default: <strong>FASHION</strong>.
                </p>
              </div>
            </div>

            {/* Slogan */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Slogan Brand
              </label>
              <input
                type="text"
                value={brandSlogan}
                onChange={(e) => setBrandSlogan(e.target.value)}
                placeholder="Exclusive Elegance"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Slogan yang mendeskripsikan brand Anda.
              </p>
            </div>

            {/* Alamat Kota Asal Toko & Pengiriman (Biteship) */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">📍 Alamat Kota Asal Toko (Asal Pengiriman)</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  Konfigurasikan lokasi asal pengiriman toko Anda. Jika <code>BITESHIP_API_KEY</code> aktif, sistem akan menghitung ongkos kirim asli dan melacak resi secara real-time berdasarkan Kode Pos Asal ini.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Pilih Kota Utama
                  </label>
                  <select
                    value={brandOriginCityId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setBrandOriginCityId(selId);
                      const topCities: Record<string, string> = {
                        "152": "Jakarta Barat",
                        "151": "Jakarta Pusat",
                        "153": "Jakarta Selatan",
                        "154": "Jakarta Timur",
                        "155": "Jakarta Utara",
                        "23": "Bandung",
                        "444": "Surabaya",
                        "455": "Tangerang",
                        "457": "Tangerang Selatan",
                        "55": "Bekasi",
                        "115": "Depok",
                        "74": "Bogor",
                        "399": "Semarang",
                        "501": "Yogyakarta",
                        "278": "Medan",
                        "327": "Palembang",
                        "254": "Makassar",
                        "114": "Denpasar"
                      };
                      if (topCities[selId]) {
                        setBrandOriginCityName(topCities[selId]);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
                  >
                    <option value="152">Jakarta Barat (ID: 152)</option>
                    <option value="151">Jakarta Pusat (ID: 151)</option>
                    <option value="153">Jakarta Selatan (ID: 153)</option>
                    <option value="154">Jakarta Timur (ID: 154)</option>
                    <option value="155">Jakarta Utara (ID: 155)</option>
                    <option value="23">Bandung (ID: 23)</option>
                    <option value="444">Surabaya (ID: 444)</option>
                    <option value="455">Tangerang (ID: 455)</option>
                    <option value="457">Tangerang Selatan (ID: 457)</option>
                    <option value="55">Bekasi (ID: 55)</option>
                    <option value="115">Depok (ID: 115)</option>
                    <option value="74">Bogor (ID: 74)</option>
                    <option value="399">Semarang (ID: 399)</option>
                    <option value="501">Yogyakarta (ID: 501)</option>
                    <option value="278">Medan (ID: 278)</option>
                    <option value="327">Palembang (ID: 327)</option>
                    <option value="254">Makassar (ID: 254)</option>
                    <option value="114">Denpasar (ID: 114)</option>
                    <option value="custom">-- Masukkan ID Kustom --</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama Kota (Simpan di Database)
                  </label>
                  <input
                    type="text"
                    value={brandOriginCityName}
                    onChange={(e) => setBrandOriginCityName(e.target.value)}
                    placeholder="Contoh: Jakarta Barat"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Kode Pos Asal (Biteship API) 📦
                  </label>
                  <input
                    type="text"
                    value={brandOriginPostalCode}
                    onChange={(e) => setBrandOriginPostalCode(e.target.value)}
                    placeholder="Contoh: 60181"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/80 text-[10px] text-emerald-800 font-medium leading-relaxed">
                💡 <strong>Konektivitas Biteship Aktif:</strong> Saat ini sistem dikonfigurasikan menggunakan <strong>Biteship API</strong> untuk perhitungan tarif pengiriman dan pelacakan resi secara real-time. Pastikan Kode Pos Asal diisi dengan benar agar pencarian rute kurir domestik akurat.
              </div>
            </div>

            {/* Logo Image URL & Upload */}
            <div className="space-y-4">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Logo Gambar Transparan (.PNG)
              </label>
              
              {/* Logo Preview */}
              {brandLogoUrl ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-3 relative max-w-sm">
                  <div className="h-20 flex items-center justify-center bg-transparent">
                    <img
                      src={brandLogoUrl}
                      alt="Current Logo Preview"
                      className="h-20 w-auto object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 px-2 py-1 rounded-md">
                      Logo Aktif (Latar Transparan)
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 break-all px-4">
                      {brandLogoUrl}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrandLogoUrl("")}
                    className="absolute top-2 right-2 p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center space-y-2 max-w-sm">
                  <Palette className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-500 font-bold">Belum Ada Logo Gambar</p>
                  <p className="text-[10px] text-slate-400 leading-normal px-4">
                    Website akan otomatis menampilkan nama brand berupa teks jika logo gambar dikosongkan.
                  </p>
                </div>
              )}

              {/* Advanced Transparency Tools */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">Asisten Pembuat Logo Transparan</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Otomatis menghapus latar belakang warna saat upload</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={removeLogoBg} 
                      onChange={(e) => setRemoveLogoBg(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-900"></div>
                  </label>
                </div>

                {removeLogoBg && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tipe Latar Belakang & Aksi Warna:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLogoBgType("white")}
                          className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            logoBgType === "white" 
                              ? "bg-emerald-950 border-emerald-950 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Hapus Latar Putih (Warna Asli)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoBgType("black")}
                          className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            logoBgType === "black" 
                              ? "bg-emerald-950 border-emerald-950 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Hapus Latar Hitam (Warna Asli)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoBgType("white_to_dark")}
                          className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            logoBgType === "white_to_dark" 
                              ? "bg-emerald-950 border-emerald-950 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Hapus Putih & Ubah Jadi Gelap
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoBgType("black_to_dark")}
                          className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            logoBgType === "black_to_dark" 
                              ? "bg-emerald-950 border-emerald-950 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Hapus Hitam & Ubah Jadi Gelap
                        </button>
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setLogoBgType("none")}
                          className={`w-full px-3 py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            logoBgType === "none" 
                              ? "bg-emerald-950 border-emerald-950 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Hapus Hitam & Putih Sekaligus (Hanya Tepian Ekstrim)
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                        {logoBgType === "white" && "Membuang latar belakang putih/terang dengan teknologi transisi transparan yang halus, mempertahankan warna asli logo Anda."}
                        {logoBgType === "black" && "Membuang latar belakang hitam/gelap dengan teknologi transisi transparan yang halus, mempertahankan warna asli logo Anda."}
                        {logoBgType === "white_to_dark" && "Membuang latar belakang putih, dan mengubah warna logo Anda menjadi abu-abu gelap (#1B1B1B) agar serasi dengan website."}
                        {logoBgType === "black_to_dark" && "Membuang latar belakang hitam, dan mengubah warna logo Anda menjadi abu-abu gelap (#1B1B1B) agar serasi dengan website."}
                        {logoBgType === "none" && "Membuang warna latar hitam ekstrim dan putih ekstrim sekaligus tanpa mengubah warna asli logo Anda."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="cropLogoBottom"
                        checked={cropLogoBottom}
                        onChange={(e) => setCropLogoBottom(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-900 focus:ring-emerald-900/20"
                      />
                      <label htmlFor="cropLogoBottom" className="text-[10px] font-extrabold text-slate-600 cursor-pointer select-none">
                        Potong 25% Bagian Bawah Gambar (Opsional)
                      </label>
                    </div>

                    {brandLogoUrl && (
                      <div className="pt-2.5 border-t border-slate-200/60">
                        <button
                          type="button"
                          disabled={isProcessingLogo}
                          onClick={handleProcessActiveLogo}
                          className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isProcessingLogo ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>MEMPROSES TRANSPARANSI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>HAPUS BACKGROUND LOGO AKTIF SEKARANG</span>
                            </>
                          )}
                        </button>
                        <p className="text-[8px] text-slate-400 font-medium mt-1.5 text-center">
                          Klik tombol di atas untuk langsung membuang latar warna logo di atas dan membuatnya transparan.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1.5">
                <ImageUploadButton
                  label="Upload Logo Baru (.PNG)"
                  currentUrl={brandLogoUrl}
                  onUploadSuccess={setBrandLogoUrl}
                  isLogo={true}
                  removeBg={removeLogoBg}
                  bgType={logoBgType}
                  cropBottom={cropLogoBottom}
                />
                <button
                  type="button"
                  onClick={() => openMediaModal("branding")}
                  className="px-4 py-2.5 bg-emerald-950 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  <span>PILIH DARI GALERI</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Gunakan asisten transparansi di atas jika logo Anda memiliki latar belakang hitam/putih yang ingin dibersihkan secara otomatis.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingBranding}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSavingBranding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>MENYIMPAN...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>SIMPAN PERUBAHAN LOGO</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <hr className="border-slate-100 my-8" />

          {/* Courier & Payment Logos Manager */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-800" />
                <span>📦 Kelola Logo Kurir & Metode Pembayaran</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                Ganti atau pasang logo gambar kustom untuk kurir pengiriman dan metode pembayaran di website Anda.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-8">
              {/* Payment Channels Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  💳 METODE PEMBAYARAN & VA (DOKU & MANUAL)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "QRIS", label: "QRIS" },
                    { key: "BCA", label: "BCA / VA BCA" },
                    { key: "MANDIRI", label: "MANDIRI / VA MANDIRI" },
                    { key: "BRI", label: "BRI / VA BRI" },
                    { key: "BNI", label: "BNI / VA BNI" },
                    { key: "DOKU", label: "DOKU CHECKOUT" }
                  ].map(({ key, label }) => {
                    const currentLogoUrl = customLogos[key];
                    return (
                      <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-700">{label}</span>
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">{key}</span>
                        </div>
                        
                        <div className="h-10 flex items-center justify-center bg-slate-50 rounded-lg p-2 border border-dashed border-slate-100 overflow-hidden">
                          {currentLogoUrl ? (
                            <img src={currentLogoUrl} alt={label} className="h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Logo Default</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <ImageUploadButton
                            label="Upload Logo"
                            currentUrl={currentLogoUrl || ""}
                            onUploadSuccess={(url) => {
                              const updated = { ...customLogos, [key]: url };
                              if (key === "BCA") updated["VA_BCA"] = url;
                              if (key === "MANDIRI") updated["VA_MANDIRI"] = url;
                              if (key === "BRI") updated["VA_BRI"] = url;
                              if (key === "BNI") updated["VA_BNI"] = url;
                              if (key === "DOKU") {
                                updated["DOKUCHECKOUT"] = url;
                                updated["DOKU_CHECKOUT"] = url;
                              }
                              setCustomLogos(updated);
                              handleSaveCustomLogos(updated);
                            }}
                          />
                          {currentLogoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...customLogos };
                                delete updated[key];
                                if (key === "BCA") delete updated["VA_BCA"];
                                if (key === "MANDIRI") delete updated["VA_MANDIRI"];
                                if (key === "BRI") delete updated["VA_BRI"];
                                if (key === "BNI") delete updated["VA_BNI"];
                                if (key === "DOKU") {
                                  delete updated["DOKUCHECKOUT"];
                                  delete updated["DOKU_CHECKOUT"];
                                }
                                setCustomLogos(updated);
                                handleSaveCustomLogos(updated);
                              }}
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  🚚 LAYANAN KURIR PENGIRIMAN (BITESHIP)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "JNE", label: "JNE Express" },
                    { key: "J&T", label: "J&T Express / Cargo" },
                    { key: "SICEPAT", label: "SiCepat Ekspres" },
                    { key: "GOJEK", label: "Gojek / GoSend" },
                    { key: "GRAB", label: "Grab / GrabExpress" },
                    { key: "POS", label: "Pos Indonesia" },
                    { key: "NINJA", label: "Ninja Xpress" },
                    { key: "TIKI", label: "TIKI" },
                    { key: "IDEXPRESS", label: "ID Express" },
                    { key: "LALAMOVE", label: "Lalamove" }
                  ].map(({ key, label }) => {
                    const currentLogoUrl = customLogos[key];
                    return (
                      <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-700">{label}</span>
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">{key}</span>
                        </div>
                        
                        <div className="h-10 flex items-center justify-center bg-slate-50 rounded-lg p-2 border border-dashed border-slate-100 overflow-hidden">
                          {currentLogoUrl ? (
                            <img src={currentLogoUrl} alt={label} className="h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Logo Default</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <ImageUploadButton
                            label="Upload Logo"
                            currentUrl={currentLogoUrl || ""}
                            onUploadSuccess={(url) => {
                              const updated = { ...customLogos, [key]: url };
                              if (key === "JNE") updated["JNEEXPRESS"] = url;
                              if (key === "J&T") {
                                updated["J&TEXPRESS"] = url;
                                updated["J&TCARGO"] = url;
                              }
                              if (key === "SICEPAT") updated["SICEPATEKSPRES"] = url;
                              if (key === "POS") updated["POSINDONESIA"] = url;
                              if (key === "NINJA") updated["NINJAXPRESS"] = url;
                              setCustomLogos(updated);
                              handleSaveCustomLogos(updated);
                            }}
                          />
                          {currentLogoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...customLogos };
                                delete updated[key];
                                if (key === "JNE") delete updated["JNEEXPRESS"];
                                if (key === "J&T") {
                                  delete updated["J&TEXPRESS"];
                                  delete updated["J&TCARGO"];
                                }
                                if (key === "SICEPAT") delete updated["SICEPATEKSPRES"];
                                if (key === "POS") delete updated["POSINDONESIA"];
                                if (key === "NINJA") delete updated["NINJAXPRESS"];
                                setCustomLogos(updated);
                                handleSaveCustomLogos(updated);
                              }}
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}</div></div></div></div>
      </div>
    </>
  ) : adminTab === "saved-designs" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Review Desain Kustom & Pesanan Sablon Customer</span>
            </h3>
            <button
              onClick={fetchSavedDesigns}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          

          {loadingSavedDesigns ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <span>Memuat data desain tersimpan...</span>
            </div>
          ) : savedDesigns.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-150 rounded-2xl text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Belum ada desain kustom baru yang disimpan untuk ditinjau.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDesigns.map((d: any, idx: number) => (
                <div key={d.id ? `admin-saved-${d.id}` : `admin-saved-${idx}`} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-white border border-slate-150 flex items-center justify-center relative group">
                      <img src={d.designImage} alt="Saved Design" className="w-full h-full object-contain" />
                      <a 
                        href={d.designImage} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Buka Tab Baru</span>
                      </a>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded">
                          {d.status || "Pending"}
                        </span>
                        <span className="text-[9px] text-slate-450 font-bold">
                          {new Date(d.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-800">{d.productName}</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-white border border-slate-150 rounded-lg p-2 font-semibold text-slate-600">
                        <div>Size: <strong className="text-slate-800">{d.selectedSize}</strong></div>
                        <div>Ukuran Cetak: <strong className="text-slate-800">{d.designSize?.toUpperCase() || "A4"}</strong></div>
                        <div>Sisi: <strong className="text-slate-800">{d.isBackView ? "Belakang" : "Depan"}</strong></div>
                        <div>ID: <strong className="text-slate-500 text-[8px] font-mono">{d.id}</strong></div>
                      </div>

                      {d.shippingData && (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 space-y-1 text-[10px] text-slate-700 font-medium">
                          <p className="font-bold text-emerald-950 border-b border-emerald-100/50 pb-1 uppercase tracking-wider text-[9px]">
                            Informasi Pengiriman / Kontak:
                          </p>
                          <p>Nama: <strong className="text-slate-900">{d.shippingData.name || "-"}</strong></p>
                          <p>Telp: <strong className="text-slate-900">{d.shippingData.phone || "-"}</strong></p>
                          <p>Alamat: <span className="text-slate-600">{d.shippingData.address || "-"}</span></p>
                          {d.shippingData.note && (
                            <p className="italic bg-white/60 p-1 rounded border border-slate-100 mt-1">
                              Note: "{d.shippingData.note}"
                            </p>
                          )}
                          
                          {d.shippingData.phone && (
                            <a
                              href={`https://wa.me/${d.shippingData.phone.replace(/^0/, "62").replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>Hubungi via WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSavedDesign(d.id)}
                    className="w-full py-2 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Log Desain</span>
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  ) : adminTab === "backup" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <FileJson className="w-8 h-8 text-blue-600" />
          
          <h3 className="text-xl font-black text-slate-800">Backup Database</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">Ekspor semua data produk dan pengaturan ke format JSON.</p>
          <button
            onClick={() => {
              const data = { products, categories, banners, smallBanners, infoBanners, videoBanners, exploreVideos };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `backup-agin-${new Date().toISOString()}.json`;
              a.click();
            }}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Download Backup JSON</span>
          </button>
      </div>
    </>
  ) : adminTab === "users" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Daftar Pengguna Terdaftar ({registeredUsers.length})</span>
            </h3>
            <button
              onClick={fetchRegisteredUsers}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3"
            >
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              <span>Refresh</span>
            </button>
          

          {usersLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-slate-400 font-semibold">Mengambil data pengguna...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {registeredUsers.map((u: any, idx: number) => (
                    <tr key={u.id ? `admin-user-${u.id}` : `admin-user-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                          u.isAdmin 
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {u.isAdmin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  ) : adminTab === "orders" ? (
    <>
      <div className="space-y-6 animate-fade-in">
        <AdminOrdersTab />
      </div>
    </>
  ) : null}

      <MediaGalleryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
      />

      {/* Centralized Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <motion.div 
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">
                  {confirmDeleteType === "all-products" ? "Hapus Semua Produk?" : "Hapus Item?"}
                </h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {confirmDeleteType === "all-products" ? (
                    <span>Apakah Anda yakin ingin menghapus <strong>semua produk</strong> dari database? Tindakan ini permanen dan tidak dapat dibatalkan.</span>
                  ) : (
                    <span>Apakah Anda yakin ingin menghapus <strong>{confirmDeleteName}</strong>? Tindakan ini permanen dan tidak dapat dibatalkan.</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setConfirmDeleteId(null);
                    setConfirmDeleteName("");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-200"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>MENGHAPUS...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>YA, HAPUS</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for managing marketing texts
function MarketingTextsManager({ 
  marketingTexts, 
  onSave, 
  onDelete 
}: { 
  marketingTexts: MarketingText[], 
  onSave: (data: Partial<MarketingText>) => void,
  onDelete: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState<'top' | 'middle' | 'bottom'>('top');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPosition("top");
    setIsActive(true);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (mt: MarketingText) => {
    setEditingId(mt.id);
    setTitle(mt.title);
    setContent(mt.content);
    setPosition(mt.position);
    setIsActive(mt.isActive);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingId || undefined,
      title,
      content,
      position,
      isActive
    });
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            TAMBAH PESAN BARU
          </button>
        )}
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {editingId ? "Edit Pesan Marketing" : "Tambah Pesan Marketing Baru"}
            </h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul / Headline</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: FLASH SALE"
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Posisi Tampilan</label>
              <select 
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="top">Running Text (Atas)</option>
                <option value="middle">Floating Card (Tengah)</option>
                <option value="bottom">Banner Footer (Bawah)</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Isi Pesan / Konten</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan detail promo atau pesan di sini..."
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all h-24"
                required
              />
            </div>
            <div className="flex items-center gap-3 pl-1">
              <input 
                type="checkbox" 
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is-active" className="text-xs font-bold text-slate-600 cursor-pointer">Aktifkan Pesan Ini</label>
            </div>
            <div className="md:col-span-2 pt-2">
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                {editingId ? "PERBARUI PESAN" : "SIMPAN PESAN"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketingTexts.map((mt) => (
          <motion.div 
            layout
            key={mt.id}
            className={`bg-white rounded-3xl border ${mt.isActive ? 'border-emerald-100 shadow-emerald-50/50' : 'border-slate-100 opacity-60'} p-5 shadow-xl space-y-4 relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                mt.position === 'top' ? 'bg-blue-100 text-blue-600' :
                mt.position === 'middle' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {mt.position === 'top' ? 'Running Text' : mt.position === 'middle' ? 'Floating' : 'Footer'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(mt)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(mt.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{mt.title}</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-3">{mt.content}</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
              <div className={`w-2 h-2 rounded-full ${mt.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase">{mt.isActive ? 'AKTIF' : 'NON-AKTIF'}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
