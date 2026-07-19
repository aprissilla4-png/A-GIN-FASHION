import React, { useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { User } from '../types';

interface DokuPaymentButtonProps {
  cart: any[];
  total: number;
  user: User | null;
  address?: string;
  courier?: string;
  shippingCost?: number | null;
  customerName?: string;
  customerPhone?: string;
  onCheckout?: (params: any) => Promise<any>;
}

export default function DokuPaymentButton({ 
  cart, 
  total, 
  user,
  address, 
  courier, 
  shippingCost,
  customerName,
  customerPhone,
  onCheckout
}: DokuPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<"DOKU" | "MIDTRANS">("DOKU");

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (onCheckout) {
        // Use custom handleCheckout handler passed from App.tsx as requested
        data = await onCheckout({
          cart,
          total,
          address: address || "Alamat Pengiriman Default",
          courier: courier || "JNE",
          shippingCost: shippingCost || 0,
          customerName: customerName?.trim() || "Guest User",
          customerPhone: customerPhone?.trim() || "081234567890",
          gateway
        });
      } else {
        // Fallback default checkout
        const productName = cart.length === 1 
          ? cart[0].product.name 
          : `${cart.length} Produk (Multiple Items)`;
          
        const productId = cart.length > 0 ? cart[0].product.id : "cart";
        const productImage = cart.length > 0 ? cart[0].product.image : "";
        const size = cart.length === 1 ? cart[0].selectedSize : "Mixed";
        
        const response = await fetch('/api/payments/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user?.id || null,
            productId,
            productName,
            productImage,
            size,
            price: total,
            quantity: 1,
            customerName: customerName?.trim() || "Guest User",
            customerPhone: customerPhone?.trim() || "081234567890",
            address: address || "Alamat Pengiriman Default",
            courier: courier || "JNE",
            shippingCost: shippingCost || 0,
            totalAmount: total,
            paymentMethod: gateway === "MIDTRANS" ? "MIDTRANS" : "DOKU_CHECKOUT"
          })
        });
        
        data = await response.json();
      }
      
      if (data && data.checkoutUrl) {
        // Redirect to DOKU / Midtrans Hosted Checkout Page
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data?.error || "Gagal mendapatkan URL pembayaran dari Gateway.");
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Gagal memproses pembayaran.');
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-start gap-2 text-left animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Gateway selector card style */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pilih Payment Gateway</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGateway("DOKU")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
              gateway === "DOKU"
                ? "border-red-600 bg-red-50/20 ring-1 ring-red-600 font-bold"
                : "border-slate-200 bg-white hover:border-slate-300 font-medium"
            }`}
          >
            <BrandLogo brand="DOKU" className="h-4 w-auto mb-1" />
            <span className="text-[9px] font-extrabold text-slate-700">Doku Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => setGateway("MIDTRANS")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
              gateway === "MIDTRANS"
                ? "border-red-600 bg-red-50/20 ring-1 ring-red-600 font-bold"
                : "border-slate-200 bg-white hover:border-slate-300 font-medium"
            }`}
          >
            <BrandLogo brand="MIDTRANS" className="h-4 w-auto mb-1" />
            <span className="text-[9px] font-extrabold text-slate-700">Midtrans Gateway</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || cart.length === 0 || !address || !customerName?.trim() || !customerPhone?.trim() || shippingCost === null || shippingCost === undefined}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? (
          <span className="flex items-center gap-1.5">Memproses ke <BrandLogo brand={gateway} className="h-3.5 w-auto brightness-0 invert" />...</span>
        ) : (
          <span className="flex items-center gap-1.5">Checkout via <BrandLogo brand={gateway} className="h-3.5 w-auto brightness-0 invert" /></span>
        )}
      </button>
    </div>
  );
}
