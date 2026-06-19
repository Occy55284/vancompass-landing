import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#06080d",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, rgba(52,211,153,0.25), transparent 50%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          Van<span style={{ color: "#34d399" }}>Compass</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          UK van life companion map — surf, kite, fishing, wild camping &amp;
          weather
        </div>
      </div>
    ),
    { ...size }
  );
}
