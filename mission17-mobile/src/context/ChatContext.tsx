import React, { createContext, useContext, useMemo, useState } from 'react';

export type ChatMessage = {
  id: string;
  text: string;
  isBot: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '0',
    text: 'Mabuhay! I am your Barangay Bagong Pag-asa digital assistant. I can help you with Blotter Reports, document requests, barangay services, and civic tasks. How can I assist you today?',
    isBot: true,
  },
];

type ChatContextValue = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const value = useMemo(() => ({ messages, setMessages }), [messages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
