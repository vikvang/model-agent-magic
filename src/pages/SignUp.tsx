import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");
  const [deepSeekKey, setDeepSeekKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      setError("Name, email and password fields are required");
      return;
    }

    // Validate at least one API key is provided
    if (!openAIKey && !deepSeekKey) {
      setError("At least one API key (OpenAI or DeepSeek) is required");
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
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) throw authError;

      // If successful, store API keys in the user_api_keys table
      if (authData.user) {
        // The issue is that the user record might not be fully created in the database yet
        // We need to directly link to the auth.users table instead of public.users
        
        // First, we'll check if the user_api_keys table is properly using auth.uid()
        const { error: apiKeyError } = await supabase
          .from('user_api_keys')
          .insert([
            { 
              user_id: authData.user.id,
              openai_api_key: openAIKey || null,
              deepseek_api_key: deepSeekKey || null
            }
          ]);

        if (apiKeyError) {
          console.error("API key error:", apiKeyError);
          throw new Error(`Error storing API keys: ${apiKeyError.message}`);
        }
      }

      // If successful, navigate to login
      navigate("/login");
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
              Full Name
            </label>
            <Input
              type="text"
              placeholder="John Smith"
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              OpenAI API Key (Optional)
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={openAIKey}
              onChange={(e) => setOpenAIKey(e.target.value)}
            />
            <p className="text-xs text-zinc-500">Enables GPT-4 and other OpenAI models</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              DeepSeek API Key (Optional)
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              className="bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={deepSeekKey}
              onChange={(e) => setDeepSeekKey(e.target.value)}
            />
            <p className="text-xs text-zinc-500">Enables DeepSeek Chat models</p>
          </div>

          <div className="bg-[#2C2C30] p-3 rounded-lg border border-amber-700 text-amber-400">
            <p className="text-xs">At least one API key (OpenAI or DeepSeek) is required to use the application.</p>
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