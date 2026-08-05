import { ImageResponse } from "next/og";

// Generated at build/request time so link previews never depend on a static
// asset someone forgot to export.
export const alt = "InfluDubai AI — creator intelligence for UAE & MENA";
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
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f0a1e 0%, #1e1145 55%, #2b1a63 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            ✦
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            InfluDubai AI
          </div>
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Find the right creators. Prove the return.
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.4,
            color: "#c4b5fd",
            maxWidth: 860,
          }}
        >
          Verified UAE &amp; MENA creators, AI matching, fraud detection and
          campaign analytics in one platform.
        </div>

        <div style={{ marginTop: "auto", display: "flex", gap: 32, fontSize: 24, color: "#a78bfa" }}>
          <div>Verified creators</div>
          <div>·</div>
          <div>AI matching</div>
          <div>·</div>
          <div>Real ROI</div>
        </div>
      </div>
    ),
    size,
  );
}
