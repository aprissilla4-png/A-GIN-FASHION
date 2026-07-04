/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Tab = "home" | "admin" | "workspace" | "lookbook";

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
  rating?: number;
  salesCount?: number;
  isFlashSale?: boolean;
  isPromo?: boolean;
  groupId?: string;
  isMainProduct?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
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
}

export interface HomeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  description?: string;
}

export interface DtfSettings {
  bannerImage: string;
  identityTitle: string;
  identitySubtitle: string;
  description: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  bgColor?: string;
}

export interface SmallBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  createdAt?: number;
}

