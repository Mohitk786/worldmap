import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#0b1220",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid #d4a24c",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 8,
              height: 8,
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
