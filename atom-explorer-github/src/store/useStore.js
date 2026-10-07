import { create } from "zustand";

// Global exploration state shared across modules
const useStore = create((set, get) => ({
  // Energy impact: selected city scale
  cityScale: "medium", // small | medium | large
  setCityScale: (scale) => set({ cityScale: scale }),

  // Plant explorer: selected component + knowledge level
  selectedComponent: null,
  knowledgeLevel: 1, // 1 | 2 | 3
  setSelectedComponent: (id) => set({ selectedComponent: id }),
  setKnowledgeLevel: (lvl) => set({ knowledgeLevel: lvl }),

  // Experiment: slider params + derived state
  power: 60,
  controlRod: 30,
  cooling: 70,
  temperature: 300,
  status: "stable",
  setParam: (key, val) => set({ [key]: val }),
  setExperiment: (patch) => set(patch),

  // AI tutor: conversation history
  messages: [],
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  // Exploration progress tracking (for "explore more" recommendations)
  visited: [],
  markVisited: (page) =>
    set((s) => (s.visited.includes(page) ? {} : { visited: [...s.visited, page] })),
}));

export default useStore;
