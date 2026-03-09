import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#34d399",
            fontWeight: 700,
          }}
        >
          FulushouVideo
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              lineHeight: 1.15,
              fontWeight: 800,
              maxWidth: 900,
            }}
          >
            AI 短剧与漫剧生成平台
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#d4d4d8",
              maxWidth: 920,
              lineHeight: 1.5,
            }}
          >
            从标准剧本直接生成角色、分镜、标题文案与视频预览结果
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 24,
            color: "#a1a1aa",
          }}
        >
          <div>Script Parsing</div>
          <div>•</div>
          <div>Storyboard</div>
          <div>•</div>
          <div>Hook Copy</div>
          <div>•</div>
          <div>Preview</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
