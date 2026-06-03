import LoginForm from "./LoginForm";
import Orbs from "@/components/Orbs";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 relative">
      <Orbs />
      <div className="relative z-[1] w-full flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
