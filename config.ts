
/**
 * ============================================================================
 * 🔑 TEACHER AI - CONFIGURATION (STRICT CLEAN VERSION)
 * ============================================================================
 */

export const MASTER_KEYS = {
  SERPAPI_KEY: "",
  GROQ_API_KEY: "",
  OPENAI_API_KEY: "",
  ELEVEN_LABS_KEY: ""
};

export const getKey = (keyName: keyof typeof MASTER_KEYS): string => {
  const override = localStorage.getItem(`override_${keyName}`);
  return (override || MASTER_KEYS[keyName] || "");
};

export const saveOverrideKey = (keyName: keyof typeof MASTER_KEYS, value: string) => {
  if (value && value.trim()) {
    localStorage.setItem(`override_${keyName}`, value.trim());
  }
};
