import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  Clipboard, 
  ClipboardCheck, 
  Loader2, 
  RefreshCw, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  Code,
  Check,
  X,
  History,
  Copy,
  Info,
  Trash2,
  Lock,
  Globe,
  Wifi,
  WifiOff,
  CornerDownRight,
  User,
  MapPin,
  FileJson,
  Eye,
  CheckSquare,
  XSquare
} from "lucide-react";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// Define TypeScript interfaces for better type-safety and developer guidance
interface TestOrder {
  id: string; // Document Firestore ID / Biteship Order ID
  orderId: string; // Biteship Order ID
  orderNumber: string;
  date: string;
  courier: string;
  status: string;
  trackingId: string;
  rawResponse?: string;
  shipper?: {
    name: string;
    phone: string;
    address: string;
    postalCode: string;
  };
  destination?: {
    name: string;
    phone: string;
    address: string;
    postalCode: string;
  };
  item?: {
    name: string;
    weight: string;
    value: string;
  };
}

export default function BiteshipTestingView() {
  // Local states
  const [apiKey, setApiKey] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingTestConn, setLoadingTestConn] = useState(false);
  const [simulatingRowId, setSimulatingRowId] = useState<string | null>(null);
  const [cancellingRowId, setCancellingRowId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Accordion parameters
  const [showConfig, setShowConfig] = useState(false);
  
  // Custom states for Shipping Details (pre-filled with valid standard default values)
  const [shipperName, setShipperName] = useState("A-GIN FASHION STORE");
  const [shipperPhone, setShipperPhone] = useState("081219154973");
  const [shipperPostal, setShipperPostal] = useState("60181");
  const [shipperAddress, setShipperAddress] = useState("Jl. Simo Tambaan Sekolahan Gg. III No. 15, Sukomanunggal, Surabaya");

  const [destName, setDestName] = useState("Pelanggan Penerima Test");
  const [destPhone, setDestPhone] = useState("081234567890");
  const [destPostal, setDestPostal] = useState("60181");
  const [destAddress, setDestAddress] = useState("Jl. Simo Tambaan Sekolahan Gg. III No. 15, Sukomanunggal, Surabaya");

  const [itemName, setItemName] = useState("Kaos Premium Sablon DTF - A-GIN");
  const [itemWeight, setItemWeight] = useState("500");
  const [itemValue, setItemValue] = useState("150000");

  const [courierCompany, setCourierCompany] = useState("jne");
  const [courierType, setCourierType] = useState("reg");

  // Dynamically determine available service types based on selected courier to meet Biteship regulations
  const getAvailableServices = () => {
    if (["gojek", "grab", "lalamove"].includes(courierCompany)) {
      return [
        { value: "instant", label: "Instant (Gojek/Grab/Lalamove Instant)" },
        { value: "same_day", label: "Same Day (Gojek/Grab Same Day)" }
      ];
    }
    if (courierCompany === "jnt_cargo") {
      return [
        { value: "cargo", label: "Cargo (J&T Cargo Standard)" }
      ];
    }
    return [
      { value: "reg", label: "Regular (REG / Standard)" },
      { value: "oke", label: "Economical (ECO / OKE)" },
      { value: "yes", label: "Express Next-Day (YES / Fast)" }
    ];
  };

  useEffect(() => {
    const services = getAvailableServices();
    if (!services.some(s => s.value === courierType)) {
      setCourierType(services[0].value);
    }
  }, [courierCompany]);

  // Rates inquiry inputs
  const [ratesOriginPostal, setRatesOriginPostal] = useState("60181");
  const [ratesDestPostal, setRatesDestPostal] = useState("60181");
  const [ratesWeight, setRatesWeight] = useState("1000");
  const [ratesCouriers, setRatesCouriers] = useState("gojek,grab,lalamove,jne,jnt,sicepat,idexpress,ninja,pos,anteraja,tiki,jnt_cargo");

  // Connection checking states
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "loading" | "success" | "failed">("untested");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [connectionErrorRaw, setConnectionErrorRaw] = useState<any>(null);

  // API Results
  const [orderResult, setOrderResult] = useState<any>(null);
  const [ratesResult, setRatesResult] = useState<any>(null);
  
  // Notification states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail Modal popup state
  const [activeDetailOrder, setActiveDetailOrder] = useState<TestOrder | null>(null);

  // Firestore History state
  const [orderHistory, setOrderHistory] = useState<TestOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Load API Key from LocalStorage & Setup realtime listener on load
  useEffect(() => {
    const savedKey = localStorage.getItem("biteship_sandbox_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    // Setup real-time listener
    const q = query(collection(db, "biteship_test_orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const historyList: TestOrder[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        historyList.push({
          id: docSnap.id,
          orderId: data.orderId || data.id,
          orderNumber: data.orderNumber || "TEST-ORD-" + (data.orderId || data.id || "").substring(0, 6).toUpperCase(),
          date: data.date,
          courier: data.courier,
          status: data.status,
          trackingId: data.trackingId,
          rawResponse: data.rawResponse,
          shipper: data.shipper,
          destination: data.destination,
          item: data.item
        });
      });
      setOrderHistory(historyList);
      setLoadingHistory(false);
    }, (err) => {
      console.error("Gagal memuat riwayat order dari Firestore:", err);
      setLoadingHistory(false);
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  // 2. Save API Key helper
  const handleSaveApiKey = () => {
    const trimmedKey = apiKey.trim();
    localStorage.setItem("biteship_sandbox_api_key", trimmedKey);
    showNotification("API Key disimpan ke local storage!");
    setConnectionStatus("untested");
    setConnectionMsg("");
    setConnectionErrorRaw(null);
  };

  // Helper to trigger temporary notification banner
  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 4. Delete record from history (triggers confirmation modal)
  const handleDeleteHistory = (docId: string) => {
    setDeleteConfirmId(docId);
  };

  // Actual execution of deletion
  const executeDeleteHistory = async () => {
    if (!deleteConfirmId) return;
    const docId = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteDoc(doc(db, "biteship_test_orders", docId));
      setOrderHistory((prev) => prev.filter((item) => item.id !== docId));
      showNotification("Data riwayat berhasil dihapus!");
    } catch (err: any) {
      console.error("Gagal menghapus dokumen:", err);
      alert("Gagal menghapus data: " + (err.message || err));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 5. Check API Connection
  const handleTestConnection = async () => {
    setLoadingTestConn(true);
    setConnectionStatus("loading");
    setConnectionErrorRaw(null);
    setConnectionMsg("");

    try {
      const response = await fetch("/api/biteship/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus("success");
        setConnectionMsg(data.message || "Terhubung ke Biteship Sandbox.");
      } else {
        setConnectionStatus("failed");
        setConnectionMsg(data.message || `Error ${response.status}: Koneksi Gagal.`);
        setConnectionErrorRaw(data);
      }
    } catch (err: any) {
      console.error("Connection test failed:", err);
      setConnectionStatus("failed");
      setConnectionMsg(err.message || "Gagal menghubungi server backend.");
      setConnectionErrorRaw({ error: err.message || err });
    } finally {
      setLoadingTestConn(false);
    }
  };

  // 6. Cek Ongkir (Rates Inquiry)
  const handleCheckRates = async () => {
    setLoadingRates(true);
    setErrorMsg(null);
    setRatesResult(null);

    try {
      const response = await fetch("/api/biteship/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          originPostalCode: ratesOriginPostal,
          destinationPostalCode: ratesDestPostal,
          weight: ratesWeight,
          couriers: ratesCouriers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || "Gagal menghitung ongkos kirim.",
          rawResponse: data,
          httpStatus: response.status
        };
      }

      setRatesResult(data.results || []);
      showNotification("Berhasil memuat harga ongkir!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menghubungi API cek ongkir.");
      if (err.rawResponse) {
        setRatesResult({ errorState: true, ...err });
      }
    } finally {
      setLoadingRates(false);
    }
  };

  // 7. Create Test Order
  const handleCreateTestOrder = async () => {
    setLoadingOrder(true);
    setErrorMsg(null);
    setOrderResult(null);

    try {
      const response = await fetch("/api/biteship/test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          shipper: {
            name: shipperName,
            phone: shipperPhone,
            postalCode: shipperPostal,
            address: shipperAddress
          },
          destination: {
            name: destName,
            phone: destPhone,
            postalCode: destPostal,
            address: destAddress
          },
          courier: {
            company: courierCompany,
            type: courierType
          },
          item: {
            name: itemName,
            weight: itemWeight,
            value: itemValue
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || "Gagal membuat test order ke Biteship Sandbox.",
          rawResponse: data,
          httpStatus: response.status
        };
      }

      setOrderResult(data);
      showNotification("Sukses! Test Order berhasil dibuat.");

      // Store in Firestore Database for persistence
      try {
        await addDoc(collection(db, "biteship_test_orders"), {
          id: data.id || data.orderId,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          date: new Date().toISOString(),
          courier: `${data.courier} - ${data.service}`,
          status: data.status || "allocated",
          trackingId: data.trackingId || "Belum Tersedia",
          rawResponse: JSON.stringify(data.rawResponse),
          shipper: {
            name: shipperName,
            phone: shipperPhone,
            address: shipperAddress,
            postalCode: shipperPostal
          },
          destination: {
            name: destName,
            phone: destPhone,
            address: destAddress,
            postalCode: destPostal
          },
          item: {
            name: itemName,
            weight: itemWeight,
            value: itemValue
          }
        });
        
        // Refresh local history grid
        // fetchOrderHistory(); // Removed as onSnapshot handles updates
      } catch (firestoreErr) {
        console.error("Gagal menyimpan test order ke Firestore:", firestoreErr);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal membuat test order ke Biteship Sandbox.");
      if (err.rawResponse) {
        setOrderResult({ errorState: true, ...err });
      }
    } finally {
      setLoadingOrder(false);
    }
  };

  // 8. Simulate Status Transition (Delivered or Cancelled)
  const handleSimulateStatus = async (orderId: string, docId: string, targetStatus: string) => {
    setSimulatingRowId(docId);
    try {
      const response = await fetch("/api/biteship/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          status: targetStatus,
          apiKey: apiKey.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Gagal mensimulasikan status ${targetStatus}.`);
      }

      // Update in Firestore
      const orderRef = doc(db, "biteship_test_orders", docId);
      await updateDoc(orderRef, {
        status: targetStatus,
        // Also update trackingId if simulation returned a new one or keep existing
        trackingId: data.rawResponse?.courier?.waybill_id || "TEST-WAYBILL-SIMULATION"
      });

      // Update local history array
      setOrderHistory((prev) =>
        prev.map((item) =>
          item.id === docId 
            ? { ...item, status: targetStatus, trackingId: data.rawResponse?.courier?.waybill_id || "TEST-WAYBILL-SIMULATION" } 
            : item
        )
      );

      showNotification(`Status order berhasil diubah menjadi '${targetStatus}'!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat menghubungi API simulasi.");
    } finally {
      setSimulatingRowId(null);
    }
  };

  // 9. Cancel Order via Official Biteship API
  const handleCancelOrder = async (orderId: string, docId: string) => {
    setCancellingRowId(docId);
    try {
      console.log(`Membatalkan order ${orderId} (doc: ${docId})...`);
      const response = await fetch("/api/biteship/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          apiKey: apiKey.trim() || undefined,
          reason: "Salah alamat pengiriman atau salah memasukkan rincian pesanan."
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal membatalkan order di Biteship Sandbox.");
      }

      // Update in Firestore with cancellation details as requested by user
      const orderRef = doc(db, "biteship_test_orders", docId);
      await updateDoc(orderRef, {
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: "Salah alamat pengiriman atau salah memasukkan rincian pesanan.",
        response_cancel: JSON.stringify(data.rawResponse || data)
      });

      // Update local history array
      setOrderHistory((prev) =>
        prev.map((item) =>
          item.id === docId 
            ? { 
                ...item, 
                status: "cancelled"
              } 
            : item
        )
      );

      showNotification("Sukses! Order berhasil dibatalkan.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat membatalkan order.");
    } finally {
      setCancellingRowId(null);
    }
  };

  // Helper values for courier list
  const couriersList = [
    { code: "gojek", name: "Gojek", category: "Instant / Same Day" },
    { code: "grab", name: "Grab", category: "Instant / Same Day" },
    { code: "lalamove", name: "Lalamove", category: "Instant / Same Day" },
    { code: "jne", name: "JNE Express", category: "Reguler / Next Day" },
    { code: "jnt", name: "J&T Express", category: "Reguler" },
    { code: "sicepat", name: "SiCepat", category: "Reguler" },
    { code: "idexpress", name: "IDExpress", category: "Reguler" },
    { code: "ninja", name: "Ninja Xpress", category: "Reguler" },
    { code: "pos", name: "Pos Indonesia", category: "Reguler" },
    { code: "anteraja", name: "Anteraja", category: "Reguler" },
    { code: "tiki", name: "TIKI", category: "Reguler" },
    { code: "jnt_cargo", name: "J&T Cargo", category: "Cargo" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-[#1B1B1B]">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#2563EB] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle className="w-4.5 h-4.5" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="text-center mb-10 mt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-xs font-mono font-bold tracking-wider uppercase mb-3">
          <Truck className="w-3.5 h-3.5" />
          Biteship Sandbox Testing Console
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-[#1B1B1B]">
          Biteship API Testing & Activation
        </h1>
        <p className="text-xs text-slate-500 font-light max-w-2xl mx-auto mt-2 leading-relaxed">
          Platform interaktif khusus untuk memanggil endpoint API Biteship Sandbox secara langsung.
          Gunakan konsol ini untuk menghasilkan <strong>Delivered Test Order ID</strong> dan <strong>Cancelled Test Order ID</strong> guna mengaktifkan API order di dashboard Biteship Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: GUIDES & CONFIG (Width 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Guide Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-serif text-lg font-medium text-[#111111] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              Panduan Aktivasi API
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Biteship Sandbox mensyaratkan developer untuk membuat minimal satu test order dan mensimulasikan statusnya hingga <strong>Delivered (Diterima)</strong> dan <strong>Cancelled (Dibatalkan)</strong> sebelum API Production diaktifkan.
            </p>

            <div className="relative border-l border-[#2563EB]/20 ml-2.5 pl-5 space-y-6 text-xs">
              <div className="relative">
                <span className="absolute -left-[27px] top-0 bg-[#2563EB] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold text-[9px]">
                  1
                </span>
                <p className="font-bold text-[#1B1B1B]">Simpan API Key Sandbox</p>
                <p className="text-slate-500 font-light mt-0.5 leading-relaxed">
                  Ambil Sandbox API Key dari Dashboard Biteship Anda dan tempel di formulir di bawah.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[27px] top-0 bg-[#2563EB] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold text-[9px]">
                  2
                </span>
                <p className="font-bold text-[#1B1B1B]">Buat Test Order Baru</p>
                <p className="text-slate-500 font-light mt-0.5 leading-relaxed">
                  Isi formulir pengiriman di sebelah kanan lalu tekan tombol <strong>Buat Test Order</strong>. Order otomatis terdaftar di riwayat.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[27px] top-0 bg-[#2563EB] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold text-[9px]">
                  3
                </span>
                <p className="font-bold text-[#1B1B1B]">Simulasikan Status</p>
                <p className="text-slate-500 font-light mt-0.5 leading-relaxed">
                  Gunakan tombol <strong>Simulate Delivered</strong> atau <strong>Simulate Cancelled</strong> di tabel riwayat untuk mengubah status order secara instan.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[27px] top-0 bg-slate-400 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold text-[9px]">
                  4
                </span>
                <p className="font-bold text-[#1B1B1B]">Salin ID untuk Formulir</p>
                <p className="text-slate-500 font-light mt-0.5 leading-relaxed">
                  Salin Order ID hasil simulasi dan masukkan ke kolom Biteship Activation Form.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex gap-2 items-start text-[10px] text-slate-500 leading-normal">
                <HelpCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <p>
                  Seluruh pengujian menggunakan endpoint resmi Biteship Sandbox tanpa biaya saldo nyata.
                </p>
              </div>
            </div>
          </div>

          {/* Config Card: API Key Storage & Cek Koneksi */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-medium text-[#111111] flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              API Credentials
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Biteship Sandbox API Key
                </label>
                <button 
                  onClick={() => setApiKey("biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_placeholder_key_not_valid")}
                  className="text-[9px] text-[#2563EB] hover:underline p-0 font-medium bg-transparent border-none cursor-pointer"
                >
                  Gunakan Demo
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="password"
                  required
                  placeholder="biteship_test_xxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#1B1B1B] font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  Simpan
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                * Kunci disimpan lokal di browser Anda. Jika kosong, server menggunakan environment variable.
              </p>
            </div>

            {/* Connection Test Action */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={loadingTestConn}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold text-xs tracking-wide uppercase shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingTestConn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Uji Koneksi API Key
                  </>
                )}
              </button>

              {/* Connection Status Badge */}
              {connectionStatus !== "untested" && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  connectionStatus === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-rose-50 border-rose-100 text-rose-800"
                }`}>
                  {connectionStatus === "success" ? (
                    <Wifi className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-bold">
                      {connectionStatus === "success" ? "Koneksi Berhasil!" : "Koneksi Gagal"}
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-90">{connectionMsg}</p>
                    
                    {connectionStatus === "failed" && connectionErrorRaw && (
                      <details className="mt-2 text-[10px] text-rose-900 bg-rose-100/50 p-2 rounded-lg font-mono overflow-auto max-h-32">
                        <summary className="cursor-pointer font-bold">Tampilkan JSON Kegagalan</summary>
                        <pre className="mt-1 leading-normal select-all">
                          {JSON.stringify(connectionErrorRaw, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Rates (Inquiry) Helper */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-medium text-[#111111] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#2563EB]" />
              Tarif Instan (Cek Ongkir)
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Kode Pos Asal</label>
                  <input type="text" value={ratesOriginPostal} onChange={(e) => setRatesOriginPostal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Kode Pos Tujuan</label>
                  <input type="text" value={ratesDestPostal} onChange={(e) => setRatesDestPostal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5 text-xs focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Berat (Gram)</label>
                  <input type="number" value={ratesWeight} onChange={(e) => setRatesWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Pilihan Kurir</label>
                  <input type="text" placeholder="jne,jnt,sicepat" value={ratesCouriers} onChange={(e) => setRatesCouriers(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5 text-xs focus:outline-none font-mono" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckRates}
                disabled={loadingRates}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingRates ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghitung Ongkir...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Cek Tarif Layanan
                  </>
                )}
              </button>
            </div>

            {/* Display list of Rates results */}
            {ratesResult && Array.isArray(ratesResult) && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto thin-scrollbar">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Daftar Ongkir Biteship</span>
                {ratesResult.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-light italic">Tidak ada layanan kurir ditemukan untuk rute ini.</p>
                ) : (
                  ratesResult.map((service: any, index: number) => (
                    <div key={index} className="p-2 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 uppercase">{service.company} - {service.type}</p>
                        <p className="text-[10px] text-slate-400">Estimasi Tiba: {service.duration || "N/A"}</p>
                      </div>
                      <p className="font-bold text-[#2563EB] text-xs">Rp {service.price?.toLocaleString("id-ID")}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {ratesResult && ratesResult.errorState && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-800 space-y-1">
                <p className="font-bold">Gagal Ambil Ongkir ({ratesResult.httpStatus})</p>
                <p className="leading-normal">{ratesResult.message}</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN FORM & RESULTS (Width 8/12) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Action Panel: Create Test Order */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="font-serif text-xl font-light text-[#111111] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2563EB]" />
              Formulir Pembuatan Test Order
            </h2>

            {/* Form Fields: Grid Partitions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Shipper Information */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <p className="font-serif font-bold text-sm text-[#2563EB] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4" />
                  1. Data Pengirim (Shipper)
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Nama Pengirim</label>
                    <input type="text" value={shipperName} onChange={(e) => setShipperName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">No Telepon Pengirim</label>
                    <input type="text" value={shipperPhone} onChange={(e) => setShipperPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Alamat Pengirim</label>
                    <textarea rows={2} value={shipperAddress} onChange={(e) => setShipperAddress(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB] resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Kode Pos Pengirim (Origin)</label>
                    <input type="text" value={shipperPostal} onChange={(e) => setShipperPostal(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                </div>
              </div>

              {/* Destination Information */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <p className="font-serif font-bold text-sm text-[#2563EB] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4" />
                  2. Data Penerima (Destination)
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Nama Penerima</label>
                    <input type="text" value={destName} onChange={(e) => setDestName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">No Telepon Penerima</label>
                    <input type="text" value={destPhone} onChange={(e) => setDestPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Alamat Penerima</label>
                    <textarea rows={2} value={destAddress} onChange={(e) => setDestAddress(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB] resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Kode Pos Penerima (Destination)</label>
                    <input type="text" value={destPostal} onChange={(e) => setDestPostal(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                </div>
              </div>

            </div>

            {/* Item and Courier Section */}
            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4 text-xs">
              <p className="font-serif font-bold text-sm text-[#2563EB] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Package className="w-4 h-4" />
                3. Detail Barang & Pilihan Kurir Pengiriman
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Barang</label>
                  <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Berat Barang (Gram)</label>
                  <input type="text" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-[#2563EB]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Nilai Barang (Rupiah)</label>
                  <input type="text" value={itemValue} onChange={(e) => setItemValue(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-[#2563EB]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Penyedia Kurir (Courier Company)</label>
                  <select 
                    value={courierCompany} 
                    onChange={(e) => setCourierCompany(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <optgroup label="Ojek Online (Instant / Same Day)">
                      {couriersList.filter(c => c.category === "Instant / Same Day").map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Reguler & Hemat (Standard / Eco)">
                      {couriersList.filter(c => c.category !== "Instant / Same Day" && c.category !== "Cargo").map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Kargo & Alat Berat (Cargo / Bulk)">
                      {couriersList.filter(c => c.category === "Cargo").map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Layanan Kurir (Service Type)</label>
                  <select 
                    value={courierType} 
                    onChange={(e) => setCourierType(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-[#2563EB]"
                  >
                    {getAvailableServices().map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Execute Request Trigger Button */}
            <button
              type="button"
              onClick={handleCreateTestOrder}
              disabled={loadingOrder}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-4 rounded-2xl font-bold text-sm tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  Buat Pesanan
                </>
              )}
            </button>
          </div>

          {/* Feedback & API Error alerts panel */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 bg-rose-50 border border-rose-200 rounded-3xl flex gap-3.5 items-start text-xs text-rose-800"
              >
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-950">Gagal Memproses Permintaan</p>
                  <p className="leading-relaxed text-rose-700/90">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {orderResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Highlighted Order Success Result */}
                {orderResult.success && orderResult.orderId && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 text-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                    
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-2">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>

                    <p className="text-xs text-emerald-800 font-bold tracking-wider uppercase font-mono">
                      Test Order Berhasil Diterima oleh Biteship Sandbox!
                    </p>

                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                        Copy Order ID berikut:
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <span className="font-mono text-xl sm:text-2xl font-bold bg-white text-slate-800 px-6 py-3 rounded-2xl border border-slate-200 shadow-sm inline-block tracking-wide select-all">
                          {orderResult.orderId}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(orderResult.orderId, "main-order-result")}
                          className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                        >
                          {copiedId === "main-order-result" ? (
                            <>
                              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-4 h-4" />
                              Copy Order ID
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-3 border-t border-slate-100 text-left text-xs mt-2">
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Order Number</span>
                        <span className="font-bold text-slate-800 font-mono">{orderResult.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Status Awal</span>
                        <span className="font-bold text-amber-600 capitalize font-mono">{orderResult.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Ekspedisi</span>
                        <span className="font-bold text-slate-800 uppercase font-mono">{orderResult.courier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Tracking ID (Waybill)</span>
                        <span className="font-bold text-slate-800 font-mono">{orderResult.trackingId || "Belum Ada"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw API Response Log */}
                <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-md font-mono text-xs space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Code className="w-4 h-4" />
                      JSON Response Log
                    </span>
                    <span className={`px-2.5 py-0.5 rounded ${orderResult.errorState ? "bg-rose-900/40 text-rose-300" : "bg-emerald-950/40 text-emerald-300"}`}>
                      STATUS {orderResult.httpStatus || 200}
                    </span>
                  </div>
                  <pre className="overflow-x-auto max-h-60 text-[11px] leading-relaxed p-2 bg-black/30 rounded-2xl thin-scrollbar scroll-smooth select-all text-emerald-400">
                    {JSON.stringify(orderResult.rawResponse || orderResult, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test Order History Log (Persisted in Firestore) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-serif text-lg font-medium text-[#111111]">
                  Riwayat Test Order Sandbox (Firestore)
                </h3>
              </div>
            </div>

            {loadingHistory && orderHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                Memuat riwayat dari Firestore...
              </div>
            ) : orderHistory.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs space-y-1">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-bold text-slate-600">Belum Ada Riwayat Test Order</p>
                <p className="font-light max-w-sm mx-auto">Silakan buat test order pertama Anda dengan mengisi form di atas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-2">Order ID & Number</th>
                      <th className="py-3 px-2">Tanggal Buat</th>
                      <th className="py-3 px-2">Kurir / Service</th>
                      <th className="py-3 px-2">Status Sandbox</th>
                      <th className="py-3 px-2">Tracking ID</th>
                      <th className="py-3 px-2 text-right">Aksi Simulasi & Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderHistory.map((order) => {
                      const isDelivered = order.status === "delivered";
                      const isCancelled = order.status === "cancelled";
                      const isSimulating = simulatingRowId === order.id;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2 font-mono whitespace-nowrap space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-800">{order.orderId}</span>
                              <button 
                                onClick={() => handleCopy(order.orderId, order.id + "-id")}
                                className="p-0.5 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                                title="Copy Order ID"
                              >
                                {copiedId === order.id + "-id" ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400 font-light flex items-center gap-1">
                              <span>No: {order.orderNumber}</span>
                              <button 
                                onClick={() => handleCopy(order.orderNumber, order.id + "-num")}
                                className="p-0.5 text-slate-300 hover:text-slate-500 bg-transparent border-none cursor-pointer"
                                title="Copy Order Number"
                              >
                                {copiedId === order.id + "-num" ? <ClipboardCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-slate-500 font-light">
                            {new Date(order.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {new Date(order.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-700 font-mono uppercase whitespace-nowrap">
                            {order.courier}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isDelivered 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : isCancelled 
                                  ? "bg-rose-50 text-rose-700 border border-rose-200" 
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className={order.trackingId === "Belum Tersedia" ? "text-slate-400 italic" : "font-bold text-slate-800"}>
                                {order.trackingId}
                              </span>
                              {order.trackingId !== "Belum Tersedia" && (
                                <button 
                                  onClick={() => handleCopy(order.trackingId, order.id + "-track")}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                                  title="Copy Waybill"
                                >
                                  {copiedId === order.id + "-track" ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right space-y-1">
                            
                            {/* Action Buttons Row */}
                            <div className="flex gap-1.5 justify-end items-center flex-wrap">
                              
                              {/* Open Details */}
                              <button
                                onClick={() => setActiveDetailOrder(order)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Detail Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete doc */}
                              <button
                                onClick={() => handleDeleteHistory(order.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                title="Hapus Riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Simulation buttons if status permits */}
                            {!isDelivered && !isCancelled && (
                              <div className="flex gap-1 justify-end pt-1">
                                <button
                                  disabled={isSimulating || cancellingRowId !== null}
                                  onClick={() => handleSimulateStatus(order.orderId, order.id, "delivered")}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5 disabled:opacity-50 cursor-pointer transition-colors"
                                  title="Simulasikan Pengantaran Sukses"
                                >
                                  {isSimulating && simulatingRowId === order.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckSquare className="w-2.5 h-2.5" />}
                                  Delivered
                                </button>
                                <button
                                  disabled={isSimulating || cancellingRowId !== null}
                                  onClick={() => handleCancelOrder(order.orderId, order.id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5 disabled:opacity-50 cursor-pointer transition-colors"
                                  title="Batalkan Pesanan Secara Resmi"
                                >
                                  {cancellingRowId === order.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <XSquare className="w-2.5 h-2.5" />}
                                  Cancel Order
                                </button>
                              </div>
                            )}

                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* DETAIL MODAL POPUP */}
      <AnimatePresence>
        {activeDetailOrder && (
            <motion.div 
              key="detail-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col text-xs text-[#1B1B1B]"
              >
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-medium text-slate-800">Detail Test Order Sandbox</h4>
                  <p className="font-mono text-[10px] text-slate-400">ID: {activeDetailOrder.orderId} &bull; No: {activeDetailOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setActiveDetailOrder(null)}
                  className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 thin-scrollbar">
                
                {/* Visual Status Indicator */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase">Tanggal Order</span>
                    <span className="font-bold text-slate-800">
                      {new Date(activeDetailOrder.date).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase">Status Sandbox</span>
                    <span className="font-bold text-slate-800 capitalize">{activeDetailOrder.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase">Kurir Ekspedisi</span>
                    <span className="font-bold text-slate-800 uppercase">{activeDetailOrder.courier}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase">Waybill (Tracking ID)</span>
                    <span className="font-bold text-[#2563EB] font-mono">{activeDetailOrder.trackingId}</span>
                  </div>
                </div>

                {/* Sender & Receiver Detail Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Sender */}
                  <div className="border border-slate-150 p-4 rounded-2xl space-y-2">
                    <p className="font-bold text-slate-700 flex items-center gap-1.5 border-b pb-1">
                      <User className="w-4 h-4 text-[#2563EB]" />
                      Pengirim (Shipper)
                    </p>
                    {activeDetailOrder.shipper ? (
                      <div className="space-y-1.5 leading-relaxed font-light text-slate-600">
                        <p><strong className="font-semibold text-slate-800">Nama:</strong> {activeDetailOrder.shipper.name}</p>
                        <p><strong className="font-semibold text-slate-800">Telepon:</strong> {activeDetailOrder.shipper.phone}</p>
                        <p><strong className="font-semibold text-slate-800">Kode Pos:</strong> {activeDetailOrder.shipper.postalCode}</p>
                        <p><strong className="font-semibold text-slate-800">Alamat:</strong> {activeDetailOrder.shipper.address}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic font-light">Tidak ada rincian data pengirim.</p>
                    )}
                  </div>

                  {/* Receiver */}
                  <div className="border border-slate-150 p-4 rounded-2xl space-y-2">
                    <p className="font-bold text-slate-700 flex items-center gap-1.5 border-b pb-1">
                      <MapPin className="w-4 h-4 text-[#2563EB]" />
                      Penerima (Destination)
                    </p>
                    {activeDetailOrder.destination ? (
                      <div className="space-y-1.5 leading-relaxed font-light text-slate-600">
                        <p><strong className="font-semibold text-slate-800">Nama:</strong> {activeDetailOrder.destination.name}</p>
                        <p><strong className="font-semibold text-slate-800">Telepon:</strong> {activeDetailOrder.destination.phone}</p>
                        <p><strong className="font-semibold text-slate-800">Kode Pos:</strong> {activeDetailOrder.destination.postalCode}</p>
                        <p><strong className="font-semibold text-slate-800">Alamat:</strong> {activeDetailOrder.destination.address}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic font-light">Tidak ada rincian data penerima.</p>
                    )}
                  </div>

                </div>

                {/* Items Block */}
                <div className="border border-slate-150 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5 border-b pb-1">
                    <Package className="w-4 h-4 text-[#2563EB]" />
                    Barang yang Dikirim (Items)
                  </p>
                  {activeDetailOrder.item ? (
                    <div className="grid grid-cols-3 gap-4 text-slate-600">
                      <div>
                        <strong className="font-semibold text-slate-800 block mb-0.5">Nama Item</strong>
                        <span>{activeDetailOrder.item.name}</span>
                      </div>
                      <div>
                        <strong className="font-semibold text-slate-800 block mb-0.5">Berat (Gram)</strong>
                        <span>{activeDetailOrder.item.weight} g</span>
                      </div>
                      <div>
                        <strong className="font-semibold text-slate-800 block mb-0.5">Nilai Barang</strong>
                        <span>Rp {Number(activeDetailOrder.item.value || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic font-light">Tidak ada rincian barang.</p>
                  )}
                </div>

                {/* Collapsible raw response JSON */}
                {activeDetailOrder.rawResponse && (
                  <div className="space-y-2">
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      <FileJson className="w-4 h-4 text-slate-400" />
                      Raw API Response Log (JSON)
                    </p>
                    <div className="bg-slate-900 text-[#10B981] p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-52 select-all border border-slate-850">
                      <pre>{JSON.stringify(JSON.parse(activeDetailOrder.rawResponse), null, 2)}</pre>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  onClick={() => setActiveDetailOrder(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
            <motion.div 
              key="delete-confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 text-xs text-[#1B1B1B]"
              >
              <div className="flex items-center gap-2.5 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h4 className="text-sm font-bold">Konfirmasi Hapus</h4>
              </div>
              <p className="text-slate-600 leading-relaxed font-light">
                Apakah Anda yakin ingin menghapus data ini?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={executeDeleteHistory}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
