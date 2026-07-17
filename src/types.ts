/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Tab = "home" | "admin" | "workspace" | "explore" | "biteship-testing" | "sablon-dtf" | "post-product" | "info-banner-collection";

export interface ExploreVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  sizes?: string[];
  category: string;
  stock: number;
  description: string;
  code?: string;
  rating?: number;
  salesCount?: number;
  createdAt: number;
  isFlashSale?: boolean;
  isPromo?: boolean;
  productType?: "fashion" | "dtf";
  groupId?: string;
  isMainProduct?: boolean;
  isBannerProduct?: boolean;
  bannerId?: string;
  collectionId?: string;
  // DTF Specific fields
  printSize?: string;
  width?: number;
  height?: number;
  unit?: "cm" | "mm" | "inch";
  status?: "active" | "inactive";
  displayOrder?: number;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface MarketingText {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  position: 'top' | 'middle' | 'bottom';
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  avatarUrl?: string;
}

export interface LogoSettings {
  text: string;
  highlightText: string;
  slogan?: string;
  logoUrl?: string;
  originCityId?: string;
  originCityName?: string;
}

export interface HomeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  description?: string;
}

export interface VideoBanner {
  id: string;
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  position: "top" | "middle" | "bottom";
}

export interface DtfSettings {
  bannerImage: string;
  bannerVideo?: string;
  identityTitle: string;
  identitySubtitle: string;
  description: string;
  surchargeLogo?: number;
  surchargeA5?: number;
  surchargeA4?: number;
  surchargeA3?: number;
  surchargeXXL?: number;
  surchargeXXXL?: number;
  whatsappNumber?: string;
  mockupImage?: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description?: string;
  badge: string;
  bgColor?: string;
  url?: string;
}

export interface SmallBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  createdAt?: number;
}

export interface InfoBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgColor?: string;
  textColor?: string;
  isActive?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  rating: number;
  name: string;
  comment: string;
  imageProofUrl?: string;
  createdAt: number;
}

export interface TrackingEvent {
  date: number;
  location: string;
  status: string;
}

export interface OrderTransaction {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  address: string;
  courier: string;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "settlement" | "expire" | "cancel";
  waybill?: string | null;
  createdAt: number;
  trackingHistory?: TrackingEvent[];
}


