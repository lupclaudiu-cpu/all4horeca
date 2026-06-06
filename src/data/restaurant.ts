import type { Category, Product, Restaurant } from "@/lib/types";

export const restaurant: Restaurant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "all4horeca",
  name: "ALL4HORECA",
  initials: "A4H",
  schedule: "10:00 - 23:30",
  deliveryTime: "25-35 min",
  rating: 4.8,
};

export const categories: Category[] = [
  { id: "21111111-1111-4111-8111-111111111111", name: "Burgeri", icon: "🍔" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Shaorma", icon: "🌯" },
  { id: "23333333-3333-4333-8333-333333333333", name: "Pizza", icon: "🍕" },
  { id: "24444444-4444-4444-8444-444444444444", name: "Băuturi", icon: "🥤" },
  { id: "25555555-5555-4555-8555-555555555555", name: "Desert", icon: "🍰" },
];

export const products: Product[] = [
  {
    id: "31111111-1111-4111-8111-111111111111", restaurantId: restaurant.id, categoryId: "21111111-1111-4111-8111-111111111111",
    name: "Burger Clasic", shortDescription: "Vită, cheddar, salată, roșii și sosul casei",
    description: "Chiflă brioche rumenită, carne suculentă de vită, cheddar maturat, salată crocantă, roșii și sosul nostru cremos.",
    price: 34, image: "/products/burger-classic.svg", featured: true, prepTime: "15-20 min",
  },
  {
    id: "32222222-2222-4222-8222-222222222222", restaurantId: restaurant.id, categoryId: "21111111-1111-4111-8111-111111111111",
    name: "Burger Crispy", shortDescription: "Pui crispy, coleslaw, castraveți murați și sos",
    description: "Piept de pui în crustă crocantă, coleslaw proaspăt, castraveți murați și sos ușor picant, într-o chiflă pufoasă.",
    price: 32, image: "/products/burger-crispy.svg", prepTime: "15-20 min",
  },
  {
    id: "33333333-3333-4333-8333-333333333333", restaurantId: restaurant.id, categoryId: "22222222-2222-4222-8222-222222222222",
    name: "Shaorma Pui", shortDescription: "Pui, cartofi, salată, roșii și sos de usturoi",
    description: "Lipie caldă cu pui marinat, cartofi aurii, salată verde, roșii, castraveți murați și sos de usturoi.",
    price: 29, image: "/products/shaorma.svg", featured: true, prepTime: "12-18 min",
  },
  {
    id: "34444444-4444-4444-8444-444444444444", restaurantId: restaurant.id, categoryId: "23333333-3333-4333-8333-333333333333",
    name: "Pizza Margherita", shortDescription: "Sos de roșii, mozzarella și busuioc proaspăt",
    description: "Blat copt pe vatră, sos aromat de roșii, mozzarella fină, ulei de măsline și busuioc proaspăt.",
    price: 31, image: "/products/pizza.svg", prepTime: "20-25 min",
  },
  {
    id: "35555555-5555-4555-8555-555555555555", restaurantId: restaurant.id, categoryId: "24444444-4444-4444-8444-444444444444",
    name: "Pepsi 0.5L", shortDescription: "Băutură răcoritoare, servită rece",
    description: "Pepsi 0.5L, rece. Ambalajul poate varia în funcție de stoc.",
    price: 9, image: "/products/pepsi.svg", prepTime: "Imediat",
  },
  {
    id: "36666666-6666-4666-8666-666666666666", restaurantId: restaurant.id, categoryId: "25555555-5555-4555-8555-555555555555",
    name: "Lava Cake", shortDescription: "Ciocolată intensă, interior fluid și fructe",
    description: "Prăjitură caldă de ciocolată cu miez fluid, servită cu sos de fructe de pădure.",
    price: 22, image: "/products/lava-cake.svg", featured: true, prepTime: "10-15 min",
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency", currency: "RON", maximumFractionDigits: 0,
  }).format(price);
