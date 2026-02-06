'use client';

import { useChatStore } from '@/lib/stores/chat';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { MessageSquare, Trash2, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ChatHistoryProps {
  onNewChat?: () => void;
}

export default function ChatHistory({ onNewChat }: ChatHistoryProps) {
  const { chats, loadChat, deleteChat, chatId: currentChatId, initialize } = useChatStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(id);
    }
  };

  // Group chats by date
  const groupedChats = chats.reduce((groups, chat) => {
    const date = new Date(chat.timestamp);
    let key = 'Older';
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'Previous 7 Days';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(chat);
    return groups;
  }, {} as Record<string, typeof chats>);

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className="p-3 border-b border-slate-800/50 space-y-3">
        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700/50 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        )}

        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-200">History</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{chats.length}</span>
        </div>
      </div>
      
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-slate-500">
          <Clock className="w-8 h-8 mb-3 opacity-20" />
          <p className="text-sm font-medium">No chats yet</p>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {groupOrder.map((group) => {
          const groupChats = groupedChats[group];
          if (!groupChats || groupChats.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="text-xs font-medium text-slate-500 mb-3 px-2 uppercase tracking-wider">{group}</h3>
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {groupChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group relative"
                    >
                      <button
                        onClick={() => loadChat(chat.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 border border-transparent flex items-start gap-3 ${
                          currentChatId === chat.id
                            ? 'bg-slate-800/80 text-white border-slate-700/50 shadow-lg shadow-black/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/30'
                        }`}
                      >
                        <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                          currentChatId === chat.id ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                             currentChatId === chat.id ? 'text-slate-100' : 'text-slate-300'
                          }`}>
                            {chat.title || 'Untitled Chat'}
                          </div>
                          {chat.summary && (
                            <div className="text-xs text-slate-500 truncate mt-1 group-hover:text-slate-400 transition-colors">
                              {chat.summary}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 truncate mt-1 group-hover:text-slate-400 transition-colors">
                            {format(new Date(chat.timestamp), 'h:mm a')}
                          </div>
                        </div>
                      </button>
                      
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"
                        onClick={(e) => handleDelete(e, chat.id)}
                        title="Delete chat"
                        tabIndex={0}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
