
"use client";

import AppShell from "@/components/AppShell";
import { useTheme, type AccentColor, type ThemeMode } from "@/components/ThemeProvider";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";

const modes: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright display",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark display",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow the device settings",
    icon: Monitor,
  },
];

const accents: {
  value: AccentColor;
  label: string;
  color: string;
}[] = [
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "purple", label: "Purple", color: "#8b5cf6" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "sage", label: "Sage", color: "#6f9b83" },
];

export default function SettingsPage() {
  const { mode, accent, setMode, setAccent, mounted } = useTheme();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Settings
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Personalize your space.
          </p>
        </header>

        <section className="theme-panel rounded-3xl p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: "var(--surface-raised)",
                color: "var(--primary)",
              }}
            >
              <Sun size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Choose a display mode that is comfortable for you.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {modes.map((item) => {
              const Icon = item.icon;
              const selected = mounted && mode === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className="theme-option flex items-center gap-3 rounded-2xl p-4 text-left"
                  aria-pressed={selected}
                  onClick={() => setMode(item.value)}
                >
                  <Icon
                    size={22}
                    style={{ color: "var(--primary)" }}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {item.label}
                    </span>
                    <span
                      className="mt-1 block text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {item.description}
                    </span>
                  </span>

                  {selected && (
                    <Check
                      size={18}
                      style={{ color: "var(--primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="theme-panel mt-5 rounded-3xl p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: "var(--surface-raised)",
                color: "var(--primary)",
              }}
            >
              <Palette size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Accent Color</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Choose an accent color for HANAN's display identity.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {accents.map((item) => {
              const selected = mounted && accent === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className="theme-option flex items-center gap-3 rounded-2xl p-4"
                  aria-pressed={selected}
                  onClick={() => setAccent(item.value)}
                >
                  <span
                    className="theme-accent-dot shrink-0"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />

                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>

                  {selected && (
                    <Check
                      size={17}
                      style={{ color: "var(--primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--muted)" }}
        >
          Your preferences are saved on this device.
        </p>
      </div>
    </AppShell>
  );
}
