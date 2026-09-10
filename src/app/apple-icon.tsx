import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1220",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 108,
            height: 108,
            borderRadius: "50%",
            border: "10px solid #d4a24c",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#d4a24c",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
