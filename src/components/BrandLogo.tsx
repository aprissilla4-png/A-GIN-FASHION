import React, { useEffect, useState } from 'react';

interface BrandLogoProps {
  brand: string;
  className?: string;
}

// Global cache & listener list to avoid multiple API calls
let globalCustomLogos: Record<string, string> | null = null;
let globalListeners: Array<(logos: Record<string, string>) => void> = [];
let isFetchingLogos = false;

const fetchCustomLogos = async () => {
  if (globalCustomLogos) return globalCustomLogos;
  if (isFetchingLogos) return;
  isFetchingLogos = true;
  try {
    const res = await fetch("/api/settings/custom-logos");
    if (res.ok) {
      const data = await res.json();
      globalCustomLogos = data;
      globalListeners.forEach(listener => listener(data));
    }
  } catch (err) {
    console.error("Failed to fetch custom logos:", err);
  } finally {
    isFetchingLogos = false;
  }
  return globalCustomLogos || {};
};

// Also export a function to force reload the custom logos from cache/DB
export const reloadBrandLogos = async () => {
  globalCustomLogos = null;
  await fetchCustomLogos();
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className = "h-5 w-auto object-contain" }) => {
  const [error, setError] = useState(false);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>(globalCustomLogos || {});
  
  useEffect(() => {
    if (globalCustomLogos) {
      setCustomLogos(globalCustomLogos);
      return;
    }

    const listener = (logos: Record<string, string>) => {
      setCustomLogos(logos);
    };
    globalListeners.push(listener);

    fetchCustomLogos();

    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  if (!brand) return null;

  const normalizedBrand = brand.toUpperCase().replace(/\s+/g, '');
  const logoUrl = customLogos[normalizedBrand] || customLogos[brand.toUpperCase()];

  if (!logoUrl || error) {
    return <span className="font-bold text-[10px]">{brand}</span>;
  }

  return (
    <img 
      src={logoUrl} 
      alt={brand} 
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
};
