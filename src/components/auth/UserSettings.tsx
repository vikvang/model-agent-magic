import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, BellRing, ChevronRight, LogOut, Zap, KeyRound, Check, AlertCircle, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { PersonalInformation } from "./PersonalInformation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface for user API keys
interface UserApiKeys {
  openai_api_key?: string | null;
  deepseek_api_key?: string | null;
}

export const UserSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [open, setOpen] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);
  
  // State for API keys and their visibility
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<UserApiKeys>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load user API keys on mount
  useEffect(() => {
    if (user) {
      fetchUserApiKeys();
    }
  }, [user]);

  const fetchUserApiKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('openai_api_key, deepseek_api_key')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching API keys:", error);
      } else if (data) {
        setUserApiKeys(data);
        // Mask the keys with asterisks for display
        if (data.openai_api_key) {
          setOpenaiKey("•".repeat(16));
        }
        if (data.deepseek_api_key) {
          setDeepseekKey("•".repeat(16));
        }
      }
    } catch (error) {
      console.error("Error in fetchUserApiKeys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const handleSaveSettings = async () => {
    setSaveSuccess(false);
    setSaveError("");
    setIsLoading(true);
    
    try {
      // Only update keys that have been changed (not masked)
      const keysToUpdate: UserApiKeys = {};
      
      if (openaiKey && !openaiKey.includes("•")) {
        keysToUpdate.openai_api_key = openaiKey;
      }
      
      if (deepseekKey && !deepseekKey.includes("•")) {
        keysToUpdate.deepseek_api_key = deepseekKey;
      }
      
      // Only make an API call if there are keys to update
      if (Object.keys(keysToUpdate).length > 0) {
        // Check if a record already exists
        const { data: existingData } = await supabase
          .from('user_api_keys')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle();
        
        let result;
        
        if (existingData) {
          // Update existing record
          result = await supabase
            .from('user_api_keys')
            .update(keysToUpdate)
            .eq('user_id', user!.id);
        } else {
          // Insert new record
          result = await supabase
            .from('user_api_keys')
            .insert({
              user_id: user!.id,
              ...keysToUpdate
            });
        }
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        // Refresh the API keys after saving
        await fetchUserApiKeys();
        setSaveSuccess(true);
        
        // Close the dialog after a short delay to show success message
        setTimeout(() => {
          setOpen(false);
        }, 1000);
      } else {
        // If no keys were updated, just close the dialog
        setOpen(false);
      }
      
      // Save other settings
      console.log("Settings saved:", { notifications });
    } catch (error) {
      console.error("Error saving API keys:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save API keys");
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's full name from metadata
  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return "User";
  };

  // Generate initials from name
  const getInitials = () => {
    const name = getUserName();
    if (!name) return "U";
    
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      // Get first letter of first and last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    // If only one name, return first two letters
    return name.substring(0, 2).toUpperCase();
  };

  // Check if provider keys exist
  const hasOpenAIKey = !!userApiKeys.openai_api_key;
  const hasDeepSeekKey = !!userApiKeys.deepseek_api_key;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-zinc-400 bg-transparent border-0 p-1 cursor-pointer hover:text-white transition-colors duration-200"
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          style={{
            textShadow: settingsHovered ? "0 0 8px rgba(255, 255, 255, 0.6)" : "none"
          }}
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="w-[400px] bg-[#121212] text-white p-0 rounded-xl border-0 shadow-xl max-h-[600px] overflow-hidden">
        <div className="p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: "600px" }}>
          <div className="flex items-center mb-6">
            <Avatar className="h-14 w-14 bg-[#FF6B4A] text-white mr-4 flex items-center justify-center">
              <AvatarFallback className="bg-[#FF6B4A] text-white font-semibold">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {getUserName()}
              </h3>
              <p className="text-sm text-gray-400">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {/* Account Settings Section */}
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#1a1a1a]">
              <h2 className="text-lg font-medium px-4 py-3 border-b border-[#2a2a2a]">Account Settings</h2>
              
              <div className="divide-y divide-[#2a2a2a]">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between px-4 py-3 h-auto rounded-none text-gray-200 hover:text-white hover:bg-opacity-10 hover:bg-white transition-all duration-200 group"
                  onClick={() => setPersonalInfoOpen(true)}
                >
                  <div className="flex items-center">
                    <User size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                    <span>Personal Information</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-white transition-all duration-200" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto rounded-none text-gray-200 hover:text-white hover:bg-opacity-10 hover:bg-white transition-all duration-200 group">
                  <div className="flex items-center">
                    <Lock size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-white transition-all duration-200" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto rounded-none text-gray-200 hover:text-white hover:bg-opacity-10 hover:bg-white transition-all duration-200 group">
                  <div className="flex items-center">
                    <Mail size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                    <span>Email Preferences</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-white transition-all duration-200" />
                </Button>

                <div className="flex items-center justify-between px-4 py-3 group hover:bg-opacity-10 hover:bg-white transition-all duration-200">
                  <div className="flex items-center">
                    <BellRing size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                    <span className="text-gray-200 group-hover:text-white transition-colors duration-200">Notifications</span>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications}
                    className="data-[state=checked]:bg-[#FF6B4A]"
                  />
                </div>
              </div>
            </div>
            
            {/* API Keys & Provider Status Section */}
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#1a1a1a]">
              <h2 className="text-lg font-medium px-4 py-3 border-b border-[#2a2a2a] flex items-center">
                <KeyRound size={18} className="text-gray-400 mr-2" />
                API Keys & Providers
              </h2>
              
              <div className="p-4 space-y-4">
                {/* Provider Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    AI Provider Status
                  </label>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2C2C30] rounded-lg border border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">OpenAI</span>
                      {hasOpenAIKey ? (
                        <Badge className="bg-green-700 text-white text-xs">
                          <Check className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-700 text-zinc-300 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#2C2C30] rounded-lg border border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">DeepSeek</span>
                      {hasDeepSeekKey ? (
                        <Badge className="bg-green-700 text-white text-xs">
                          <Check className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-700 text-zinc-300 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Input fields for API keys */}
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">OpenAI API Key</label>
                    <div className="flex">
                      <Input
                        type={showOpenaiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="Enter your OpenAI API key"
                        className="bg-[#2C2C30] border-zinc-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2 px-3"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">OpenAI Platform</a>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">DeepSeek API Key</label>
                    <div className="flex">
                      <Input
                        type={showDeepseekKey ? "text" : "password"}
                        value={deepseekKey}
                        onChange={(e) => setDeepseekKey(e.target.value)}
                        placeholder="Enter your DeepSeek API key"
                        className="bg-[#2C2C30] border-zinc-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2 px-3"
                        onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      >
                        {showDeepseekKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Get your key from <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">DeepSeek Platform</a>
                    </p>
                  </div>
                  
                  {/* Success message */}
                  {saveSuccess && (
                    <div className="p-3 rounded-lg bg-green-900/20 border border-green-700 text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <p className="text-sm">API keys saved successfully!</p>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {saveError && (
                    <div className="p-3 rounded-lg bg-red-900/20 border border-red-700 text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{saveError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white py-2.5 px-4 rounded-md transition-all duration-200 transform hover:shadow-lg hover:shadow-[#FF6B4A]/20"
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
            
            <button 
              onClick={handleSignOut}
              className="w-full flex justify-center items-center gap-2 text-gray-400 py-2 bg-transparent border-0 cursor-pointer hover:text-white transition-colors duration-200"
              onMouseEnter={() => setSignOutHovered(true)}
              onMouseLeave={() => setSignOutHovered(false)}
              style={{
                textShadow: signOutHovered ? "0 0 8px rgba(255, 255, 255, 0.6)" : "none"
              }}
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
        
        {/* Personal Information Dialog */}
        <PersonalInformation 
          open={personalInfoOpen} 
          onOpenChange={setPersonalInfoOpen} 
        />
      </DialogContent>
    </Dialog>
  );
}; 