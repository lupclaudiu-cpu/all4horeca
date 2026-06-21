export type Category = {
  id: string;
  name: string;
  icon: string;
  restaurantId?: string;
  sortOrder?: number;
  active?: boolean;
};

export type Product = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  image: string;
  featured?: boolean;
  prepTime: string;
  active?: boolean;
  soldOut?: boolean;
  weight?: string;
  ingredients?: string;
  allergens?: string;
  vatRate?: number;
  bestseller?: boolean;
  isNew?: boolean;
  sortOrder?: number;
  recommendationIds?: string[];
  optionGroups?: ProductOptionGroup[];
};

export type ScheduleDay = {
  day: number;
  enabled: boolean;
  openingTime: string;
  closingTime: string;
};

export type DeliveryZone = {
  id: string;
  restaurantId?: string;
  name: string;
  areas: string[];
  deliveryFee: number;
  active: boolean;
  sortOrder: number;
};

export type ProductOption = {
  id: string;
  name: string;
  priceDelta: number;
  multiplyByProductQuantity: boolean;
  active: boolean;
  sortOrder: number;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  active: boolean;
  sortOrder: number;
  options: ProductOption[];
};

export type SelectedProductOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
  quantity: number;
  multiplyByProductQuantity: boolean;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  schedule: string;
  deliveryTime: string;
  rating: number;
};

export type CurrentRestaurant = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  isActive: boolean;
  status: "trial" | "active" | "suspended" | "deleted";
  trialActive: boolean;
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
  contractSigned: boolean;
  trialExpired: boolean;
  accessLocked: boolean;
};

export type CartItem = {
  lineId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedProductOption[];
};

export const ORDER_STATUSES = [
  "Nouă",
  "Acceptată",
  "În preparare",
  "În livrare",
  "Finalizată",
  "Anulată",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = "cash" | "card";
export type OrderType = "delivery" | "pickup";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type DeliveryLocation = GeoPoint & {
  formattedAddress: string;
  placeId?: string;
};

export type DeliveryTracking = {
  courierLocation?: GeoPoint;
  lastUpdatedAt?: string;
};

export type CustomerDetails = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  deliveryLocation?: DeliveryLocation;
  notes: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedOptions: SelectedProductOption[];
};

export type Order = {
  id: string;
  orderNumber: string;
  restaurantId: string;
  createdAt: string;
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  tracking?: DeliveryTracking;
  status: OrderStatus;
  estimatedMinutes: number | null;
  acceptedAt: string | null;
  preparationStartedAt: string | null;
  deliveryStartedAt: string | null;
  completedAt: string | null;
};

export type CreateOrderInput = {
  restaurantId: string;
  customer: CustomerDetails;
  items: CartItem[];
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
};

export type RestaurantSettings = {
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderValue: number;
  estimatedDeliveryTime: string;
  blockOrdersOutsideSchedule: boolean;
  schedule: ScheduleDay[];
  deliveryZones: DeliveryZone[];
  openingTime: string;
  closingTime: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  highlightDelayedOrders: boolean;
};

export const USER_ROLES = [
  "customer",
  "restaurant_owner",
  "super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  restaurantId: string | null;
  createdAt: string;
};

export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor?: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalRevenue?: number;
  companyName?: string;
  vatCui?: string;
  city?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: "trial" | "active" | "suspended" | "deleted";
  trialActive?: boolean;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  contractSigned?: boolean;
};

export type AdminRestaurantDetails = AdminRestaurant & {
  address: string;
  phone: string;
  email: string;
  clientUrl: string;
  dashboardUrl: string;
  qrUrl: string;
  categories: Array<{
    id: string;
    name: string;
    active: boolean;
    sortOrder: number;
  }>;
  products: Array<{
    id: string;
    name: string;
    categoryName: string;
    price: number;
    active: boolean;
    soldOut: boolean;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
  }>;
};

export type RestaurantOnboardingResult = {
  restaurantId: string;
  slug: string;
  clientUrl: string;
  dashboardUrl: string;
  qrUrl: string;
  ownerRequiresEmailConfirmation: boolean;
};

export type RestaurantOnboardingInput = {
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  workingDays: number[];
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

export type OwnerSelfRegistrationInput = {
  contactName: string;
  phone: string;
  email: string;
  restaurantName: string;
  companyName: string;
  vatCui: string;
  city: string;
  address: string;
  password: string;
  confirmPassword: string;
};

export type ProductInput = {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  weight: string;
  ingredients: string;
  allergens: string;
  prepTime: string;
  vatRate: number;
  active: boolean;
  soldOut: boolean;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  sortOrder: number;
  imageUrl?: string;
  recommendationIds: string[];
};

export const PROMOTION_TYPES = [
  "first_order",
  "loyalty",
  "product_discount",
  "happy_hour",
  "custom",
] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number];

export type Promotion = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  type: PromotionType;
  discountPercent: number;
  triggerOrderNumber: number | null;
  startsAt: string | null;
  endsAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  sortOrder: number;
  productIds: string[];
};

export type PromotionInput = Omit<Promotion, "id" | "restaurantId">;
