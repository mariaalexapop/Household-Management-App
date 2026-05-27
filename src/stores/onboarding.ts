import { create } from 'zustand'

export type HouseholdType = 'couple' | 'family_with_kids' | 'flatmates' | 'single'
export type ModuleKey = 'chores' | 'car' | 'insurance' | 'electronics' | 'kids'

interface OnboardingState {
  step: 1 | 2 | 3
  householdName: string
  householdType: HouseholdType | null
  activeModules: ModuleKey[]
  // Members added during onboarding (optional)
  partnerEmail: string
  flatmateEmails: string[]
  kidNames: string[]
  setStep: (step: 1 | 2 | 3) => void
  setHouseholdName: (name: string) => void
  setHouseholdType: (type: HouseholdType) => void
  toggleModule: (module: ModuleKey) => void
  setPartnerEmail: (email: string) => void
  setFlatmateEmails: (emails: string[]) => void
  setKidNames: (names: string[]) => void
  reset: () => void
}

const initialState = {
  step: 1 as const,
  householdName: '',
  householdType: null as HouseholdType | null,
  activeModules: [] as ModuleKey[],
  partnerEmail: '',
  flatmateEmails: [''],
  kidNames: [''],
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setHouseholdName: (householdName) => set({ householdName }),
  setHouseholdType: (householdType) => set({ householdType }),
  toggleModule: (module) =>
    set((state) => ({
      activeModules: state.activeModules.includes(module)
        ? state.activeModules.filter((m) => m !== module)
        : [...state.activeModules, module],
    })),
  setPartnerEmail: (partnerEmail) => set({ partnerEmail }),
  setFlatmateEmails: (flatmateEmails) => set({ flatmateEmails }),
  setKidNames: (kidNames) => set({ kidNames }),
  reset: () => set(initialState),
}))
