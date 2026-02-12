import React, { createContext, useContext, useState, useCallback } from 'react';
import { DMRoom } from '../services/dm.service';

interface DMChatContextValue {
  activeRoom: DMRoom | null;
  openChat: (room: DMRoom) => void;
  closeChat: () => void;
  isChatOpen: boolean;
}

const DMChatContext = createContext<DMChatContextValue | null>(null);

export const DMChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState<DMRoom | null>(null);

  const openChat = useCallback((room: DMRoom) => {
    setActiveRoom(room);
  }, []);

  const closeChat = useCallback(() => {
    setActiveRoom(null);
  }, []);

  return (
    <DMChatContext.Provider
      value={{
        activeRoom,
        openChat,
        closeChat,
        isChatOpen: activeRoom !== null,
      }}
    >
      {children}
    </DMChatContext.Provider>
  );
};

export const useDMChat = () => {
  const ctx = useContext(DMChatContext);
  if (!ctx) throw new Error('useDMChat must be used within DMChatProvider');
  return ctx;
};
