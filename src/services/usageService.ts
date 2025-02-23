import type { UserResource } from "@clerk/types";

const STORAGE_KEY = "gregify_usage";

interface UsageData {
  dailyCount: number;
  lastResetDate: string;
}

class UsageService {
  private static instance: UsageService;
  
  private constructor() {}

  static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_KEY}_${userId}`;
  }

  getDailyUsage(userId: string): number {
    const today = new Date().toDateString();
    const storage = localStorage.getItem(this.getStorageKey(userId));

    if (!storage) {
      return 0;
    }

    const data: UsageData = JSON.parse(storage);
    if (data.lastResetDate !== today) {
      this.resetDailyUsage(userId);
      return 0;
    }

    return data.dailyCount;
  }

  incrementUsage(userId: string): void {
    const today = new Date().toDateString();
    const currentUsage = this.getDailyUsage(userId);

    const data: UsageData = {
      dailyCount: currentUsage + 1,
      lastResetDate: today,
    };

    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data));
  }

  resetDailyUsage(userId: string): void {
    const today = new Date().toDateString();
    const data: UsageData = {
      dailyCount: 0,
      lastResetDate: today,
    };

    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data));
  }

  canUseGregify: (user: UserResource | null): boolean => {
    if (!user) return false;
    if (user.publicMetadata.plan === "paid") return true;
    
    const dailyUsage = this.getDailyUsage(user.id);
    return dailyUsage < FREE_TIER_LIMIT;
  }
}

    // For free users, check daily limit
    const dailyUsage = UsageService.getDailyUsage(user.id);
    return dailyUsage < 3000;
  },
};

