"use client";

import { useRestaurantSettings } from "@/features/settings/settings-context";
import { unlockNotificationSound } from "@/features/orders/notification-sound";

export function RestaurantSettingsPage() {
  const {
    settings,
    restaurantOpen,
    updateSettings,
    resetSettings,
  } = useRestaurantSettings();

  const updateNumber = (
    field: "deliveryFee" | "freeDeliveryThreshold",
    value: string,
  ) => {
    updateSettings({ [field]: Math.max(0, Number(value) || 0) });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a1f]">
            Configurare
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            Setări Restaurant
          </h1>
          <p className="mt-2 text-sm text-[#7b756f]">
            Opțiunile se salvează automat pe acest dispozitiv.
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-xs font-black ${
            restaurantOpen
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {restaurantOpen ? "Restaurant deschis" : "Restaurant închis"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SettingsCard title="Tipuri de comandă" subtitle="Acceptă">
          <Toggle
            label="Livrare"
            checked={settings.acceptsDelivery}
            onChange={(checked) => updateSettings({ acceptsDelivery: checked })}
          />
          <Toggle
            label="Ridicare din locație"
            checked={settings.acceptsPickup}
            onChange={(checked) => updateSettings({ acceptsPickup: checked })}
          />
        </SettingsCard>

        <SettingsCard title="Metode de plată" subtitle="Disponibile în checkout">
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

        <SettingsCard
          title="Configurare livrare"
          subtitle="Valori exprimate în lei"
        >
          <NumberField
            label="Taxă livrare"
            value={settings.deliveryFee}
            onChange={(value) => updateNumber("deliveryFee", value)}
          />
          <NumberField
            label="Prag livrare gratuită"
            value={settings.freeDeliveryThreshold}
            onChange={(value) => updateNumber("freeDeliveryThreshold", value)}
          />
        </SettingsCard>

        <SettingsCard title="Program restaurant" subtitle="Program zilnic">
          <div className="grid grid-cols-2 gap-3">
            <TimeField
              label="Oră deschidere"
              value={settings.openingTime}
              onChange={(openingTime) => updateSettings({ openingTime })}
            />
            <TimeField
              label="Oră închidere"
              value={settings.closingTime}
              onChange={(closingTime) => updateSettings({ closingTime })}
            />
          </div>
          <p className="rounded-xl bg-[#f8f5f2] px-4 py-3 text-xs leading-5 text-[#6f6862]">
            Când locația este închisă, meniul rămâne vizibil, dar clientul nu
            poate trimite comanda.
          </p>
        </SettingsCard>

        <SettingsCard
          title="Notificări comenzi"
          subtitle="Supabase Realtime"
        >
          <Toggle
            label="Notificări activate"
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
            label="Evidențiere comenzi întârziate"
            checked={settings.highlightDelayedOrders}
            onChange={(highlightDelayedOrders) =>
              updateSettings({ highlightDelayedOrders })
            }
          />
        </SettingsCard>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={resetSettings}
          className="rounded-xl border border-[#ded8d2] bg-white px-4 py-3 text-xs font-black text-[#5f5953]"
        >
          Restaurează valorile implicite
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
      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
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
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#eee9e4] px-4 py-3">
      <span className="text-sm font-bold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-[#ff5a1f]"
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
      <div className="mt-2 flex items-center rounded-xl border border-[#e6e0db] bg-[#fcfaf8]">
        <input
          type="number"
          min="0"
          step="0.5"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
        />
        <span className="pr-4 text-xs font-black text-[#8b8580]">lei</span>
      </div>
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
        className="mt-2 w-full rounded-xl border border-[#e6e0db] bg-[#fcfaf8] px-3 py-3 text-sm outline-none focus:border-[#ff5a1f]"
      />
    </label>
  );
}
