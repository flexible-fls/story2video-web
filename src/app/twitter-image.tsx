import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #09090b 0%, #111827 55%, #0f172a 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#34d399",
            fontWeight: 700,
          }}
        >
          FulushouVideo
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              lineHeight: 1.15,
              fontWeight: 800,
              maxWidth: 860,
            }}
          >
            AI Drama & Comic Video Studio
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#d4d4d8",
              maxWidth: 900,
              lineHeight: 1.45,
            }}
          >
            Turn standard scripts into storyboard, AI titles, hook copy, and preview-ready outputs.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "#a1a1aa",
          }}
        >
          <div>AI Script Parsing</div>
          <div>•</div>
          <div>Storyboard</div>
          <div>•</div>
          <div>Video Preview</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
