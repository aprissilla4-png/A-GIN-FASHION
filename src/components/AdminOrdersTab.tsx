import React, { useState, useEffect } from "react";
import { RefreshCw, Truck, MapPin, Package, Search } from "lucide-react";
import { OrderTransaction } from "../types";

export default function AdminOrdersTab() {
  const [orders, setOrders] = useState<OrderTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Gagal memuat orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateTracking = async (orderId: string, waybill: string, trackingEvent?: { location: string, status: string, date: number }) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waybill, trackingEvent })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span>Daftar Pesanan ({orders.length})</span>
        </h3>
        <button
          onClick={fetchOrders}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.sort((a, b) => b.createdAt - a.createdAt).map(order => (
            <div key={order.id} className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-800">{order.id}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      order.paymentStatus === 'settlement' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{order.productName} ({order.size}) x{order.quantity} - {order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              {expandedId === order.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Info Pengiriman</p>
                      <div className="space-y-1 text-xs">
                        <p><span className="font-semibold">Penerima:</span> {order.customerName} ({order.customerPhone})</p>
                        <p><span className="font-semibold">Alamat:</span> {order.address}</p>
                        <p><span className="font-semibold">Kurir:</span> {order.courier}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Manajemen Resi & Pelacakan</p>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newWaybill = formData.get('waybill') as string;
                        if (newWaybill) {
                          handleUpdateTracking(order.id, newWaybill);
                        }
                      }} className="flex items-center gap-2 mb-3">
                        <input name="waybill" defaultValue={order.waybill || ""} placeholder="Nomor Resi" className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                        <button type="submit" className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-slate-700">Simpan Resi</button>
                      </form>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 mb-1">Tambah Status Pelacakan Cepat:</p>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleUpdateTracking(order.id, order.waybill || "", { location: "Pusat Sortir Jawa Barat", status: "Paket tiba di fasilitas logistik", date: Date.now() })} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md hover:bg-emerald-100 transition-colors">
                            + Tiba di Jawa Barat
                          </button>
                          <button onClick={() => handleUpdateTracking(order.id, order.waybill || "", { location: "Fasilitas Pengiriman Lokal", status: "Paket sedang dibawa kurir", date: Date.now() })} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md hover:bg-blue-100 transition-colors">
                            + Dibawa Kurir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-400 font-medium">Belum ada pesanan.</p>
          )}
        </div>
      )}
    </div>
  );
}
