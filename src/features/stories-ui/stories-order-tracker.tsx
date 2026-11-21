"use client";

import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { CheckIcon, PhoneIcon } from "@/features/stories-ui/stories-icons";
import {
  getEstimatedReadyTime,
  getOrderProgressRatio,
  getOrderProgressSteps,
} from "@/lib/order-progress";
import { orderStatusLabel } from "@/lib/order-status-label";
import { toTelHref } from "@/lib/phone";
import type { Order } from "@/lib/types";

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Urmărirea comenzii active, în varianta „Stories”. Doar afișare:
 * statusurile vin din dashboard, exact ca în lista clasică de comenzi.
 */
export function StoriesOrderTracker({ order }: { order: Order }) {
  const { currentRestaurant } = useRestaurant();
  const accent = currentRestaurant?.primaryColor || "#173A2E";
  const steps = getOrderProgressSteps(order);
  const ratio = getOrderProgressRatio(order);
  const eta = getEstimatedReadyTime(order);
  const callHref = toTelHref(currentRestaurant?.phone);
  const label = orderStatusLabel(order);
  const image = order.items.find((item) => item.image)?.image;

  return (
    <section
      aria-label="Comanda în curs"
      className="stories-rise mt-6 overflow-hidden rounded-[28px] text-white shadow-[0_20px_40px_rgba(14,31,25,.25)]"
      style={{ backgroundColor: accent }}
    >
      <div className="flex items-center justify-between px-5 pt-5 text-[13px] font-bold opacity-80">
        <span>Comanda {order.orderNumber}</span>
        <span>{formatPrice(order.total)}</span>
      </div>
      <div className="relative mx-auto mt-3 size-[210px]">
        <svg viewBox="0 0 210 210" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="105" cy="105" r={RADIUS} stroke="rgba(255,255,255,.14)" strokeWidth="12" fill="none" />
          <circle
            cx="105"
            cy="105"
            r={RADIUS}
            stroke="#E3B33C"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div className="stories-breathe absolute inset-[38px] overflow-hidden rounded-full bg-white/10">
          {image && <SafeImage src={image} alt="" fallbackLabel={order.orderNumber} fill className="object-cover" sizes="134px" />}
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#E3B33C]">{label}</p>
        {eta ? (
          <>
            <p className="mt-1 text-[40px] font-semibold leading-none" style={{ fontFamily: "var(--font-fraunces)" }}>{eta}</p>
            <p className="mt-1 text-[13px] font-semibold opacity-75">
              {order.orderType === "pickup" ? "ora estimată pentru ridicare" : "ora estimată de livrare"}
            </p>
          </>
        ) : (
          <p className="mt-2 px-6 text-[14px] font-semibold opacity-80">Restaurantul confirmă comanda și îți spune cât durează.</p>
        )}
      </div>

      <ol className="mx-4 mb-4 mt-5 rounded-[22px] bg-white p-5 text-[#14161C]">
        {steps.map((step, index) => (
          <li key={step.key} className={`relative flex gap-3.5 ${index < steps.length - 1 ? "pb-4" : ""}`}>
            {index < steps.length - 1 && (
              <span className="absolute bottom-0 left-[12px] top-[26px] w-0.5" style={{ backgroundColor: step.state === "done" ? accent : "#E2DDD2" }} />
            )}
            <span
              className={`relative grid size-[26px] shrink-0 place-items-center rounded-full ${step.state === "current" ? "stories-pulse-ring" : ""}`}
              style={
                step.state === "done" ? { backgroundColor: accent, color: "#fff" }
                : step.state === "current" ? { backgroundColor: "#E3B33C" }
                : { backgroundColor: "#F1EEE7" }
              }
            >
              {step.state === "done" && <CheckIcon className="size-3.5" />}
            </span>
            <span className={`pt-0.5 text-[14.5px] font-bold ${step.state === "todo" ? "text-[#8A857B]" : ""}`}>{step.label}</span>
          </li>
        ))}
      </ol>
      {callHref && (
        <a href={callHref} className="mx-4 mb-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/12 text-[14px] font-bold" style={{ backgroundColor: "rgba(255,255,255,.12)" }}>
          <PhoneIcon className="size-[17px]" />
          Sună restaurantul
        </a>
      )}
    </section>
  );
}
