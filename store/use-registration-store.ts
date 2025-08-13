import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TempRegistrationData {
  consents?: {
    privacyConsent: boolean;
    termsConsent: boolean;
    marketingConsent: boolean;
  };
  profile?: {
    name: string;
    phone: string;
  };
}

interface RegistrationState {
  tempData: TempRegistrationData | null;
  setConsents: (consents: TempRegistrationData["consents"]) => void;
  setProfile: (profile: TempRegistrationData["profile"]) => void;
  clearData: () => void;
  getFullData: () => TempRegistrationData | null;
  hasConsents: () => boolean;
  hasProfile: () => boolean;
  isComplete: () => boolean;
}

export const useRegistrationStore = create<RegistrationState>()(
  devtools(
    (set, get) => ({
      tempData: null,

      setConsents: (consents) => {
        set((state) => ({
          tempData: { ...state.tempData, consents },
        }));
      },

      setProfile: (profile) => {
        set((state) => ({
          tempData: { ...state.tempData, profile },
        }));
      },

      clearData: () => set({ tempData: null }),

      getFullData: () => get().tempData,

      hasConsents: () => {
        const { tempData } = get();
        return !!tempData?.consents;
      },

      hasProfile: () => {
        const { tempData } = get();
        return !!tempData?.profile;
      },

      isComplete: () => {
        const { tempData } = get();
        return !!(tempData?.consents && tempData?.profile);
      },
    }),
    { name: "registration-store" }
  )
);
