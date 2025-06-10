/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global Voiceflow type declaration
declare global {
  interface Window {
    voiceflow: {
      chat: {
        load: (config: {
          verify: { projectID: string };
          url: string;
          versionID: string;
        }) => void;
        open: () => void;
        close: () => void;
        toggle: () => void;
      };
    };
    voiceflowChatState: {
      isOpen: boolean;
      isInitialized: boolean;
    };
  }
}

export {}