import { RestaurantSelectorPage } from "@/features/public-restaurant/restaurant-selector-page";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function RestaurantDemoSelectorPage() {
  if (process.env.NODE_ENV === "development") {
    return <RestaurantSelectorPage />;
  }

  return (
    <ProtectedRoute roles={["super_admin"]}>
      <RestaurantSelectorPage />
    </ProtectedRoute>
  );
}
