import type { CSSProperties } from "react";
import { Anton, Archivo_Black, Bebas_Neue } from "next/font/google";

/* Throwaway page for picking an accent. Delete once a direction is chosen —
   it renders a static replica of the hero and two rows so the real components
   and the database stay out of it. */

import type { Metadata } from "next";

/* A robots.txt Disallow only stops crawling — Google can still index a blocked
   URL it finds linked from elsewhere. Keeping this page out of results needs
   the header too. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-display-archivo" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display-bebas" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display-anton" });

/** Backgrounds are fixed at what the site already uses; only the accent moves. */
const LIGHT: Record<string, string> = {
  "--background": "#ffffff",
  "--foreground": "#0a0a0a",
  "--card": "#ffffff",
  "--card-foreground": "#0a0a0a",
  "--border": "#dcdfe4",
  "--secondary": "#f2f3f5",
  "--muted": "#f2f3f5",
  "--muted-foreground": "#5f6570",
  "--primary-foreground": "#ffffff",
};

const DARK: Record<string, string> = {
  "--background": "#000000",
  "--foreground": "#ededed",
  "--card": "#0d0d0d",
  "--card-foreground": "#ededed",
  "--border": "#2a2a2a",
  "--secondary": "#17171a",
  "--muted": "#17171a",
  "--muted-foreground": "#8f8f99",
  "--primary-foreground": "#0a0a0a",
};

type Accent = {
  key: string;
  name: string;
  pitch: string;
  light: string;
  dark: string;
  /** Contrast of the light value against white, as a fill behind white text. */
  ratio: string;
};

const ACCENTS: Accent[] = [
  {
    key: "vermillion",
    name: "Vermillion",
    pitch: "Print red-orange. Hot and competitive, and far enough from a link colour that it reads as a brand.",
    light: "#d92e0f",
    dark: "#ff6244",
    ratio: "4.8:1",
  },
  {
    key: "burnt",
    name: "Burnt orange",
    pitch: "A step warmer. More energy, slightly less weight — the softest of the four on a white page.",
    light: "#d63f00",
    dark: "#ff7a29",
    ratio: "4.6:1",
  },
  {
    key: "crimson",
    name: "Crimson",
    pitch: "Deeper and more editorial. The heaviest on white, closest to a masthead red.",
    light: "#c81e3a",
    dark: "#ff5470",
    ratio: "5.7:1",
  },
  {
    key: "emerald",
    name: "Emerald",
    pitch: "The calm option. Reads as rising rather than urgent — less shout, more credible.",
    light: "#00875a",
    dark: "#2fd196",
    ratio: "4.6:1",
  },
  {
    key: "current",
    name: "Current blue",
    pitch: "What is on the site today, for comparison.",
    light: "#0040ff",
    dark: "#5b8cff",
    ratio: "6.6:1",
  },
];

const FACES = [
  { key: "geist", label: "Geist Black (today)", family: "var(--font-geist-sans)", weight: 900 },
  { key: "archivo", label: "Archivo Black", family: "var(--font-display-archivo)", weight: 400 },
  { key: "bebas", label: "Bebas Neue", family: "var(--font-display-bebas)", weight: 400 },
  { key: "anton", label: "Anton", family: "var(--font-display-anton)", weight: 400 },
];

export default function ThemeLab() {
  return (
    <div className={`${archivo.variable} ${bebas.variable} ${anton.variable} mx-auto max-w-5xl px-4 py-10`}>
      <h1 className="text-2xl font-bold">Theme lab</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        White page and black ink are fixed. Only the accent moves. Light on the left,
        dark on the right — an accent has to hold up in both.
      </p>

      <div className="mt-10 flex flex-col gap-12">
        {ACCENTS.map((a) => (
          <section key={a.key}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-bold">{a.name}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {a.light} / {a.dark} · {a.ratio} on white
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.pitch}</p>

            <div className="mt-4 grid gap-px border border-border bg-border md:grid-cols-2">
              <Preview vars={{ ...LIGHT, "--primary": a.light, "--ring": a.light }} />
              <Preview vars={{ ...DARK, "--primary": a.dark, "--ring": a.dark }} />
            </div>
          </section>
        ))}
      </div>

      <h2 className="mt-16 text-lg font-bold">Display face</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Separate from colour. The hero is the one place a poster face earns its
        download — body text and UI stay on Geist either way.
      </p>

      <div className="mt-4 flex flex-col gap-px border border-border bg-border">
        {FACES.map((f) => (
          <div key={f.key} className="bg-background px-5 py-6">
            <span className="font-mono text-[11px] text-muted-foreground">{f.label}</span>
            <div
              style={{ fontFamily: f.family, fontWeight: f.weight }}
              className="mt-2 text-[clamp(2rem,7vw,3.75rem)] uppercase leading-[0.92] tracking-[-0.025em]"
            >
              Helioscope
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Preview({ vars }: { vars: Record<string, string> }) {
  return (
    <div style={vars as CSSProperties} className="bg-background text-foreground">
      <div className="m-3 border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground">
        Feature your business here
      </div>

      <div className="px-4 pb-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-[clamp(1.75rem,6vw,2.75rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
            Helioscope
          </span>
          <p className="text-xs text-muted-foreground">Ship changelogs your users actually read</p>
          <p className="font-mono text-[10px] text-muted-foreground">18,426 clicks</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground">
              Visit helioscope.app
            </span>
            <span className="text-[11px] text-muted-foreground">#1 opens in 13h</span>
          </div>
        </div>

        <div className="my-4 h-px bg-border" />

        <div className="grid grid-cols-2 gap-6 text-center">
          {[
            { r: 2, n: "Quill Foundry", c: "12,980" },
            { r: 3, n: "Atlas Index", c: "15,660" },
          ].map((e) => (
            <div key={e.r} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">#{e.r}</span>
              <span className="text-base font-bold uppercase leading-tight">{e.n}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{e.c} clicks</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-1.5">
          <span className="bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            Claim spot #5
          </span>
          <span className="text-[10px] text-muted-foreground">
            Free. Every spot is protected for 24 hours once it&rsquo;s taken.
          </span>
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {[
            { r: 4, n: "Beacon Metrics", c: "9,120" },
            { r: 5, n: "Atlas Index", c: "15,660" },
          ].map((e) => (
            <li key={e.r} className="flex items-center gap-3 border border-border bg-card px-3 py-2.5">
              <span className="font-mono text-xs font-bold text-muted-foreground">{e.r}</span>
              <span className="size-7 border border-border bg-secondary" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{e.n}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{e.c}</span>
              <span className="border border-border px-2 py-1 text-[10px]">Take</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
