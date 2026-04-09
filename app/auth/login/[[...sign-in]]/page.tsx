"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,107,43,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 30% 60%, rgba(255,107,43,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 70% 30%, rgba(255,140,90,0.04) 0%, transparent 50%)
        `
      }} />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: `
          linear-gradient(rgba(255,107,43,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,43,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px"
      }} />

      {/* Logo + tagline */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #FF6B2B, #FF8C5A)", boxShadow: "0 8px 24px rgba(255,107,43,0.3)" }}
          >
            ⚡
          </div>
          <span className="text-2xl font-bold" style={{
            background: "linear-gradient(135deg, #FF6B2B, #FF8C5A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>MecaniGo</span>
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          La gestion garage, enfin simple.
        </p>
      </div>

      {/* Clerk SignIn */}
      <div className="relative z-10">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#FF6B2B",
            },
          }}
        />
      </div>

      {/* Bottom security badge */}
      <div className="relative z-10 mt-8 flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Connexion sécurisée · Données hébergées en Europe
      </div>
    </div>
  );
}
