"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, CartIcon, TrashIcon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useOrders } from "@/features/orders/order-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import {
  resolveDeliveryZone,
  restaurantSettings,
} from "@/features/settings/restaurant-settings";
import { AddressAutocomplete } from "@/features/checkout/address-autocomplete";
import type {
  CustomerDetails,
  DeliveryLocation,
  OrderType,
  PaymentMethod,
  Product,
} from "@/lib/types";
import { getGoogleMapsApiKey } from "@/lib/google-maps";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { calculateCartItemTotal } from "@/lib/cart-pricing";
import { addMoney } from "@/lib/money";
import { useAuth } from "@/features/auth/auth-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import {
  getDatabaseCustomerProfile,
  getLocalCustomerAddresses,
  getLocalCustomerProfile,
  saveDatabaseCustomerAddress,
  saveDatabaseCustomerProfile,
  saveLocalCustomerAddresses,
  saveLocalCustomerProfile,
} from "@/services/customer-profile-service";

const initialCustomer: CustomerDetails = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof CustomerDetails, string>>;

export function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total: subtotal, clearCart, removeItem, addItem } = useCart();
  const { createOrder } = useOrders();
  const { settings, restaurantOpen } = useRestaurantSettings();
  const { products } = useCatalog();
  const { currentRestaurant } = useRestaurant();
  const fallbackRestaurantId = items[0]?.product.restaurantId;
  const orderRestaurantId = currentRestaurant?.id ?? fallbackRestaurantId;
  const checkoutSettings = currentRestaurant ? settings : restaurantSettings;
  const checkoutRestaurantOpen = currentRestaurant ? restaurantOpen : true;
  const menuUrl = currentRestaurant
    ? `/clienti/${currentRestaurant.slug}`
    : "/";
  const accessLocked = Boolean(currentRestaurant?.accessLocked);
  const lockedMessage =
    "Perioada gratuita a expirat. Contacteaza ANTORIA pentru activarea contului.";
  const [customer, setCustomer] = useState<CustomerDetails>(initialCustomer);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = getLocalCustomerProfile();
      const defaultAddress = getLocalCustomerAddresses().find(
        (address) => address.isDefault,
      );
      if (!saved && !defaultAddress) return;
      setCustomer((current) => ({
        ...current,
        ...saved,
        address: defaultAddress?.address || saved?.address || current.address,
        deliveryLocation:
          defaultAddress?.latitude !== undefined &&
          defaultAddress.longitude !== undefined
            ? {
                formattedAddress: defaultAddress.address,
                latitude: defaultAddress.latitude,
                longitude: defaultAddress.longitude,
                placeId: defaultAddress.placeId,
              }
            : current.deliveryLocation,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getDatabaseCustomerProfile()
      .then((profile) => {
        if (!active || !profile) return;
        setCustomer((current) => ({
          ...current,
          name: profile.name || current.name,
          phone: profile.phone || current.phone,
          email: profile.email || current.email,
          address: profile.address || current.address,
        }));
        saveLocalCustomerProfile(profile);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);
  const availableOrderTypes: OrderType[] = [
    ...(checkoutSettings.acceptsDelivery ? (["delivery"] as const) : []),
    ...(checkoutSettings.acceptsPickup ? (["pickup"] as const) : []),
  ];
  const availablePaymentMethods: PaymentMethod[] = [
    ...(checkoutSettings.acceptsCash ? (["cash"] as const) : []),
    ...(checkoutSettings.acceptsCard ? (["card"] as const) : []),
  ];
  const selectedOrderType = availableOrderTypes.includes(orderType) ?
     orderType
    : availableOrderTypes[0];
  const selectedPaymentMethod = availablePaymentMethods.includes(paymentMethod) ?
     paymentMethod
    : availablePaymentMethods[0];
  const selectedDeliveryZone =
    selectedOrderType === "delivery" ?
       resolveDeliveryZone(checkoutSettings, customer.address)
      : undefined;
  const baseDeliveryFee =
    selectedDeliveryZone?.deliveryFee ?? checkoutSettings.deliveryFee;
  const deliveryFee =
    selectedOrderType === "delivery" &&
    (checkoutSettings.freeDeliveryThreshold <= 0 ||
      subtotal < checkoutSettings.freeDeliveryThreshold) ?
       baseDeliveryFee
      : 0;
  const total = addMoney(subtotal, deliveryFee);
  const freeDeliveryUnlocked =
    selectedOrderType === "delivery" &&
    checkoutSettings.freeDeliveryThreshold > 0 &&
    subtotal >= checkoutSettings.freeDeliveryThreshold;
  const minimumReached =
    checkoutSettings.minimumOrderValue <= 0 ||
    subtotal >= checkoutSettings.minimumOrderValue;
  const checkoutUpsells = getCheckoutUpsells(items, products);

  const updateField = (field: keyof CustomerDetails, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const updateAddress = useCallback(
    (address: string, deliveryLocation?: DeliveryLocation) => {
      setCustomer((current) => ({
        ...current,
        address,
        deliveryLocation,
      }));
      setErrors((current) => ({ ...current, address: undefined }));
    },
    [],
  );

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!/^[0-9+\s()-]{8,16}$/.test(customer.phone.trim())) {
      nextErrors.phone = "Introdu un număr de telefon valid.";
    }
    if (
      selectedOrderType === "delivery" &&
      customer.address.trim().length < 8
    ) {
      nextErrors.address = "Introdu adresa completă de livrare.";
    } else if (
      selectedOrderType === "delivery" &&
      getGoogleMapsApiKey() &&
      !customer.deliveryLocation
    ) {
      nextErrors.address = "Selectează o adresă din sugestiile Google.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !items.length ||
      !orderRestaurantId ||
      !checkoutRestaurantOpen ||
      !selectedOrderType ||
      !selectedPaymentMethod ||
      !validate()
    ) {
      return;
    }
    if (!minimumReached) {
      setSubmitError(
        `Comanda minimă este ${formatPrice(checkoutSettings.minimumOrderValue)}.`,
      );
      return;
    }
    if (accessLocked) {
      setSubmitError(lockedMessage);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const savedProfile = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim() ?? "",
        address:
          selectedOrderType === "delivery" ? customer.address.trim() : "",
      };
      saveLocalCustomerProfile(savedProfile);
      if (user) {
        await saveDatabaseCustomerProfile({
          ...savedProfile,
          name: savedProfile.name || "Client",
        }).catch(() => undefined);
      }
      if (selectedOrderType === "delivery" && savedProfile.address) {
        const existingAddresses = getLocalCustomerAddresses();
        const matchingAddress = existingAddresses.find(
          (item) => item.address === savedProfile.address,
        );
        const rememberedAddress = {
          id: matchingAddress?.id ?? `local-${crypto.randomUUID()}`,
          label: matchingAddress?.label ?? "Ultima livrare",
          address: savedProfile.address,
          latitude: customer.deliveryLocation?.latitude,
          longitude: customer.deliveryLocation?.longitude,
          placeId: customer.deliveryLocation?.placeId,
          isDefault: true,
        };
        const nextAddresses = [
          ...existingAddresses
            .filter((item) => item.id !== rememberedAddress.id)
            .map((item) => ({ ...item, isDefault: false })),
          rememberedAddress,
        ];
        saveLocalCustomerAddresses(nextAddresses);
        if (user) {
          await saveDatabaseCustomerAddress(rememberedAddress).catch(
            () => undefined,
          );
        }
      }
      const order = await createOrder({
        restaurantId: orderRestaurantId,
        customer: {
          name: customer.name.trim() || "Client",
          phone: customer.phone.trim(),
          email: customer.email?.trim() ?? "",
          address:
            selectedOrderType === "delivery" ? customer.address.trim() : "",
          deliveryLocation:
            selectedOrderType === "delivery" ?
               customer.deliveryLocation
              : undefined,
          notes: customer.notes.trim(),
        },
        items,
        deliveryFee,
        paymentMethod: selectedPaymentMethod,
        orderType: selectedOrderType,
      });
      clearCart();
      router.push(`/comenzi?plasata=${encodeURIComponent(order.orderNumber)}`);
    } catch (reason) {
      setSubmitError(
        reason instanceof Error ?
           reason.message
          : "Comanda nu a putut fi trimisă. Încearcă din nou.",
      );
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <main className="page-enter grid min-h-screen place-items-center px-6 pb-28 text-center">
        <div>
          <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-[#ecfeff] text-[#2563eb]">
            <CartIcon className="size-11" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">
            Coșul este gol
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Adaugă produse înainte de a continua către checkout.
          </p>
          <Link
            href={menuUrl}
            className="mt-7 inline-flex rounded-2xl bg-[#2563eb] px-7 py-4 text-sm font-black text-white"
          >
            Înapoi la meniu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter min-h-screen bg-[#f8fafc] pb-28">
      <header className="border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href={menuUrl}
            className="grid size-11 place-items-center rounded-full bg-[#f1f5f9]"
            aria-label="Înapoi la meniu"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600">
              Ultimul pas
            </p>
            <h1 className="text-2xl font-black tracking-[-0.04em]">
              Finalizare comandă
            </h1>
          </div>
        </div>
      </header>

      <form
        onSubmit={submitOrder}
        className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-start"
      >
        <div className="space-y-5">
          <section className="antoria-card rounded-[1.75rem] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
              Tip comandă
            </p>
            <h2 className="mt-1 text-xl font-black">Cum primești comanda?</h2>
            {availableOrderTypes.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {checkoutSettings.acceptsDelivery && (
                  <ChoiceOption
                    active={selectedOrderType === "delivery"}
                    title="Livrare"
                    detail={`Taxă ${formatPrice(checkoutSettings.deliveryFee)}`}
                    onClick={() => setOrderType("delivery")}
                  />
                )}
                {checkoutSettings.acceptsPickup && (
                  <ChoiceOption
                    active={selectedOrderType === "pickup"}
                    title="Ridicare din locație"
                    detail="Fără taxă de livrare"
                    onClick={() => setOrderType("pickup")}
                  />
                )}
              </div>
            ) : (
              <UnavailableMessage text="Restaurantul nu acceptă momentan comenzi pentru livrare sau ridicare." />
            )}
            {selectedOrderType === "pickup" && (
              <p className="mt-4 rounded-xl bg-[#eff6ff] px-4 py-3 text-sm font-bold text-[#1e40af]">
                Comanda va fi ridicată din locație.
              </p>
            )}
          </section>

          {selectedOrderType === "delivery" && selectedDeliveryZone && (
            <p className="rounded-2xl bg-[#ecfeff] px-4 py-3 text-sm font-bold text-[#0e7490]">
              Zona detectată: {selectedDeliveryZone.name} · taxă{" "}
              {formatPrice(selectedDeliveryZone.deliveryFee)}
            </p>
          )}

          <section className="antoria-card rounded-[1.75rem] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
              Date contact
            </p>
            <h2 className="mt-1 text-xl font-black">
              {selectedOrderType === "pickup" ?
                 "Cine ridică?"
                : "Unde livrăm?"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nume opțional"
                value={customer.name}
                onChange={(value) => updateField("name", value)}
                error={errors.name}
                placeholder="Ex: Andrei Popescu"
                autoComplete="name"
              />
              <Field
                label="Telefon"
                value={customer.phone}
                onChange={(value) => updateField("phone", value)}
                error={errors.phone}
                placeholder="Ex: 0712 345 678"
                autoComplete="tel"
                inputMode="tel"
              />
              <Field
                label="Email opțional"
                value={customer.email ?? ""}
                onChange={(value) => updateField("email", value)}
                placeholder="Ex: client@email.ro"
                autoComplete="email"
                inputMode="email"
              />
              {selectedOrderType === "delivery" && (
                <div className="sm:col-span-2">
                <AddressAutocomplete
                  value={customer.address}
                  location={customer.deliveryLocation}
                  onChange={updateAddress}
                  error={errors.address}
                />
                </div>
              )}
              <label className="sm:col-span-2">
                <span className="text-sm font-extrabold">Observații</span>
                <textarea
                  value={customer.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Interfon, etaj, preferințe..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-sm outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                />
              </label>
            </div>
          </section>

          <section className="antoria-card rounded-[1.75rem] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
              Plată
            </p>
            <h2 className="mt-1 text-xl font-black">Cum dorești să plătești?</h2>
            {availablePaymentMethods.length ? (
              <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                {checkoutSettings.acceptsCash && (
                  <PaymentOption
                    active={selectedPaymentMethod === "cash"}
                    title="Cash"
                    detail={selectedOrderType === "pickup" ? "La ridicare" : "La livrare"}
                    icon="💵"
                    onClick={() => setPaymentMethod("cash")}
                  />
                )}
                {checkoutSettings.acceptsCard && (
                  <PaymentOption
                    active={selectedPaymentMethod === "card"}
                    title="Card"
                    detail="Simulare"
                    icon="💳"
                    onClick={() => setPaymentMethod("card")}
                  />
                )}
              </div>
            ) : (
              <UnavailableMessage text="Nu este activă nicio metodă de plată." />
            )}
            {selectedPaymentMethod === "card" && (
              <p className="mt-3 rounded-xl bg-[#ecfeff] px-4 py-3 text-xs leading-5 text-[#0e7490]">
                Plata cu cardul este simulată momentan. Nu vor fi solicitate date bancare.
              </p>
            )}
          </section>

          {checkoutUpsells.length > 0 && (
            <section className="antoria-card rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
                Clienții mai adaugă
              </p>
              <h2 className="mt-1 text-xl font-black">Completeaza comanda</h2>
              <div className="mt-5 grid gap-3 min-[390px]:grid-cols-2">
                {checkoutUpsells.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      if (product.optionGroups?.some((group) => group.required)) {
                        router.push(
                          `/produs/${product.id}?from=${encodeURIComponent("/checkout")}`,
                        );
                      } else {
                        addItem(product);
                      }
                    }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span>
                      <span className="block text-sm font-black">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-xs text-[#64748b]">
                        {formatPrice(product.price)}
                      </span>
                    </span>
                    <span className="rounded-xl bg-[#2563eb] px-3 py-2 text-xs font-black text-white">
                      Adaugă
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="antoria-card rounded-[1.75rem] p-5 lg:sticky lg:top-5">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
            Rezumat
          </p>
          <h2 className="mt-1 text-xl font-black">Comanda ta</h2>
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={item.lineId} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#f0f9ff]">
                  <SafeImage
                    src={item.product.image}
                    alt=""
                    fallbackLabel={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{item.product.name}</p>
                  <p className="text-xs text-[#64748b]">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                  {item.selectedOptions.length > 0 && (
                    <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                      {item.selectedOptions
                        .map((option) => `${option.quantity} × ${option.optionName}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-black">
                  {formatPrice(calculateCartItemTotal(item))}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"
                  aria-label={`Elimină ${item.product.name}`}
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="my-5 h-px bg-[#e2e8f0]" />
          <div className="space-y-3 text-sm">
            <PriceRow label="Subtotal" value={subtotal} />
            <PriceRow
              label={
                selectedOrderType === "pickup" ?
                   "Ridicare"
                  : "Taxă livrare"
              }
              value={deliveryFee}
            />
            {freeDeliveryUnlocked && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                Felicitări! Ai deblocat livrarea gratuită.
              </p>
            )}
            {selectedOrderType === "delivery" && (
              <p className="rounded-xl bg-[#f8fafc] px-4 py-3 text-xs font-bold text-[#64748b]">
                Estimare livrare: {checkoutSettings.estimatedDeliveryTime}
              </p>
            )}
            {!minimumReached && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-800">
                Comanda minimă este {formatPrice(checkoutSettings.minimumOrderValue)}.
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <span className="font-black">Total</span>
              <span className="text-2xl font-black text-blue-700">
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              submitting ||
              !orderRestaurantId ||
              accessLocked ||
              !checkoutRestaurantOpen ||
              !minimumReached ||
              !selectedOrderType ||
              !selectedPaymentMethod
            }
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Se trimite..." : `Trimite comanda · ${formatPrice(total)}`}
          </button>
          {!checkoutRestaurantOpen && (
            <UnavailableMessage
              text={`Restaurantul este închis. Comenzile pot fi trimise între ${checkoutSettings.openingTime} și ${checkoutSettings.closingTime}.`}
            />
          )}
          {accessLocked && <UnavailableMessage text={lockedMessage} />}
          {submitError && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-700">
              {submitError}
            </p>
          )}
          <p className="mt-3 text-center text-[11px] leading-4 text-[#94a3b8]">
            Prin trimiterea comenzii confirmi datele introduse.
          </p>
        </section>
      </form>
    </main>
  );
}

function ChoiceOption({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ?
           "border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb]/10"
          : "border-[#cbd5e1] bg-white"
      }`}
    >
      <span className="block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs text-[#64748b]">{detail}</span>
    </button>
  );
}

function UnavailableMessage({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {text}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: "tel" | "email";
}) {
  return (
    <label>
      <span className="text-sm font-extrabold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`mt-2 w-full rounded-2xl border bg-[#f8fafc] px-4 py-3 text-sm outline-none transition placeholder:text-[#94a3b8] focus:ring-4 ${
          error ?
             "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-[#cbd5e1] focus:border-[#2563eb] focus:ring-[#2563eb]/10"
        }`}
      />
      {error && <span className="mt-1.5 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function PaymentOption({
  active,
  title,
  detail,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ?
           "border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb]/10"
          : "border-[#cbd5e1] bg-white"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="mt-3 block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs text-[#64748b]">{detail}</span>
    </button>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[#64748b]">
      <span>{label}</span>
      <span className="font-bold text-[#0f172a]">{formatPrice(value)}</span>
    </div>
  );
}

function getCheckoutUpsells(
  items: ReturnType<typeof useCart>["items"],
  products: Product[],
) {
  const cartProductIds = new Set(items.map((item) => item.product.id));
  const recommendationIds = items.flatMap(
    (item) => item.product.recommendationIds ?? [],
  );
  return recommendationIds.reduce<Product[]>((result, id) => {
    if (result.some((item) => item.id === id) || cartProductIds.has(id)) {
      return result;
    }
    const product = products.find((item) => item.id === id);
    if (!product || product.active === false || product.soldOut) {
      return result;
    }
    return result.length >= 4 ? result : [...result, product];
  }, []);
}
