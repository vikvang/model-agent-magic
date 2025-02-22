import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export const AuthView = () => {
  return (
    <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800 text-center">
      <h2 className="text-2xl font-medium tracking-tight text-white mb-4">
        Welcome to Greg
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Sign in to start gregifying your prompts
      </p>
      <div className="space-y-4">
        <SignInButton mode="modal">
          <Button className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-[#2C2C30]"
          >
            Create Account
          </Button>
        </SignUpButton>
      </div>
    </div>
  );
};
