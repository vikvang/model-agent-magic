import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // If successful, navigate to login or home page
      if (data) {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium tracking-tight text-white">
              Create Account
            </h2>
          </div>
          <p className="text-sm text-zinc-400">
            Sign up to get started with Gregify
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4 mt-6">
          {error && (
            <div className="p-3 bg-[#2C2C30] rounded-lg border border-red-700 text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Email
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20 relative overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" className="text-white" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#FF6B4A] hover:text-[#FF8266] transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp; 