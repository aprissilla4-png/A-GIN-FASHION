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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Banner } from "../types";
import ImageUploadButton from "./ImageUploadButton";
import VideoUploadButton from "./VideoUploadButton";
import MediaGalleryModal from "./MediaGalleryModal";

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (productData: Partial<Product>) => Promise<boolean>;
  onUpdateProduct: (productId: string, productData: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onDeleteAllProducts?: () => Promise<boolean>;
  onReloadProducts: () => void;
  onReloadSettings?: () => void;
}

export default function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteAllProducts,
  onReloadProducts,
  onReloadSettings
}: AdminPanelProps) {
  // Navigation tabs inside Admin Panel
  const [adminTab, setAdminTab] = useState<"products" | "banners" | "small-banners" | "categories" | "videos" | "dtf" | "users">("products");

  // Custom configuration states
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"product" | "banner" | "dtf" | "category" | "additional" | "small-banner">("product");

  const openMediaModal = (target: "product" | "banner" | "dtf" | "category" | "additional" | "small-banner") => {
    setMediaTarget(target);
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === "product") {
      setImage(url);
    } else if (mediaTarget === "banner") {
      setBImage(url);
    } else if (mediaTarget === "dtf") {
      setDtfBannerUrl(url);
    } else if (mediaTarget === "category") {
      setCatImage(url);
    } else if (mediaTarget === "additional") {
      handleAddGalleryImage(url);
    } else if (mediaTarget === "small-banner") {
      setSbImage(url);
    }
  };

  // Small Banner State
  const [smallBanners, setSmallBanners] = useState<any[]>([]);
  const [smallBannersLoading, setSmallBannersLoading] = useState(false);
  const [sbImage, setSbImage] = useState("");
  const [sbTitle, setSbTitle] = useState("");
  const [sbSubtitle, setSbSubtitle] = useState("");

  const [dtfBannerUrl, setDtfBannerUrl] = useState("");
  const [dtfTitle, setDtfTitle] = useState("");
  const [dtfSubtitle, setDtfSubtitle] = useState("");
  const [dtfDesc, setDtfDesc] = useState("");
  const [bulkJson, setBulkJson] = useState("");

  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDesc, setMediaDesc] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [lookbookVideos, setLookbookVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [catLabel, setCatLabel] = useState("");
  const [catImage, setCatImage] = useState("");

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

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

  // Inventory products grouped by 6
  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const productChunks = chunkArray(products, 6);

  // Banner List State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  // Banner Form State
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editBannerId, setEditBannerId] = useState<string | null>(null);

  // Banner Form Fields
  const [bImage, setBImage] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bBadge, setBBadge] = useState("");
  const [bBgColor, setBBgColor] = useState("from-emerald-950/85 to-red-950/40");

  // Notification Feedbacks
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchBanners();
    if (onReloadSettings) onReloadSettings();
  }, []);

  useEffect(() => {
    if (adminTab === "dtf") {
      fetchDtfSettings();
    } else if (adminTab === "videos") {
      fetchLookbookVideos();
    } else if (adminTab === "categories") {
      fetchCategories();
    } else if (adminTab === "users") {
      fetchRegisteredUsers();
    } else if (adminTab === "small-banners") {
      fetchSmallBanners();
    }
  }, [adminTab]);

  const fetchLookbookVideos = async () => {
    setVideosLoading(true);
    try {
      const res = await fetch("/api/media?type=video");
      if (res.ok) {
        setLookbookVideos(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchDtfSettings = async () => {
    try {
      const res = await fetch("/api/settings/dtf");
      if (res.ok) {
        const data = await res.json();
        setDtfBannerUrl(data.bannerImage || "");
        setDtfTitle(data.identityTitle || "");
        setDtfSubtitle(data.identitySubtitle || "");
        setDtfDesc(data.description || "");
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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: catLabel, image: catImage })
      });
      if (res.ok) {
        setCatLabel("");
        setCatImage("");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
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

  const handleSmallBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbImage) {
      alert("Gambar wajib diupload/diisi!");
      return;
    }
    try {
      const res = await fetch("/api/small-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: sbImage,
          title: sbTitle || "MADE TO MOVE",
          subtitle: sbSubtitle
        })
      });
      if (res.ok) {
        setMsg({ text: "Foto banner berhasil diposting!", type: "success" });
        setSbImage("");
        setSbTitle("");
        setSbSubtitle("");
        fetchSmallBanners();
        if (onReloadSettings) onReloadSettings();
      } else {
        const errData = await res.json();
        alert("Gagal memuat: " + (errData.error || "unknown error"));
      }
    } catch (err) {
      console.error("Error posting small banner:", err);
    }
  };

  const handleDeleteSmallBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/small-banners/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMsg({ text: "Foto banner berhasil dihapus!", type: "success" });
        fetchSmallBanners();
        if (onReloadSettings) onReloadSettings();
      }
    } catch (err) {
      console.error("Error deleting small banner:", err);
    }
  };

  const handleSaveDtfSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/dtf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerImage: dtfBannerUrl,
          identityTitle: dtfTitle,
          identitySubtitle: dtfSubtitle,
          description: dtfDesc
        })
      });
      if (res.ok) {
        setMsg({ text: "Branding Sablon DTF berhasil diperbarui!", type: "success" });
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal memperbarui branding DTF.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Koneksi ke backend gagal.", type: "error" });
    }
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
  };

  const clearBannerForm = () => {
    setIsEditingBanner(false);
    setEditBannerId(null);
    setBImage("");
    setBTitle("");
    setBSubtitle("");
    setBBadge("");
    setBBgColor("from-emerald-950/85 to-red-950/40");
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
        headers: { "Content-Type": "application/json" },
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
    setBBadge(b.badge);
    setBBgColor(b.bgColor || "from-emerald-950/85 to-red-950/40");

    const formElement = document.getElementById("admin-banner-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category || !stock || !description || !image) {
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
      isPromo
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

    const payload = {
      image: bImage,
      title: bTitle,
      subtitle: bSubtitle,
      badge: bBadge,
      bgColor: bBgColor
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
    }
  };

  const handleDeleteClick = async (productId: string, productName: string) => {
    const success = await onDeleteProduct(productId);
    if (success) {
      setMsg({ text: `Produk "${productName}" berhasil dihapus.`, type: "success" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } else {
      setMsg({ text: "Gagal menghapus produk.", type: "error" });
    }
  };

  const handleDeleteAllClick = async () => {
    if (!onDeleteAllProducts) return;

    const success = await onDeleteAllProducts();
    if (success) {
      setMsg({ text: "Semua produk berhasil dihapus.", type: "success" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } else {
      setMsg({ text: "Gagal menghapus semua produk.", type: "error" });
    }
  };

  const handleDeleteBannerClick = async (bannerId: string, bannerTitle: string) => {
    try {
      const res = await fetch(`/api/banners/${bannerId}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ text: `Banner "${bannerTitle}" berhasil dihapus.`, type: "success" });
        fetchBanners();
        if (onReloadSettings) onReloadSettings();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      } else {
        setMsg({ text: "Gagal menghapus banner.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Gagal menghapus banner.", type: "error" });
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
            Dashboard kelola (CRUD) katalog busana fashion Tokopedia Fashion & banner promo dinamis
          </p>
        </div>

        {/* Tab Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setAdminTab("products")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "products"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Katalog Produk</span>
          </button>
          <button
            onClick={() => setAdminTab("banners")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "banners"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Banner Promo ({banners.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("small-banners")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "small-banners"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Banner Slogan ({smallBanners.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("dtf")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "dtf"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Sablon DTF</span>
          </button>
          <button
            onClick={() => setAdminTab("categories")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "categories"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Kategori</span>
          </button>
          <button
            onClick={() => setAdminTab("videos")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "videos"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Koleksi Lookbook</span>
          </button>
          <button
            onClick={() => setAdminTab("users")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              adminTab === "users"
                ? "bg-emerald-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Log Pengguna</span>
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
      {adminTab === "products" ? (
        // PRODUCT CRUD GRID
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Create/Edit - Left side */}
          <div className="lg:col-span-1 space-y-6">
            <div
              id="admin-product-form"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-5 sticky top-20"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>{isEditing ? "Edit Produk Fashion" : "Upload Produk Baru"}</span>
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
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Kemeja Batik Modern Slim Fit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

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
                      <option value="Kaos">Kaos</option>
                      <option value="Kemeja">Kemeja</option>
                      <option value="Sepatu">Sepatu</option>
                      <option value="Sendal">Sendal</option>
                      <option value="Celana">Celana</option>
                      <option value="Baju Wanita">Baju Wanita</option>
                      <option value="Sablon">Sablon</option>
                      <option value="Promo">Promo Spesial</option>
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
                              className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
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

            {/* Bulk Upload Section */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="font-extrabold text-emerald-950 text-sm">Upload Massal (JSON)</h3>
              </div>
              <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                Unggah banyak produk sekaligus dengan format array JSON. 
                Sangat efisien untuk pengisian data besar.
              </p>
              <textarea
                rows={5}
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"name": "Produk A", "price": 100000, "category": "Batik", "stock": 10, "description": "..."}]'
                className="w-full text-[10px] font-mono p-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
              />
              <button
                onClick={handleBulkUpload}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Upload Massal Sekarang
              </button>
            </div>
          </div>

          {/* Inventory Database Table - Right side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>Gudang Produk ({products.length} Data)</span>
                </h3>
                <div className="flex items-center gap-2">
                  {products.length > 0 && onDeleteAllProducts && (
                    <button
                      type="button"
                      onClick={handleDeleteAllClick}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 border border-red-200 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
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
                {productChunks.map((chunk, chunkIdx) => (
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
                          <div key={p.id} className="relative group bg-white rounded-2xl border border-slate-150 p-2.5 transition-all hover:shadow-md hover:border-red-200">
                            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2.5 border border-slate-100 bg-slate-50">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-extrabold text-slate-800 truncate leading-tight" title={p.name}>{p.name}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] text-red-600 font-black">Rp {p.price.toLocaleString("id-ID")}</p>
                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">STOK: {p.stock}</span>
                              </div>
                            </div>

                            {/* Action Overlay for Hover */}
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2 rounded-2xl p-3">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pilihan Produk</p>
                              <button
                                onClick={() => handleEditClick(p)}
                                className="w-full py-2 bg-emerald-600 text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                EDIT
                              </button>
                              <button
                                onClick={() => handleDeleteClick(p.id, p.name)}
                                className="w-full py-2 bg-red-600 text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
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
                )}
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === "banners" ? (
        // DYNAMIC HERO BANNER SLIDER CRUD
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Banner Edit/Create - Left side */}
          <div className="lg:col-span-1 space-y-6">
            <div
              id="admin-banner-form"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-5 sticky top-20"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Image className="w-4 h-4 text-red-600" />
                  <span>{isEditingBanner ? "Edit Banner Slider" : "Upload Banner Baru"}</span>
                </h3>
                {isEditingBanner && (
                  <button
                    onClick={clearBannerForm}
                    className="text-xs text-red-600 hover:underline font-bold"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleBannerSubmit} className="space-y-4">
                {/* Banner Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Judul Banner <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Diskon Koleksi Ramadhan"
                    required
                    value={bTitle}
                    onChange={(e) => setBTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Sub-judul / Keterangan Singkat
                  </label>
                  <input
                    type="text"
                    placeholder="Sentuhan Tradisional, Siluet Kontemporer"
                    value={bSubtitle}
                    onChange={(e) => setBSubtitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Badge text */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Teks Badge Promosi (Merah Kecil)
                  </label>
                  <input
                    type="text"
                    placeholder="Diskon Hingga 40%"
                    value={bBadge}
                    onChange={(e) => setBBadge(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>

                {/* Banner Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Gambar Banner <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <ImageUploadButton 
                      label="Upload Banner"
                      currentUrl={bImage}
                      onUploadSuccess={setBImage}
                    />
                    <button
                      type="button"
                      onClick={() => openMediaModal("banner")}
                      className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>GALERI</span>
                    </button>
                  </div>
                </div>

                {/* Gradient Background Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" />
                    <span>Gradasi Latar Belakang Gelap</span>
                  </label>
                  <select
                    value={bBgColor}
                    onChange={(e) => setBBgColor(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-semibold"
                  >
                    <option value="from-emerald-950/85 to-red-950/40">Hijau Tua & Merah Mewah (Default)</option>
                    <option value="from-emerald-950/70 to-emerald-950/30">Hijau Tua Pekat</option>
                    <option value="from-slate-900/80 to-slate-900/30">Abu-abu Premium</option>
                    <option value="from-red-950/80 to-slate-950/20">Merah Marun & Gelap</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer bg-red-600 hover:bg-red-700 shadow-red-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditingBanner ? "Perbarui Banner Slider" : "Tambahkan Banner"}</span>
                </button>
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
      
      ) : adminTab === "small-banners" ? (
        // DYNAMIC SMALL BANNER CRUD
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Small Banner Edit/Create - Left side */}
          <div className="lg:col-span-1 space-y-6">
            <div
              id="admin-small-banner-form"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-5 "
            >
              <div>
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-600" />
                  <span>Posting Foto Slogan Baru</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Foto-foto ini akan diputar bergantian pada Banner Kecil di sebelah teks display **MADE TO MOVE**.
                </p>
              </div>

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
                  <Plus className="w-4 h-4" />
                  <span>Post Foto Slogan</span>
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
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleDeleteSmallBanner(b.id)}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer inline-flex items-center"
                                title="Hapus Banner Slogan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                            onClick={() => handleDeleteSmallBanner(b.id)}
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

      ) : adminTab === "categories" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-serif text-2xl text-[#111111] mb-6">Kelola Kategori & Ikon</h2>
          <form onSubmit={handleAddCategory} className="space-y-4 max-w-xl mb-8">
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

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer">Simpan Kategori Baru</button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((cat: any) => (
              <div key={cat.id} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden mb-3 border">
                  {cat.image ? <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">Sale</div>}
                </div>
                <div className="font-bold text-xs mb-3 text-center">{cat.label}</div>
                <button onClick={() => handleDeleteCategory(cat.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold w-full hover:bg-red-100 cursor-pointer">Hapus</button>
              </div>
            ))}
          </div>
        </div>

      ) : adminTab === "videos" ? (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-100/50 space-y-6">
            <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <Play className="w-4 h-4 text-red-600" />
              <span>Upload Video Lookbook</span>
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!mediaTitle || !mediaUrl) {
                setMsg({ text: "Judul dan Video wajib diisi!", type: "error" });
                return;
              }
              try {
                const res = await fetch("/api/media", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: mediaTitle, url: mediaUrl, type: "video" })
                });
                if (res.ok) {
                  setMsg({ text: "Video berhasil ditambahkan ke Lookbook!", type: "success" });
                  setMediaTitle("");
                  setMediaUrl("");
                  fetchLookbookVideos();
                  setTimeout(() => setMsg({ text: "", type: "" }), 3000);
                }
              } catch (err) {
                setMsg({ text: "Gagal mengunggah video.", type: "error" });
              }
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Judul Video <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Koleksi Ramadhan 2026"
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Pilih Video dari Galeri <span className="text-red-500">*</span>
                  </label>
                  <VideoUploadButton 
                    label="Pilih Video"
                    currentUrl={mediaUrl}
                    onUploadSuccess={setMediaUrl}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Video</span>
                </button>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center border border-dashed border-slate-200">
                {mediaUrl ? (
                  <video src={mediaUrl} controls className="max-h-48 rounded-lg shadow-sm" />
                ) : (
                  <div className="text-center space-y-2">
                    <Play className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-[10px] text-slate-400 font-medium italic">Preview video akan muncul di sini</p>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>Koleksi Video ({lookbookVideos.length} Video)</span>
                </div>
                {lookbookVideos.length > 0 && (
                  <button
                    disabled={videosLoading}
                    onClick={async () => {
                      if (confirm("Hapus SEMUA video koleksi lookbook?")) {
                        setVideosLoading(true);
                        try {
                          const res = await fetch("/api/media/all/bulk?type=video", { method: "DELETE" });
                          if (res.ok) {
                            setMsg({ text: "Semua video berhasil dihapus.", type: "success" });
                            setLookbookVideos([]); // Optimistic update
                            fetchLookbookVideos();
                          } else {
                            throw new Error("Gagal menghapus");
                          }
                        } catch (error) {
                          console.error("Delete all failed:", error);
                          setMsg({ text: "Gagal menghapus semua video.", type: "error" });
                        } finally {
                          setVideosLoading(false);
                          setTimeout(() => setMsg({ text: "", type: "" }), 3000);
                        }
                      }
                    }}
                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${videosLoading ? 'text-slate-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                  >
                    {videosLoading ? 'Menghapus...' : 'Hapus Semua'}
                  </button>
                )}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {lookbookVideos.map((v) => (
                  <motion.div 
                    key={v.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="group relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all border-emerald-950/5"
                  >
                  <div className="aspect-video bg-black relative">
                    <video src={v.url} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{v.title}</p>
                      <p className="text-[9px] text-slate-400 font-medium">Video MP4</p>
                    </div>
                    <button
                      disabled={deletingIds.includes(v.id)}
                      onClick={async () => {
                        console.log("Delete button clicked for video ID:", v.id);
                        if (confirm("Hapus video ini?")) {
                          setDeletingIds(prev => [...prev, v.id]);
                          try {
                            const res = await fetch(`/api/media/${v.id}`, { method: "DELETE" });
                            console.log("Delete response status:", res.status);
                            if (res.ok) {
                              setMsg({ text: "Video berhasil dihapus.", type: "success" });
                              setLookbookVideos(prev => prev.filter(item => item.id !== v.id)); // Optimistic UI
                              fetchLookbookVideos();
                              setTimeout(() => setMsg({ text: "", type: "" }), 3000);
                            } else {
                                const errData = await res.json();
                                console.error("Delete failed:", errData);
                                setMsg({ text: "Gagal menghapus video: " + (errData.error || "Unknown error"), type: "error" });
                            }
                          } catch (err) {
                            console.error("Delete error:", err);
                            setMsg({ text: "Gagal menghapus video.", type: "error" });
                          } finally {
                            setDeletingIds(prev => prev.filter(id => id !== v.id));
                          }
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${deletingIds.includes(v.id) ? 'bg-slate-100 text-slate-400' : 'hover:bg-red-50 text-red-500'}`}
                    >
                      {deletingIds.includes(v.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {lookbookVideos.length === 0 && !videosLoading && (
              <div className="col-span-full py-12 text-center space-y-2">
                <Play className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Belum ada koleksi video.</p>
              </div>
            )}
          </div>
          </div>
        </div>

      ) : adminTab === "dtf" ? (
        // SABLON DTF CONFIGURATION FORM
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-2xl">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950">Pengaturan Halaman Sablon DTF</h3>
              <p className="text-[10px] text-slate-400 font-bold">Ubah gambar banner, judul identitas, dan deskripsi Sablon DTF Anda</p>
            </div>
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

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              Simpan Perubahan Sablon DTF
            </button>
          </form>
        </div>
      ) : adminTab === "users" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
          </div>

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
                  {registeredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
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
      ) : null}

      <MediaGalleryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
