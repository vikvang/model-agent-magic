export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const clerkConfig = {
  appearance: {
    elements: {
      rootBox: "mx-auto",
      card: "bg-[#1C1C1F] border border-zinc-800",
      headerTitle: "text-white",
      headerSubtitle: "text-zinc-400",
      socialButtonsBlockButton: "bg-[#2C2C30] text-white hover:bg-[#3C3C40]",
      formFieldLabel: "text-zinc-300",
      formFieldInput: "bg-[#2C2C30] text-white border-zinc-700",
      footerActionLink: "text-[#FF6B4A] hover:text-[#FF8266]",
    },
  },
};
