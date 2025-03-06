import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiService } from "@/services/apiService";
import { AlertCircle, CheckCircle, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeySetupProps {
  onKeySetupComplete: (success: boolean) => void;
}

export function ApiKeySetup({ onKeySetupComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await ApiService.setupApiKey(apiKey);
      
      if (result.success) {
        setSuccess(true);
        setError(null);
        onKeySetupComplete(true);
      } else {
        setError(result.message || "Failed to setup API key");
        onKeySetupComplete(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      onKeySetupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Setup
        </CardTitle>
        <CardDescription>
          You need to provide a DeepSeek API key to use Gregify
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">API key successfully configured!</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="apiKey">DeepSeek API Key</Label>
              <Input 
                id="apiKey"
                placeholder="Enter your DeepSeek API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can get your API key from <a href="https://platform.deepseek.com/" className="text-blue-500 hover:text-blue-700" target="_blank" rel="noreferrer">DeepSeek Platform</a>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onKeySetupComplete(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !apiKey.trim()}>
          {loading ? "Setting up..." : "Save API Key"}
        </Button>
      </CardFooter>
    </Card>
  );
} 