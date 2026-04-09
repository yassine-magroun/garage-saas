"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#08090D",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#FF6B2B" }}>⚡ MecaniGo</div>
        <div style={{ fontSize: "14px", color: "#8B8FA8", marginTop: "4px" }}>Créez votre compte en 2 minutes</div>
      </div>
      <SignUp />
    </div>
  );
}
