import { ImageResponse } from "next/og";

export const alt = "FiYield - AI-Powered DeFi Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          backgroundImage: "linear-gradient(45deg, #000000 0%, #1a1a1a 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            FiYield
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#cccccc",
              textAlign: "center",
              marginBottom: "40px",
              maxWidth: "800px",
            }}
          >
            AI-Powered DeFi Yield Optimization
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "18px",
              color: "#888888",
            }}
          >
            <span>Smart Accounts</span>
            <span>•</span>
            <span>MetaMask Integration</span>
            <span>•</span>
            <span>Up to 8.2% APY</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
