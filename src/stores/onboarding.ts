import { create } from 'zustand'

export type HouseholdType = 'couple' | 'family_with_kids' | 'flatmates' | 'single'
export type ModuleKey = 'chores' | 'car' | 'insurance' | 'electronics' | 'kids'

interface OnboardingState {
  step: 1 | 2 | 3
  householdName: string
  householdType: HouseholdType | null
  activeModules: ModuleKey[]
  setStep: (step: 1 | 2 | 3) => void
  setHouseholdName: (name: string) => void
  setHouseholdType: (type: HouseholdType) => void
  toggleModule: (module: ModuleKey) => void
  reset: () => void
}

const initialState = {
  step: 1 as const,
  householdName: '',
  householdType: null,
  activeModules: [] as ModuleKey[],
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
  reset: () => set(initialState),
}))
