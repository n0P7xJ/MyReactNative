import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  groupPhotoPath?: string;
  inviteToken?: string;
  isInviteLinkActive: boolean;
  participants: any[];
  lastMessage?: any;
  unreadCount: number;
}

export function useConversations(userId?: number) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await chatService.getUserConversations(userId);
      setConversations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [userId]);

  return {
    conversations,
    isLoading,
    error,
    refresh: loadConversations,
  };
}
