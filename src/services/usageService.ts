import { User } from "@clerk/clerk-react";

const STORAGE_KEY = "gregify_usage";

interface UsageData {
  dailyCount: number;
  lastResetDate: string;
}

export const UsageService = {
  getDailyUsage: (userId: string): number => {
    const today = new Date().toDateString();
    const storage = localStorage.getItem(`${STORAGE_KEY}_${userId}`);

    if (!storage) {
      return 0;
    }

    const data: UsageData = JSON.parse(storage);
    if (data.lastResetDate !== today) {
      // Reset counter for new day
      UsageService.resetDailyUsage(userId);
      return 0;
    }

    return data.dailyCount;
  },

  incrementUsage: (userId: string): void => {
    const today = new Date().toDateString();
    const currentUsage = UsageService.getDailyUsage(userId);

    const data: UsageData = {
      dailyCount: currentUsage + 1,
      lastResetDate: today,
    };

    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));
  },

  resetDailyUsage: (userId: string): void => {
    const today = new Date().toDateString();
    const data: UsageData = {
      dailyCount: 0,
      lastResetDate: today,
    };

    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));
  },

  canUseGregify: (user: User | null): boolean => {
    if (!user) return false;

    // If user is on paid plan, always return true
    if (user.publicMetadata.plan === "paid") return true;

    // For free users, check daily limit
    const dailyUsage = UsageService.getDailyUsage(user.id);
    return dailyUsage < 10;
  },
};
