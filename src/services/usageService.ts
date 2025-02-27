const STORAGE_KEY = "gregify_usage";

interface UsageData {
  dailyCount: number;
  lastResetDate: string;
}

class UsageServiceImpl {
  private static instance: UsageServiceImpl;

  private constructor() {}

  static getInstance(): UsageServiceImpl {
    if (!UsageServiceImpl.instance) {
      UsageServiceImpl.instance = new UsageServiceImpl();
    }
    return UsageServiceImpl.instance;
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

  // Always allow usage without authentication
  canUseGregify(): boolean {
    return true;
  }
}

// For development, we'll allow a high usage limit
const FREE_TIER_LIMIT = 5;

export const UsageService = UsageServiceImpl.getInstance();
