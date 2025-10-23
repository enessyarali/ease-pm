import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIBackend = 'openai' | 'gemini' | 'anthropic' | 'fal';

interface SettingsState {
  aiBackend: AIBackend;
  setBackend: (b: AIBackend) => void;

  openaiApiKey: string | null;
  geminiApiKey: string | null;
  anthropicApiKey: string | null;
  falApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => void;
  setGeminiApiKey: (key: string | null) => void;
  setAnthropicApiKey: (key: string | null) => void;
  setFalApiKey: (key: string | null) => void;

  openaiBaseUrl: string | null;
  openaiModel: string | null;
  geminiModel: string | null;
  anthropicModel: string | null;
  falModel: string | null;
  setOpenaiBaseUrl: (url: string | null) => void;
  setOpenaiModel: (model: string | null) => void;
  setGeminiModel: (model: string | null) => void;
  setAnthropicModel: (model: string | null) => void;
  setFalModel: (model: string | null) => void;

  groupId: string | null;
  groupName: string | null;
  projectId: string | null;
  projectName: string | null;
  setGroupId: (id: string) => void;
  setGroupName: (name: string) => void;
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;

  gitlabHost: string | null;
  gitlabAppId: string | null;
  gitlabCallbackUrl: string | null;
  setGitlabHost: (host: string | null) => void;
  setGitlabAppId: (id: string | null) => void;
  setGitlabCallbackUrl: (url: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiBackend: 'openai',
      setBackend: (aiBackend) => set({ aiBackend }),

      openaiApiKey: null,
      geminiApiKey: null,
      anthropicApiKey: null,
      falApiKey: null,
      setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setAnthropicApiKey: (anthropicApiKey) => set({ anthropicApiKey }),
      setFalApiKey: (falApiKey) => set({ falApiKey }),
      openaiBaseUrl: null,
      openaiModel: null,
      geminiModel: null,
      anthropicModel: null,
      falModel: null,
      setOpenaiBaseUrl: (openaiBaseUrl) => set({ openaiBaseUrl }),
      setOpenaiModel: (openaiModel) => set({ openaiModel }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setAnthropicModel: (anthropicModel) => set({ anthropicModel }),
      setFalModel: (falModel) => set({ falModel }),

      groupId: null,
      groupName: null,
      projectId: null,
      projectName: null,
      setGroupId: (groupId) => set({ groupId }),
      setGroupName: (groupName) => set({ groupName }),
      setProjectId: (projectId) => set({ projectId }),
      setProjectName: (projectName) => set({ projectName }),

      gitlabHost: null,
      gitlabAppId: null,
      gitlabCallbackUrl: null,
      setGitlabHost: (gitlabHost) => set({ gitlabHost }),
      setGitlabAppId: (gitlabAppId) => set({ gitlabAppId }),
      setGitlabCallbackUrl: (gitlabCallbackUrl) => set({ gitlabCallbackUrl }),
    }),
    {
      name: 'ease-gitlab-settings',
    }
  )
);
