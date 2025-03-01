import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PersonalInformationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PersonalInformation = ({
  open,
  onOpenChange,
}: PersonalInformationProps) => {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  // Get initials from name for avatar
  const getInitials = () => {
    if (!fullName) return "U";
    
    const nameParts = fullName.split(" ");
    if (nameParts.length > 1) {
      // Get first letter of first and last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    // If only one name, return first two letters
    return fullName.substring(0, 2).toUpperCase();
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Update user profile directly with Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        }
      });
      
      if (error) throw error;
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] text-white p-0 rounded-xl border-0 shadow-xl max-w-md">
        <div className="p-6">
          <DialogHeader className="flex flex-col items-center mb-6">
            <Avatar className="h-16 w-16 bg-[#FF6B4A] text-white mb-4 flex items-center justify-center">
              <AvatarFallback className="bg-[#FF6B4A] text-white font-semibold text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-xl font-semibold text-white">
              Personal Information
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Update your personal details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="John Smith"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="john.smith@example.com"
                  disabled={true} // Email usually can't be changed directly
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white py-2.5 px-4 rounded-md transition-all duration-200 transform hover:shadow-lg hover:shadow-[#FF6B4A]/20 mt-4"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 