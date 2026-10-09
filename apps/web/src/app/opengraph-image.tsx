import { ImageResponse } from "next/og";

export const alt = "Borocean — Hisse analizi, portföy takibi ve AI raporları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social/search preview image: logomark, name and tagline on the brand gradient. */
export default function OpengraphImage() {
  const bars = [
    { x: 0, h: 120, o: 0.35 },
    { x: 70, h: 190, o: 0.68 },
    { x: 140, h: 260, o: 1 },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #0A0B0D 0%, #173A8A 100%)",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", height: 260, gap: 0 }}>
          {bars.map((b) => (
            <div
              key={b.x}
              style={{
                width: 44,
                height: b.h,
                marginRight: 26,
                borderRadius: 12,
                background: "#FFFFFF",
                opacity: b.o,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 40 }}>Borocean</div>
        <div style={{ fontSize: 38, opacity: 0.85, marginTop: 8 }}>
          Hisse analizi, portföy takibi ve AI raporları
        </div>
      </div>
    ),
    { ...size }
  );
}
