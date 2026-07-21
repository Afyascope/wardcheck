import Clarity from "@microsoft/clarity";

export function initializeClarity() {
  if (import.meta.env.PROD) {
    Clarity.init(import.meta.env.VITE_CLARITY_PROJECT_ID);
  }
}