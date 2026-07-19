import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Search, X, Check, Loader2, Compass, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

interface MapAddressPickerProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  isTextArea?: boolean;
}

// Clean Indonesian specific address details (RT, RW, House Numbers, Block Numbers)
// to perform successful fallback searches on OpenStreetMap/Nominatim.
const cleanQueryForSearch = (q: string): string => {
  let cleaned = q;
  
  // Remove RT/RW patterns: "RT 01 RW 02", "RT.01/RW.02", "RT. 01 RW. 02", "RT01 RW02", "RT.05", "RW.06" (case insensitive)
  cleaned = cleaned.replace(/rt\.?\s*\d+\s*/gi, "");
  cleaned = cleaned.replace(/rw\.?\s*\d+\s*/gi, "");
  // Remove slash separators like "RT.01/02" or "/02"
  cleaned = cleaned.replace(/\/\s*\d+/g, "");
  
  // Remove House Number patterns: "No. 123", "No.123", "No 123", "No. 12A/B", "Nomor 123"
  cleaned = cleaned.replace(/no\.?\s*\d+[a-z]?/gi, "");
  cleaned = cleaned.replace(/nomor\s*\d+[a-z]?/gi, "");
  
  // Remove block numbers: "Blok A-12", "Blok B3", "Blok A/12"
  cleaned = cleaned.replace(/blok\s*[a-z0-9-/\s]+/gi, "");
  
  // Remove extra commas or spaces left behind
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Parse display name to separate specific place/road from general city/province
function parseDisplayName(displayName: string) {
  if (!displayName) return { title: "Lokasi di Indonesia", subtitle: "" };
  const parts = displayName.split(",").map(p => p.trim());
  if (parts.length <= 1) return { title: parts[0], subtitle: "" };
  
  // The first 2 elements are usually the specific place/road/village
  const title = parts.slice(0, 2).join(", ");
  const subtitle = parts.slice(2).join(", ");
  return { title, subtitle };
}

// Custom brand-matching Rose-Blush Map Style for Google Maps
const MODE_CONNECT_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [
      { "color": "#fdf8f8" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#9f7d7d" }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#ffd7d7" }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      { "color": "#fff5f5" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffebeb" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#b17e7e" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#ffdcdc" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffe4e4" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#ffcaca" }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffeef0" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffd8de" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#e11d48" }
    ]
  }
];

export default function MapAddressPicker({
  value,
  onChange,
  placeholder = "Masukkan alamat pengiriman lengkap...",
  isTextArea = true,
}: MapAddressPickerProps) {
  // Check for the Google Maps API Key from Environment Variables
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

  const [isOpen, setIsOpen] = useState(false);
  const [tempAddress, setTempAddress] = useState(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [isFallbackUsed, setIsFallbackUsed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [forceLeafletFallback, setForceLeafletFallback] = useState(!hasValidKey);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -7.2575, // Surabaya central default
    lng: 112.7521,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Keep state updated with prop changes
  useEffect(() => {
    setTempAddress(value);
  }, [value]);

  // Set initial searchQuery when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(value);
    }
  }, [isOpen, value]);

  // Sync forceLeafletFallback dynamic state with keys
  useEffect(() => {
    setForceLeafletFallback(!hasValidKey);
  }, [hasValidKey]);

  // ==========================================
  // FALLBACK MAP ENGINE (Leaflet & Nominatim)
  // ==========================================
  useEffect(() => {
    if (!isOpen || !forceLeafletFallback) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        setMapLoading(true);
        const L = await loadLeaflet();
        if (!isMounted || !mapContainerRef.current) return;

        // Create custom ModeConnect rose-blush interactive pulse marker icon
        const customMarkerIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-red-500/20 rounded-full animate-ping"></div>
            <div class="relative bg-gradient-to-tr from-red-600 to-rose-500 text-white p-2.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="currentColor"/></svg>
            </div>
          </div>`,
          className: "custom-leaflet-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        // Initialize Map centered on current coords
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([coords.lat, coords.lng], 14);

        // Standard high-quality OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add Draggable Marker with custom ModeConnect brand icon
        const marker = L.marker([coords.lat, coords.lng], {
          draggable: true,
          icon: customMarkerIcon
        }).addTo(map);

        // Handle marker dragend
        marker.on("dragend", async (event: any) => {
          const position = event.target.getLatLng();
          const newCoords = { lat: position.lat, lng: position.lng };
          setCoords(newCoords);
          await reverseGeocodeLeaflet(newCoords.lat, newCoords.lng);
        });

        // Handle clicking on map to move marker
        map.on("click", async (event: any) => {
          const { lat, lng } = event.latlng;
          const newCoords = { lat, lng };
          setCoords(newCoords);
          marker.setLatLng([lat, lng]);
          await reverseGeocodeLeaflet(lat, lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Try to geocode current address to center map
        if (value.trim()) {
          await geocodeAddressLeaflet(value, map, marker);
        }

        setMapLoading(false);
      } catch (err) {
        console.error("Error loading Leaflet map:", err);
        setMapLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, forceLeafletFallback]);

  // Load Leaflet script & stylesheet from CDN dynamically
  const loadLeaflet = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).L) {
        resolve((window as any).L);
        return;
      }

      // 1. Inject Style
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Inject Script
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve((window as any).L);
      script.onerror = () => reject(new Error("Failed to load Leaflet"));
      document.body.appendChild(script);
    });
  };

  // GeoCoding (Address Text to Latitude/Longitude) using Nominatim fallback
  const geocodeAddressLeaflet = async (addr: string, mapInstance?: any, markerInstance?: any) => {
    try {
      const activeMap = mapInstance || mapRef.current;
      const activeMarker = markerInstance || markerRef.current;
      if (!activeMap || !activeMarker) return;

      const url = `/api/maps/search?q=${encodeURIComponent(addr)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.success && data.areas && data.areas.length > 0) {
        const item = data.areas[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const newCoords = { lat, lng };

        setCoords(newCoords);
        activeMap.setView([lat, lng], 15);
        activeMarker.setLatLng([lat, lng]);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
  };

  // Reverse Geocoding (Latitude/Longitude to Address Text) using Nominatim fallback
  const reverseGeocodeLeaflet = async (lat: number, lng: number) => {
    try {
      setMapLoading(true);
      const url = `/api/maps/reverse?lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.success && data.display_name) {
        setTempAddress(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    } finally {
      setMapLoading(false);
    }
  };

  // Handle autocomplete search inputs using Nominatim fallback
  const handleSearchChangeLeaflet = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setIsFallbackUsed(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `/api/maps/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.success && data.areas) {
          setSuggestions(data.areas.map((a: any) => ({
            ...a,
            display_name: a.display_name,
            lat: a.lat,
            lon: a.lon
          })));
        } else {
          setSuggestions([]);
        }
        setIsFallbackUsed(false);
      } catch (err) {
        console.error("Search suggestion failed:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSuggestionLeaflet = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const newCoords = { lat, lng };

    setCoords(newCoords);
    setTempAddress(item.display_name);
    setSearchQuery(item.display_name);
    setSuggestions([]);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const handleGetCurrentLocationLeaflet = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCoords = { lat, lng };

        setCoords(newCoords);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        
        await reverseGeocodeLeaflet(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error detecting geolocation:", error);
        let errorMsg = "Gagal mendeteksi lokasi Anda.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Harap izinkan akses lokasi GPS di browser Anda.";
        }
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    onChange(tempAddress);
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-1.5">
      {isTextArea ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 rounded-xl border border-slate-250 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 font-semibold resize-none shadow-sm transition-all duration-200"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs pl-3 pr-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 font-semibold shadow-sm transition-all duration-200"
        />
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-red-600 hover:text-red-700 transition-colors bg-red-50/80 hover:bg-red-100/70 border border-red-100/80 px-2.5 py-1.5 rounded-lg select-none cursor-pointer shadow-sm w-fit animate-pulse"
      >
        <MapPin className="w-3.5 h-3.5" />
        <span>Pilih di Peta Indonesia / Cari Alamat Lebih Akurat</span>
      </button>

      {/* MODAL VIEW */}
      {isOpen && (
        <>
          {/* A) SPLASH SETUP GUIDE IF KEY IS MISSING AND NOT FALLBACK BYPASSED */}
          {!hasValidKey && !forceLeafletFallback ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center animate-bounce">
                    <Compass className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800">Google Maps API Key Diperlukan</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Untuk mengaktifkan peta interaktif Google Maps & autocomplete alamat real-time se-Indonesia, silakan konfigurasikan API Key Anda.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-150 space-y-2 text-[11px] text-slate-700 leading-relaxed font-semibold">
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-extrabold flex items-center justify-center text-[10px] shrink-0">1</div>
                    <div>
                      <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline font-black">
                        Dapatkan Google Maps API Key Resmi
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-extrabold flex items-center justify-center text-[10px] shrink-0">2</div>
                    <div>
                      Buka menu <strong>Settings</strong> (ikon gerigi ⚙️ di pojok kanan atas) → <strong>Secrets</strong>.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-extrabold flex items-center justify-center text-[10px] shrink-0">3</div>
                    <div>
                      Tambahkan secret bernama <code>GOOGLE_MAPS_PLATFORM_KEY</code> dan masukkan API Key Anda sebagai nilainya.
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal">
                    *Aplikasi akan melakukan build ulang otomatis dalam beberapa detik setelah Anda menyimpan Secret.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => setForceLeafletFallback(true)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-colors cursor-pointer"
                  >
                    Abaikan & Gunakan Peta Cadangan (OpenStreetMap)
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          ) : forceLeafletFallback ? (
            /* ==========================================
               FALLBACK OPENSTREETMAP LEAFLET RENDERER
               ========================================== */
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg md:max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-[80vh] border border-slate-100">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500 text-white rounded-xl shadow-md shadow-red-500/10">
                      <Compass className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-800">Cari Alamat (OpenStreetMap Cadangan)</h3>
                      <p className="text-[9.5px] text-slate-500 font-bold leading-none mt-0.5">Peta alternatif gratis se-Indonesia</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Autocomplete Search Bar */}
                <div className="p-3 border-b border-slate-100 bg-white relative z-50">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChangeLeaflet(e.target.value)}
                        placeholder="Ketik alamat atau tempel koordinat GPS..."
                        className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-bold shadow-sm"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                      
                      {isSearching && (
                        <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin absolute right-3 top-3.5" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGetCurrentLocationLeaflet}
                      disabled={isLocating}
                      className="px-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 transition-all text-[11px] font-black cursor-pointer active:scale-95 shrink-0"
                      title="Gunakan Lokasi GPS Saat Ini"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                      )}
                      <span className="hidden sm:inline">Lokasi Saya</span>
                    </button>
                  </div>

                  {locationError && (
                    <div className="mt-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between gap-1.5 text-[9.5px] text-rose-700 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{locationError}</span>
                      </div>
                      <button onClick={() => setLocationError(null)} className="text-rose-400 hover:text-rose-600 font-bold ml-1 cursor-pointer">✕</button>
                    </div>
                  )}

                  {/* Nominatim Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-3 right-3 mt-1 bg-white border border-slate-250/80 rounded-xl shadow-2xl z-[60] max-h-56 overflow-y-auto divide-y divide-slate-100 py-1 border-t-2 border-t-red-500">
                      {suggestions.map((item, idx) => {
                        const parsed = parseDisplayName(item.display_name);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestionLeaflet(item)}
                            className="w-full text-left px-3.5 py-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-[11px] font-semibold text-slate-700"
                          >
                            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="overflow-hidden">
                              <span className="font-extrabold text-slate-900 block leading-snug truncate">
                                {parsed.title}
                              </span>
                              <span className="text-[9.5px] text-slate-400 leading-normal block mt-0.5 truncate">
                                {parsed.subtitle}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Leaflet Map Area */}
                <div className="flex-1 bg-slate-50 relative flex flex-col overflow-hidden">
                  {mapLoading && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 gap-2">
                      <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-bold">Memuat peta Indonesia...</span>
                    </div>
                  )}
                  <div ref={mapContainerRef} className="w-full h-full z-10 modeconnect-map-style" />

                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl text-[10px] leading-relaxed flex items-start gap-2 border border-slate-700/50 shadow-xl pointer-events-none z-20">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-extrabold block text-white text-[10.5px]">Petunjuk Klik di Peta:</span>
                      Ketuk peta di mana saja untuk memindahkan pin merah ke rumah Anda, atau geser (drag) pin langsung ke lokasi tujuan.
                    </div>
                  </div>
                </div>

                {/* Footer Save Section */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
                  <div>
                    <span className="text-[9.5px] font-extrabold text-slate-400 block uppercase tracking-wide">Alamat Pengiriman Terpilih</span>
                    <div className="flex gap-2 items-start mt-1">
                      <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <textarea
                        value={tempAddress}
                        onChange={(e) => setTempAddress(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-1 focus:ring-red-500 font-bold text-slate-700 leading-normal"
                        placeholder="Alamat akan terisi otomatis setelah Anda memilih pin di peta..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-600 font-black text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!tempAddress.trim()}
                      className="flex-1 py-2.5 bg-gradient-to-tr from-red-600 to-rose-600 text-white rounded-xl font-black text-xs shadow-lg shadow-red-600/15 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Konfirmasi Alamat</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* ==========================================
               REAL-TIME GOOGLE MAPS PLATFORM IMPLEMENTATION
               ========================================== */
            <APIProvider apiKey={API_KEY} version="weekly">
              <GoogleMapPickerContent
                coords={coords}
                setCoords={setCoords}
                tempAddress={tempAddress}
                setTempAddress={setTempAddress}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                isSearching={isSearching}
                setIsSearching={setIsSearching}
                mapLoading={mapLoading}
                setMapLoading={setMapLoading}
                isLocating={isLocating}
                setIsLocating={setIsLocating}
                locationError={locationError}
                setLocationError={setLocationError}
                value={value}
                onSave={handleSave}
                onClose={() => setIsOpen(false)}
                isTextArea={isTextArea}
              />
            </APIProvider>
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// GOOGLE MAPS API CONTENT SUB-COMPONENT
// ==========================================
interface GoogleMapPickerContentProps {
  coords: { lat: number; lng: number };
  setCoords: (c: { lat: number; lng: number }) => void;
  tempAddress: string;
  setTempAddress: (a: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  suggestions: any[];
  setSuggestions: (s: any[]) => void;
  isSearching: boolean;
  setIsSearching: (b: boolean) => void;
  mapLoading: boolean;
  setMapLoading: (b: boolean) => void;
  isLocating: boolean;
  setIsLocating: (b: boolean) => void;
  locationError: string | null;
  setLocationError: (s: string | null) => void;
  value: string;
  onSave: () => void;
  onClose: () => void;
  isTextArea: boolean;
}

function GoogleMapPickerContent({
  coords,
  setCoords,
  tempAddress,
  setTempAddress,
  searchQuery,
  setSearchQuery,
  suggestions,
  setSuggestions,
  isSearching,
  setIsSearching,
  mapLoading,
  setMapLoading,
  isLocating,
  setIsLocating,
  locationError,
  setLocationError,
  value,
  onSave,
  onClose,
  isTextArea,
}: GoogleMapPickerContentProps) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");

  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Initialize AutocompleteService and Geocoder
  useEffect(() => {
    if (placesLib) {
      setAutocompleteService(new placesLib.AutocompleteService());
    }
  }, [placesLib]);

  useEffect(() => {
    if (geocodingLib) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib]);

  // Center Google Map on initial value if loaded
  useEffect(() => {
    if (geocoder && value.trim()) {
      setMapLoading(true);
      geocoder.geocode({ address: value }, (results, status) => {
        setMapLoading(false);
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const loc = results[0].geometry.location;
          const newCoords = { lat: loc.lat(), lng: loc.lng() };
          setCoords(newCoords);
          if (map) {
            map.setCenter(newCoords);
            map.setZoom(16);
          }
        }
      });
    } else {
      setMapLoading(false);
    }
  }, [geocoder, value, map]);

  // Geocoding and location search handler (Google Places API)
  const handleSearchChangeGoogle = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      if (!autocompleteService) {
        setIsSearching(false);
        return;
      }

      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "id" } // Restrict search to Indonesia
        },
        (predictions, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(
              predictions.map((p) => ({
                display_name: p.description,
                main_text: p.structured_formatting.main_text,
                secondary_text: p.structured_formatting.secondary_text,
                place_id: p.place_id,
                source: "google"
              }))
            );
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 400);
  };

  // Google geocode reverse helper
  const reverseGeocodeGoogle = (lat: number, lng: number) => {
    if (!geocoder) return;

    setMapLoading(true);
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setMapLoading(false);
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const address = results[0].formatted_address;
        setTempAddress(address);
        setSearchQuery(address);
      }
    });
  };

  // Select a suggestion from the Autocomplete Service dropdown
  const handleSelectSuggestionGoogle = (item: any) => {
    if (!geocoder || !item.place_id) return;

    setMapLoading(true);
    geocoder.geocode({ placeId: item.place_id }, (results, status) => {
      setMapLoading(false);
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const newCoords = { lat, lng };

        setCoords(newCoords);
        setTempAddress(results[0].formatted_address);
        setSearchQuery(results[0].formatted_address);
        setSuggestions([]);

        if (map) {
          map.setCenter(newCoords);
          map.setZoom(17);
        }
      }
    });
  };

  // GPS Current Location handler
  const handleGetCurrentLocationGoogle = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCoords = { lat, lng };

        setCoords(newCoords);
        if (map) {
          map.setCenter(newCoords);
          map.setZoom(17);
        }
        reverseGeocodeGoogle(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error detecting geolocation:", error);
        let errorMsg = "Gagal mendeteksi lokasi Anda.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Harap izinkan akses lokasi GPS di browser Anda.";
        }
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg md:max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-[80vh] border border-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500 text-white rounded-xl shadow-md shadow-red-500/10">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-black text-xs text-slate-800">Cari Alamat (Google Maps Real-Time)</h3>
              <p className="text-[9.5px] text-slate-500 font-bold leading-none mt-0.5">Akurasi & database resmi Google Maps</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Address Autocomplete Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white relative z-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChangeGoogle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && suggestions.length > 0) {
                    handleSelectSuggestionGoogle(suggestions[0]);
                  }
                }}
                placeholder="Cari lokasi (contoh: Cafe Paradiso, West 65th St)..."
                className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-bold shadow-sm"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin absolute right-3 top-3.5" />
              )}
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocationGoogle}
              disabled={isLocating}
              className="px-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 transition-all text-[11px] font-black cursor-pointer active:scale-95 shrink-0"
              title="Gunakan Lokasi GPS Saat Ini"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              )}
              <span className="hidden sm:inline">Lokasi Saya</span>
            </button>
          </div>

          {locationError && (
            <div className="mt-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between gap-1.5 text-[9.5px] text-rose-700 font-bold">
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-rose-500 shrink-0" />
                <span>{locationError}</span>
              </div>
              <button onClick={() => setLocationError(null)} className="text-rose-400 hover:text-rose-600 font-bold ml-1 cursor-pointer">✕</button>
            </div>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-3 right-3 mt-1 bg-white border border-slate-250/80 rounded-xl shadow-2xl z-[60] max-h-56 overflow-y-auto divide-y divide-slate-100 py-1 border-t-2 border-t-red-500">
              {suggestions.map((item, idx) => {
                const parsed = parseDisplayName(item.display_name);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestionGoogle(item)}
                    className="w-full text-left px-3.5 py-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-[11px] font-semibold text-slate-700"
                  >
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <span className="font-extrabold text-slate-900 block leading-snug truncate">
                        {item.main_text || parsed.title}
                      </span>
                      <span className="text-[9.5px] text-slate-400 leading-normal block mt-0.5 truncate">
                        {item.secondary_text || parsed.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Google Map Instance */}
        <div className="flex-1 bg-slate-50 relative flex flex-col overflow-hidden">
          {mapLoading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 gap-2">
              <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
              <span className="text-[10px] text-slate-500 font-bold">Memuat peta Indonesia...</span>
            </div>
          )}
          
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={coords}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            styles={MODE_CONNECT_MAP_STYLE}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: "100%", height: "100%" }}
            onClick={(e) => {
              const clickedLatLng = e.detail.latLng;
              if (clickedLatLng) {
                const newCoords = { lat: clickedLatLng.lat, lng: clickedLatLng.lng };
                setCoords(newCoords);
                reverseGeocodeGoogle(clickedLatLng.lat, clickedLatLng.lng);
              }
            }}
          >
            {/* Draggable Marker with custom ModeConnect brand overlay */}
            <AdvancedMarker
              position={coords}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setCoords({ lat, lng });
                  reverseGeocodeGoogle(lat, lng);
                }
              }}
            >
              {/* Custom Marker Pin: Explicit size prevents CF3 (Invisible Markers) */}
              <div className="relative flex items-center justify-center w-10 h-10 select-none">
                <div className="absolute w-8 h-8 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-tr from-red-600 to-rose-500 text-white p-2.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </AdvancedMarker>
          </Map>

          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl text-[10px] leading-relaxed flex items-start gap-2 border border-slate-700/50 shadow-xl pointer-events-none z-20">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <span className="font-extrabold block text-white text-[10.5px]">Petunjuk Google Maps:</span>
              Ketuk peta di mana saja untuk memindahkan pin merah ke rumah Anda, atau geser (drag) pin merah langsung ke lokasi tujuan.
            </div>
          </div>
        </div>

        {/* Footer with Final Selected Address & Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <div>
            <span className="text-[9.5px] font-extrabold text-slate-400 block uppercase tracking-wide">Alamat Pengiriman Terpilih</span>
            <div className="flex gap-2 items-start mt-1">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <textarea
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-1 focus:ring-red-500 font-bold text-slate-700 leading-normal"
                placeholder="Alamat akan terisi otomatis setelah Anda memilih pin di peta..."
              />
            </div>
          </div>
          
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-600 font-black text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!tempAddress.trim()}
              className="flex-1 py-2.5 bg-gradient-to-tr from-red-600 to-rose-600 text-white rounded-xl font-black text-xs shadow-lg shadow-red-600/15 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Konfirmasi Alamat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
