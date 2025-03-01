import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, Moon, BellRing, ChevronRight, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export const UserSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [open, setOpen] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const handleSaveSettings = () => {
    setOpen(false);
    // Here you would typically save the settings to a database
    console.log("Settings saved:", { isDarkMode, notifications });
  };

  // Generate initials from email
  const getInitials = () => {
    if (!user?.email) return "JS";
    const email = user.email;
    return email.substring(0, 2).toUpperCase();
  };

  // Generate display name from email
  const getDisplayName = () => {
    if (!user?.email) return "John Smith";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
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
            <Avatar className="h-14 w-14 bg-[#FF6B4A] text-white mr-4">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {getDisplayName()}
              </h3>
              <p className="text-sm text-gray-400">{user?.email || "john.smith@example.com"}</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#1a1a1a]">
              <h2 className="text-lg font-medium px-4 py-3 border-b border-[#2a2a2a]">Account Settings</h2>
              
              <div className="divide-y divide-[#2a2a2a]">
                <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto rounded-none text-gray-200 hover:text-white hover:bg-opacity-10 hover:bg-white transition-all duration-200 group">
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
              </div>
            </div>
            
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#1a1a1a]">
              <h2 className="text-lg font-medium px-4 py-3 border-b border-[#2a2a2a]">Display Settings</h2>
              
              <div className="divide-y divide-[#2a2a2a]">
                <div className="flex items-center justify-between px-4 py-3 group hover:bg-opacity-10 hover:bg-white transition-all duration-200">
                  <div className="flex items-center">
                    <Moon size={18} className="text-gray-400 mr-3 group-hover:text-[#FF6B4A] transition-colors duration-200" />
                    <span className="text-gray-200 group-hover:text-white transition-colors duration-200">Dark Mode</span>
                  </div>
                  <Switch 
                    checked={isDarkMode} 
                    onCheckedChange={setIsDarkMode} 
                    className="data-[state=checked]:bg-[#FF6B4A]"
                  />
                </div>
                
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
      </DialogContent>
    </Dialog>
  );
}; 