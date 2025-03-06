import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-zinc-400">
        {user?.email?.split("@")[0]}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="text-[#FF6B4A] hover:text-[#FF8266] hover:bg-transparent p-0"
      >
        Sign Out
      </Button>
    </div>
  );
}; 