"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { ArrowLeftIcon, CartIcon } from "@/components/icons";
import { formatPrice, restaurant } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useOrders } from "@/features/orders/order-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { AddressAutocomplete } from "@/features/checkout/address-autocomplete";
import type {
  CustomerDetails,
  DeliveryLocation,
  OrderType,
  PaymentMethod,
} from "@/lib/types";
import { getGoogleMapsApiKey } from "@/lib/google-maps";

const initialCustomer: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof CustomerDetails, string>>;

export function CheckoutPage() {
  const router = useRouter();
  const { items, total: subtotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { settings, restaurantOpen } = useRestaurantSettings();
  const [customer, setCustomer] = useState(initialCustomer);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const availableOrderTypes: OrderType[] = [
    ...(settings.acceptsDelivery ? (["delivery"] as const) : []),
    ...(settings.acceptsPickup ? (["pickup"] as const) : []),
  ];
  const availablePaymentMethods: PaymentMethod[] = [
    ...(settings.acceptsCash ? (["cash"] as const) : []),
    ...(settings.acceptsCard ? (["card"] as const) : []),
  ];
  const selectedOrderType = availableOrderTypes.includes(orderType)
    ? orderType
    : availableOrderTypes[0];
  const selectedPaymentMethod = availablePaymentMethods.includes(paymentMethod)
    ? paymentMethod
    : availablePaymentMethods[0];
  const deliveryFee =
    selectedOrderType === "delivery" &&
    (settings.freeDeliveryThreshold <= 0 ||
      subtotal < settings.freeDeliveryThreshold)
      ? settings.deliveryFee
      : 0;
  const total = subtotal + deliveryFee;

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
    if (customer.name.trim().length < 2) {
      nextErrors.name = "Introdu numele complet.";
    }
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
      !restaurantOpen ||
      !selectedOrderType ||
      !selectedPaymentMethod ||
      !validate()
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        restaurantId: restaurant.id,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address:
            selectedOrderType === "delivery" ? customer.address.trim() : "",
          deliveryLocation:
            selectedOrderType === "delivery"
              ? customer.deliveryLocation
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
        reason instanceof Error
          ? reason.message
          : "Comanda nu a putut fi trimisă. Încearcă din nou.",
      );
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <main className="page-enter grid min-h-screen place-items-center px-6 pb-28 text-center">
        <div>
          <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-[#fff1e9] text-[#ff5a1f]">
            <CartIcon className="size-11" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">
            Coșul este gol
          </h1>
          <p className="mt-2 text-sm text-[#7a746e]">
            Adaugă produse înainte de a continua către checkout.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex rounded-2xl bg-[#ff5a1f] px-7 py-4 text-sm font-black text-white"
          >
            Înapoi la meniu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter min-h-screen bg-[#f8f5f2] pb-28">
      <header className="border-b border-[#eee9e4] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/"
            className="grid size-11 place-items-center rounded-full bg-[#f5f2ef]"
            aria-label="Înapoi la meniu"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
              Ultimul pas
            </p>
            <h1 className="text-2xl font-black tracking-[-0.04em]">Checkout</h1>
          </div>
        </div>
      </header>

      <form
        onSubmit={submitOrder}
        className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-start"
      >
        <div className="space-y-5">
          <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_35px_rgba(32,21,13,0.05)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
              Tip comandă
            </p>
            <h2 className="mt-1 text-xl font-black">Cum primești comanda?</h2>
            {availableOrderTypes.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {settings.acceptsDelivery && (
                  <ChoiceOption
                    active={selectedOrderType === "delivery"}
                    title="Livrare"
                    detail={`Taxă ${formatPrice(settings.deliveryFee)}`}
                    onClick={() => setOrderType("delivery")}
                  />
                )}
                {settings.acceptsPickup && (
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
              <p className="mt-4 rounded-xl bg-[#fff4ed] px-4 py-3 text-sm font-bold text-[#9a3c17]">
                Comanda va fi ridicată din locație.
              </p>
            )}
          </section>

          <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_35px_rgba(32,21,13,0.05)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
              Date contact
            </p>
            <h2 className="mt-1 text-xl font-black">
              {selectedOrderType === "pickup"
                ? "Cine ridică?"
                : "Unde livrăm?"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nume"
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
                  className="mt-2 w-full resize-none rounded-2xl border border-[#e6e0db] bg-[#fcfaf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa39d] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_35px_rgba(32,21,13,0.05)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
              Plată
            </p>
            <h2 className="mt-1 text-xl font-black">Cum dorești să plătești?</h2>
            {availablePaymentMethods.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {settings.acceptsCash && (
                  <PaymentOption
                    active={selectedPaymentMethod === "cash"}
                    title="Cash"
                    detail={selectedOrderType === "pickup" ? "La ridicare" : "La livrare"}
                    icon="💵"
                    onClick={() => setPaymentMethod("cash")}
                  />
                )}
                {settings.acceptsCard && (
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
              <p className="mt-3 rounded-xl bg-[#fff7e8] px-4 py-3 text-xs leading-5 text-[#855a15]">
                Plata cu cardul este simulată momentan. Nu vor fi solicitate date bancare.
              </p>
            )}
          </section>
        </div>

        <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_35px_rgba(32,21,13,0.07)] lg:sticky lg:top-5">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
            Rezumat
          </p>
          <h2 className="mt-1 text-xl font-black">Comanda ta</h2>
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={item.lineId} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#fff6ec]">
                  <Image
                    src={item.product.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{item.product.name}</p>
                  <p className="text-xs text-[#7a746e]">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                  {item.selectedOptions.length > 0 && (
                    <p className="mt-1 text-[10px] leading-4 text-[#8b8580]">
                      {item.selectedOptions
                        .map((option) => option.optionName)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-black">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="my-5 h-px bg-[#eee9e4]" />
          <div className="space-y-3 text-sm">
            <PriceRow label="Subtotal" value={subtotal} />
            <PriceRow
              label={
                selectedOrderType === "pickup"
                  ? "Ridicare"
                  : "Taxă livrare"
              }
              value={deliveryFee}
            />
            <div className="flex items-center justify-between pt-2">
              <span className="font-black">Total</span>
              <span className="text-2xl font-black text-[#ff5a1f]">
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              submitting ||
              !restaurantOpen ||
              !selectedOrderType ||
              !selectedPaymentMethod
            }
            className="mt-5 w-full rounded-2xl bg-[#ff5a1f] px-5 py-4 font-black text-white shadow-xl shadow-[#ff5a1f]/20 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Se trimite..." : `Trimite comanda · ${formatPrice(total)}`}
          </button>
          {!restaurantOpen && (
            <UnavailableMessage
              text={`Restaurantul este închis. Comenzile pot fi trimise între ${settings.openingTime} și ${settings.closingTime}.`}
            />
          )}
          {submitError && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-700">
              {submitError}
            </p>
          )}
          <p className="mt-3 text-center text-[11px] leading-4 text-[#a19a94]">
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
        active
          ? "border-[#ff5a1f] bg-[#fff4ed] ring-2 ring-[#ff5a1f]/10"
          : "border-[#e6e0db] bg-white"
      }`}
    >
      <span className="block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs text-[#7a746e]">{detail}</span>
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
  inputMode?: "tel";
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
        className={`mt-2 w-full rounded-2xl border bg-[#fcfaf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa39d] focus:ring-4 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-[#e6e0db] focus:border-[#ff5a1f] focus:ring-[#ff5a1f]/10"
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
        active
          ? "border-[#ff5a1f] bg-[#fff4ed] ring-2 ring-[#ff5a1f]/10"
          : "border-[#e6e0db] bg-white"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="mt-3 block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs text-[#7a746e]">{detail}</span>
    </button>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[#6f6862]">
      <span>{label}</span>
      <span className="font-bold text-[#171411]">{formatPrice(value)}</span>
    </div>
  );
}
