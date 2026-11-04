export interface BrandingSettings {
  id: string
  store_name: string
  owner_name: string
  tagline: string
  logo_url: string | null
  mobile_logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  background_color: string
  font_display: string
  font_body: string
  business_category: string
  contact_email: string | null
  contact_address: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_tiktok: string | null
  social_whatsapp: string | null
}

export interface StoreSettings {
  id: string
  currency_code: string
  currency_symbol: string
  delivery_charge: number
  free_delivery_threshold: number | null
  min_order_amount: number
  notify_email: string
  order_prefix: string
  maintenance_mode: boolean
}

export interface ContactNumber {
  id: string
  kind: 'phone' | 'whatsapp'
  label: string
  number: string
  is_primary: boolean
  is_enabled: boolean
  button_label: string | null
  show_on: string[]
  sort_order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  specifications: Record<string, string>
  images: string[]
  category_id: string | null
  original_price: number
  selling_price: number | null
  discount_type: 'percent' | 'fixed' | null
  discount_value: number | null
  discount_active: boolean
  discount_start: string | null
  discount_end: string | null
  stock: number
  sku: string | null
  tags: string[]
  is_published: boolean
  is_featured: boolean
  rating: number
  reviews_count: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  original_unit: number | null
  discount_unit: number
  line_total: number
}

export type OrderStatus =
  | 'Pending' | 'Confirmed' | 'Processing' | 'Shipped'
  | 'Out for Delivery' | 'Delivered' | 'Cancelled'

export interface Order {
  id: string
  order_number: string
  client_order_id: string
  customer_id: string | null
  full_name: string
  phone: string
  email: string | null
  city: string | null
  address: string
  instructions: string | null
  source: 'website' | 'phone' | 'whatsapp' | 'admin'
  status: OrderStatus
  payment_method: string
  subtotal: number
  discount_total: number
  delivery_charge: number
  total: number
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface StatusHistoryEntry {
  id: string
  order_id: string
  status: string
  note: string | null
  changed_by: string | null
  created_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  city: string | null
  address: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

export interface EmailNotification {
  id: string
  order_id: string | null
  kind: string
  recipient: string
  status: 'pending' | 'sent' | 'failed'
  provider_id: string | null
  error: string | null
  attempts: number
  created_at: string
}
