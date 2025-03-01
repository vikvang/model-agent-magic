import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, BellRing, ChevronRight, LogOut, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { PersonalInformation } from "./PersonalInformation";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const UserSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [aiProvider, setAiProvider] = useState<string>("deepseek");
  const [open, setOpen] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);

  // Load saved AI provider preference on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("gregify_ai_provider");
    if (savedProvider) {
      setAiProvider(savedProvider);
    }
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const handleSaveSettings = () => {
    setOpen(false);
    // Save AI provider to localStorage
    localStorage.setItem("gregify_ai_provider", aiProvider);
    
    // Here you would typically save other settings to a database
    console.log("Settings saved:", { notifications, aiProvider });
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
          Settings
        </button>
      </DialogTrigger>
      
      <DialogContent className="w-[400px] bg-[#121212] text-white p-0 rounded-xl border-0 shadow-xl">
        <div className="p-6">
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
            
            {/* AI Provider setting (standalone) */}
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#1a1a1a] p-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center">
                  <Zap size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                  <span className="text-gray-200 group-hover:text-white transition-colors duration-200">AI Provider</span>
                </div>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger className="w-32 bg-[#2a2a2a] border-[#3a3a3a] text-white">
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white py-2.5 px-4 rounded-md transition-all duration-200 transform hover:shadow-lg hover:shadow-[#FF6B4A]/20"
              onClick={handleSaveSettings}
            >
              Save Settings
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