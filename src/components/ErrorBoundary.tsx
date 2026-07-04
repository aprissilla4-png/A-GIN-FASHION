import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    localStorage.removeItem("tf_cart");
    localStorage.removeItem("tf_user");
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="error-boundary-screen" className="min-h-screen bg-[#F5F2EB] text-[#1B1B1B] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#FAF9F5] border border-[#1B1B1B]/10 p-8 rounded-2xl shadow-xl space-y-6 text-center">
            {/* Minimalist Logo Header */}
            <div className="space-y-1">
              <span className="font-serif text-3xl font-extrabold tracking-wider text-[#1B1B1B]">A-GIN</span>
              <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#A68966] font-semibold">MADE TO MOVE</p>
            </div>
            
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-red-200">
              !
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight">Terjadi Kendala Teknis</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ada kesalahan tak terduga yang menyebabkan sistem terhenti. Jangan khawatir, data pesanan dan keranjang belanja Anda tetap aman.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-left text-[11px] font-mono max-h-32 overflow-auto whitespace-pre-wrap">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-[#1B1B1B] hover:bg-[#A68966] text-white font-mono text-[11px] uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer font-medium"
              >
                Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-white hover:bg-red-50 border border-[#1B1B1B]/10 text-red-600 font-mono text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer font-medium"
              >
                Reset Sesi & Data Keranjang
              </button>
            </div>
            
            <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
              Safe Recovery Mode Active
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
