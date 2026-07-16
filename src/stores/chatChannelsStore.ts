import { create } from 'zustand';
import type { ChatChannel } from '../types';
import { chatChannelService } from '../services';

interface ChatChannelsState {
  channels: ChatChannel[];
  filteredChannels: ChatChannel[];
  isLoading: boolean;
  error: string | null;
  search: string;
  typeFilter: string;
  workspaceFilter: string;
  absoluteTotal: number;
}

interface ChatChannelsActions {
  setChannels: (channels: ChatChannel[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;
  setTypeFilter: (filter: string) => void;
  setWorkspaceFilter: (filter: string) => void;
  fetchChannels: (workspaceId?: string) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  applyFilters: () => void;
}

type ChatChannelsStore = ChatChannelsState & ChatChannelsActions;

export const useChatChannelsStore = create<ChatChannelsStore>((set, get) => ({
  channels: [],
  filteredChannels: [],
  isLoading: false,
  error: null,
  search: '',
  typeFilter: 'all',
  workspaceFilter: 'all',
  absoluteTotal: 0,

  setChannels: (channels) => set({ channels, absoluteTotal: channels.length }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setWorkspaceFilter: (workspaceFilter) => set({ workspaceFilter }),

  fetchChannels: async (workspaceId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params: { workspaceId?: string } = {};
      if (workspaceId && workspaceId !== 'all') params.workspaceId = workspaceId;
      const channels = await chatChannelService.getAllChannels(
        Object.keys(params).length ? params : undefined
      );
      set({ channels, absoluteTotal: channels.length, isLoading: false });
      get().applyFilters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch channels';
      set({ error: message, isLoading: false });
    }
  },

  deleteChannel: async (id: string) => {
    try {
      await chatChannelService.deleteChannel(id);
      const channels = get().channels.filter((c) => c._id !== id);
      set({ channels, absoluteTotal: channels.length });
      get().applyFilters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete channel';
      set({ error: message });
      throw error;
    }
  },

  applyFilters: () => {
    const { channels, search, typeFilter } = get();
    let result = [...channels];

    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    set({ filteredChannels: result });
  },
}));
