import LoginForm from "./LoginForm";
import Orbs from "@/components/Orbs";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 relative">
      <Orbs />
      <div className="relative z-[1] w-full max-w-3xl flex items-stretch gap-5 justify-center">
        {/* Visuel photoréaliste (desktop) */}
        <div className="hidden md:block relative w-[360px] rounded-[26px] overflow-hidden border border-[var(--glass-line)]">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/brand/hero-closer.mp4"
            poster="/brand/hero-closer.webp"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,14,.1),rgba(7,20,14,.78))]" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
            <p className="mono text-[11px] uppercase tracking-[.2em] opacity-85">Entraînement closing</p>
            <h2 className="display text-[26px] mt-1.5 leading-tight">Décroche, creuse,<br />close — comme un pro.</h2>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
