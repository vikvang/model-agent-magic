import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChangePasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePassword = ({ open, onOpenChange }: ChangePasswordProps) => {
  // State for password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for form submission
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Reset form state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage("");
      setSuccessMessage("");
      setPasswordStrength(0);
    }
    onOpenChange(open);
  };

  // Validate password strength
  const validatePasswordStrength = (password: string) => {
    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Contains number
    if (/\d/.test(password)) strength += 1;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
    return strength;
  };

  // Handle password change
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePasswordStrength(value);
  };

  // Handle form submission
  const handleUpdatePassword = async () => {
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required");
      return;
    }

    // Check if new password meets requirements
    if (passwordStrength < 3) {
      setErrorMessage("New password is not strong enough");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage("Password updated successfully");

      // Reset form after successful update
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close dialog after a delay
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (newPassword.length === 0) return null;

    const strengthText = [
      "Very weak",
      "Weak",
      "Medium",
      "Strong",
      "Very strong",
    ];

    const strengthColor = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-green-400",
      "text-green-500",
    ];

    return (
      <div className="text-sm mt-1">
        <span
          className={
            strengthColor[passwordStrength >= 5 ? 4 : passwordStrength]
          }
        >
          {strengthText[passwordStrength >= 5 ? 4 : passwordStrength]}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#121212] text-white p-0 rounded-xl border-0 shadow-xl max-w-md">
        <div className="p-6">
          <DialogHeader className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#FF6B4A] rounded-full flex items-center justify-center mb-4">
              <Lock className="text-white" size={28} />
            </div>
            <DialogTitle className="text-xl font-semibold text-white">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Create a new password for your account
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="flex items-center p-3 mb-4 bg-red-900/30 border border-red-800 rounded-md text-red-200">
              <AlertCircle size={18} className="mr-2 text-red-400" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center p-3 mb-4 bg-green-900/30 border border-green-800 rounded-md text-green-200">
              <CheckCircle size={18} className="mr-2 text-green-400" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Current Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className="pl-10 pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="Create new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {renderPasswordStrength()}
              <p className="text-xs text-gray-400 mt-1">
                Password should be at least 8 characters with upper & lowercase
                letters, numbers, and special characters.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white rounded-md focus:border-[#FF6B4A] focus:ring-[#FF6B4A]"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleUpdatePassword}
              disabled={isLoading}
              className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white py-2.5 px-4 rounded-md transition-all duration-200 transform hover:shadow-lg hover:shadow-[#FF6B4A]/20 mt-4"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
