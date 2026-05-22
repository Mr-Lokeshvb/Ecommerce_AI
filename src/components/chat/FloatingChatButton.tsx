import React, { useState } from 'react';
import { MessageCircle, X, Bot, Users, Headphones, Zap } from 'lucide-react';
import { useChatStore, Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ChatWindow } from './ChatWindow';
import { ChatList } from './ChatList';
import { QuickActionChat } from './QuickActionChat';

export const FloatingChatButton: React.FC = () => {
  const { user } = useAuthStore();
  const { chats, createChat, getUnreadCount } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const unreadCount = getUnreadCount();

  // Debug logging
  console.log('🔵 FloatingChatButton rendered', { 
    user: user?.name, 
    role: user?.role, 
    isOpen, 
    showQuickActions,
    chatsCount: chats.length 
  });

  const handleNewChat = (type: Chat['type'] | 'QUICK_ACTION') => {
    // Handle Quick Actions specially
    if (type === 'QUICK_ACTION') {
      setShowQuickActions(true);
      setShowChatList(false);
      return;
    }

    let title = '';
    let participants: Chat['participants'] = [];

    switch (type) {
      case 'BOT':
        title = 'AI Assistant';
        participants = [
          { id: 'bot', name: 'AI Assistant', role: 'ADMIN' }
        ];
        break;
      case 'B2B':
        title = 'Business Chat';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any }
        ];
        break;
      case 'B2C':
        title = user?.role === 'SELLER' ? 'Customer Support' : 'Contact Seller';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any }
        ];
        break;
      case 'SUPPORT':
        title = 'Customer Support';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any },
          { id: 'support', name: 'Support Team', role: 'ADMIN' }
        ];
        break;
    }

    const chatId = createChat(type as Chat['type'], participants, title);
    const newChat = chats.find(c => c.id === chatId);
    if (newChat) {
      setActiveChat(newChat);
      setShowChatList(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    setShowChatList(false);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
    setShowChatList(true);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowChatList(true);
      setActiveChat(null);
      setShowQuickActions(false);
    }
  };

  const handleQuickActionsToggle = () => {
    setShowQuickActions(!showQuickActions);
    setShowChatList(false);
    setActiveChat(null);
  };

  const handleCloseQuickActions = () => {
    setShowQuickActions(false);
    setShowChatList(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-96">
          {showQuickActions ? (
            <QuickActionChat onClose={handleCloseQuickActions} />
          ) : showChatList ? (
            <div className="relative h-full">
              <ChatList onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
              <button
                onClick={handleToggle}
                className="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow transition-all"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : activeChat ? (
            <ChatWindow
              chat={activeChat}
              onClose={handleCloseChat}
            />
          ) : null}
        </div>
      )}

      {/* Quick Actions Button - Always visible in ChatList for customers */}
      {isOpen && showChatList && user?.role === 'CUSTOMER' && (
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={handleQuickActionsToggle}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-white"
          >
            <Zap className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">Quick Actions ⚡</p>
              <p className="text-xs text-blue-100">Returns, Track, Support</p>
            </div>
          </button>
        </div>
      )}

      {/* Quick Chat Options Overlay */}
      {isOpen && showChatList && chats.length === 0 && (
        <div className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64" style={{ marginBottom: user?.role === 'CUSTOMER' ? '60px' : '0' }}>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Start</h4>
          <div className="space-y-2">
            
            <button
              onClick={() => handleNewChat('BOT')}
              className="w-full flex items-center space-x-3 p-2 text-left hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Bot className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">AI Assistant</p>
                <p className="text-xs text-gray-500">Get instant help</p>
              </div>
            </button>
            
            {user?.role === 'SELLER' && (
              <>
                <button
                  onClick={() => handleNewChat('B2B')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Business Chat</p>
                    <p className="text-xs text-gray-500">Connect with partners</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleNewChat('B2C')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer Support</p>
                    <p className="text-xs text-gray-500">Help your customers</p>
                  </div>
                </button>
              </>
            )}
            
            {user?.role === 'CUSTOMER' && (
              <>
                <button
                  onClick={() => handleNewChat('B2C')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact Seller</p>
                    <p className="text-xs text-gray-500">Ask about products</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleNewChat('SUPPORT')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Headphones className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer Support</p>
                    <p className="text-xs text-gray-500">Get platform help</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
