import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#34d399",
          fontSize: 34,
          fontWeight: 800,
          borderRadius: 16,
          border: "2px solid #27272a",
        }}
      >
        F
      </div>
    ),
    {
      ...size,
    }
  );
}
