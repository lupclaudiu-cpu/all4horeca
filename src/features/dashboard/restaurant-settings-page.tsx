"use client";

import { useState } from "react";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { unlockNotificationSound } from "@/features/orders/notification-sound";
import type { DeliveryZone, ScheduleDay } from "@/lib/types";
import { useRestaurant } from "@/features/restaurant/restaurant-context";

const dayLabels = [
  { day: 1, label: "Luni" },
  { day: 2, label: "Marți" },
  { day: 3, label: "Miercuri" },
  { day: 4, label: "Joi" },
  { day: 5, label: "Vineri" },
  { day: 6, label: "Sâmbătă" },
  { day: 0, label: "Duminică" },
];

export function RestaurantSettingsPage() {
  const { currentRestaurant } = useRestaurant();
  const {
    settings,
    hydrated,
    loadingError,
    restaurantOpen,
    restaurantStatus,
    updateSettings,
    saveSettings,
    resetSettings,
  } = useRestaurantSettings();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const accessLocked = Boolean(currentRestaurant?.accessLocked);
  const lockedMessage =
    "Perioada gratuita a expirat. Contacteaza ANTORIA pentru activarea contului.";

  const updateNumber = (
    field: "deliveryFee" | "freeDeliveryThreshold" | "minimumOrderValue",
    value: string,
  ) => {
    updateSettings({ [field]: Math.max(0, Number(value) || 0) });
  };

  const updateSchedule = (
    day: number,
    updates: Partial<Omit<ScheduleDay, "day">>,
  ) => {
    updateSettings({
      schedule: settings.schedule.map((item) =>
        item.day === day ? { ...item, ...updates } : item,
      ),
    });
  };

  const updateZone = (zoneId: string, updates: Partial<DeliveryZone>) => {
    updateSettings({
      deliveryZones: settings.deliveryZones.map((zone) =>
        zone.id === zoneId ? { ...zone, ...updates } : zone,
      ),
    });
  };

  const addZone = () => {
    updateSettings({
      deliveryZones: [
        ...settings.deliveryZones,
        {
          id: crypto.randomUUID(),
          name: "Zonă nouă",
          areas: [],
          deliveryFee: settings.deliveryFee,
          active: true,
          sortOrder: settings.deliveryZones.length,
        },
      ],
    });
  };

  const deleteZone = (zoneId: string) => {
    updateSettings({
      deliveryZones: settings.deliveryZones.filter((zone) => zone.id !== zoneId),
    });
  };

  const save = async () => {
    if (accessLocked) {
      setMessage({ type: "error", text: lockedMessage });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings();
      setMessage({ type: "success", text: "Setarile au fost salvate." });
    } catch (reason) {
      setMessage({
        type: "error",
        text:
          reason instanceof Error ?
             reason.message
            : "Setarile nu au putut fi salvate.",
      });
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    if (accessLocked) {
      setMessage({ type: "error", text: lockedMessage });
      return;
    }
    setResetting(true);
    setMessage(null);
    try {
      await resetSettings();
      setMessage({
        type: "success",
        text: "Valorile implicite au fost restaurate si salvate.",
      });
    } catch (reason) {
      setMessage({
        type: "error",
        text:
          reason instanceof Error ?
             reason.message
            : "Valorile implicite nu au putut fi restaurate.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">
            Configurare
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            Setări restaurant
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Modificările sunt aplicate după salvare.
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-xs font-black ${
            restaurantOpen ?
               "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {restaurantOpen ? "Deschis" : restaurantStatus.label}
        </span>
      </div>

      {accessLocked && (
        <p className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          {lockedMessage}
        </p>
      )}

      <div
        className={`mt-6 grid gap-5 lg:grid-cols-2 ${
          accessLocked ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <SettingsCard title="Tipuri de comanda" subtitle="Accepta">
          <Toggle
            label="Livrare"
            checked={settings.acceptsDelivery}
            onChange={(checked) => updateSettings({ acceptsDelivery: checked })}
          />
          <Toggle
            label="Ridicare din locatie"
            checked={settings.acceptsPickup}
            onChange={(checked) => updateSettings({ acceptsPickup: checked })}
          />
        </SettingsCard>

        <SettingsCard title="Metode de plata" subtitle="Disponibile in checkout">
          <Toggle
            label="Cash"
            checked={settings.acceptsCash}
            onChange={(checked) => updateSettings({ acceptsCash: checked })}
          />
          <Toggle
            label="Card (simulare)"
            checked={settings.acceptsCard}
            onChange={(checked) => updateSettings({ acceptsCard: checked })}
          />
        </SettingsCard>

        <SettingsCard title="Program restaurant" subtitle="Program pe zile">
          <Toggle
            label="Blochează comenzile în afara programului"
            checked={settings.blockOrdersOutsideSchedule}
            onChange={(blockOrdersOutsideSchedule) =>
              updateSettings({ blockOrdersOutsideSchedule })
            }
          />
          <div className="space-y-3">
            {dayLabels.map((day) => {
              const value =
                settings.schedule.find((item) => item.day === day.day) ??
                settings.schedule[0];
              return (
                <div
                  key={day.day}
                  className="rounded-2xl border border-[#e2e8f0] p-3"
                >
                  <Toggle
                    label={day.label}
                    checked={value.enabled}
                    onChange={(enabled) => updateSchedule(day.day, { enabled })}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <TimeField
                      label="Ora deschiderii"
                      value={value.openingTime}
                      onChange={(openingTime) =>
                        updateSchedule(day.day, { openingTime })
                      }
                    />
                    <TimeField
                      label="Ora închiderii"
                      value={value.closingTime}
                      onChange={(closingTime) =>
                        updateSchedule(day.day, { closingTime })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl bg-[#f8fafc] px-4 py-3 text-xs leading-5 text-[#64748b]">
            Status curent:{" "}
            <strong>{restaurantStatus.open ? "OPEN" : "CLOSED"}</strong> ·{" "}
            {restaurantStatus.label}
          </p>
        </SettingsCard>

        <SettingsCard title="Livrare" subtitle="Taxe și praguri">
          <NumberField
            label="Taxa livrare implicita"
            value={settings.deliveryFee}
            onChange={(value) => updateNumber("deliveryFee", value)}
          />
          <NumberField
            label="Prag livrare gratuită"
            value={settings.freeDeliveryThreshold}
            onChange={(value) => updateNumber("freeDeliveryThreshold", value)}
          />
          <NumberField
            label="Valoare minimă comandă"
            value={settings.minimumOrderValue}
            onChange={(value) => updateNumber("minimumOrderValue", value)}
          />
          <TextField
            label="Timp estimat livrare"
            value={settings.estimatedDeliveryTime}
            onChange={(estimatedDeliveryTime) =>
              updateSettings({ estimatedDeliveryTime })
            }
            placeholder="30-45 min"
          />
        </SettingsCard>

        <SettingsCard title="Zone de livrare" subtitle="Zone, orașe, arii">
          <button
            type="button"
            onClick={addZone}
            className="rounded-xl bg-[#0f172a] px-4 py-3 text-xs font-black text-white"
          >
            Adaugă zonă
          </button>
          <div className="space-y-4">
            {settings.deliveryZones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-2xl border border-[#e2e8f0] p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Nume zonă"
                    value={zone.name}
                    onChange={(name) => updateZone(zone.id, { name })}
                    placeholder="Zona centrală"
                  />
                  <NumberField
                    label="Taxă livrare"
                    value={zone.deliveryFee}
                    onChange={(value) =>
                      updateZone(zone.id, {
                        deliveryFee: Math.max(0, Number(value) || 0),
                      })
                    }
                  />
                  <TextField
                    label="Orașe / zone"
                    value={zone.areas.join(", ")}
                    onChange={(value) =>
                      updateZone(zone.id, {
                        areas: value.split(",").map((area) => area.trim()),
                      })
                    }
                    placeholder="Centru, Pipera, Baneasa"
                  />
                  <NumberField
                    label="Ordine afișare"
                    value={zone.sortOrder}
                    onChange={(value) =>
                      updateZone(zone.id, {
                        sortOrder: Math.max(0, Number(value) || 0),
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Toggle
                    label="Activă"
                    checked={zone.active}
                    onChange={(active) => updateZone(zone.id, { active })}
                  />
                  <button
                    type="button"
                    onClick={() => deleteZone(zone.id)}
                    className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
            {!settings.deliveryZones.length && (
              <p className="rounded-xl bg-[#f8fafc] px-4 py-3 text-xs font-bold text-[#64748b]">
                Nu exista zone definite. Se foloseste taxa implicita de livrare.
              </p>
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Notificari comenzi" subtitle="Supabase Realtime">
          <Toggle
            label="Notificari activate"
            checked={settings.notificationsEnabled}
            onChange={(notificationsEnabled) =>
              updateSettings({ notificationsEnabled })
            }
          />
          <Toggle
            label="Sunet activat"
            checked={settings.soundEnabled}
            onChange={(soundEnabled) => {
              updateSettings({ soundEnabled });
              if (soundEnabled) void unlockNotificationSound();
            }}
          />
          <Toggle
            label="Evidentiere comenzi intarziate"
            checked={settings.highlightDelayedOrders}
            onChange={(highlightDelayedOrders) =>
              updateSettings({ highlightDelayedOrders })
            }
          />
        </SettingsCard>
      </div>

      {(message || loadingError) && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-[100] max-w-sm rounded-2xl border bg-white px-5 py-4 text-sm font-bold shadow-2xl ${
            message?.type === "success" && !loadingError ?
               "border-emerald-200 text-emerald-700"
              : "border-red-200 text-red-700"
          }`}
        >
          {message?.type === "success" && !loadingError ? "✓ " : ""}
          {loadingError || message?.text}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => void restoreDefaults()}
          disabled={!hydrated || saving || resetting || accessLocked}
          className="rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-xs font-black text-[#475569]"
        >
          {resetting ? "Se restaureaza..." : "Restaureaza valorile implicite"}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!hydrated || saving || resetting || accessLocked}
          className="rounded-xl bg-[#2563eb] px-5 py-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Se salveaza..." : "Salveaza modificarile"}
        </button>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_12px_30px_rgba(31,22,16,0.05)]">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
        {subtitle}
      </p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] px-4 py-3">
      <span className="text-sm font-bold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-[#2563eb]"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-2 flex items-center rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
        />
        <span className="pr-4 text-xs font-black text-[#64748b]">lei</span>
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#2563eb]"
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#2563eb]"
      />
    </label>
  );
}
