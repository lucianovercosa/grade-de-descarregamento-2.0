import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ChatMessage } from '../types';
import { MessageSquare, X, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'chat_messages'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(data);
    });

    return unsubscribe;
  }, [user]);
  
  const prevMessagesLength = useRef(0);
  
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (!isOpen) {
        setUnreadCount(prev => prev + (messages.length - prevMessagesLength.current));
      }
    }
    prevMessagesLength.current = messages.length;
    
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'chat_messages'), {
        text,
        user_id: user.uid,
        user_name: user.name,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!user || user.role === 'tv') return null;

  return (
    <>
      {!isOpen && (
        <button 
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-white hover:bg-blue-500 transition-colors z-50 group"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0A0A0B] animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] max-h-[80vh] bg-[#15151A] border border-white/10 rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-blue-600/10 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              <h3 className="font-bold text-white">Chat Geral</h3>
            </div>
            <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg, idx) => {
              const isMe = msg.user_id === user.uid;
              const msgDate = msg.created_at ? parseISO(msg.created_at) : new Date();
              const timeStr = format(msgDate, 'HH:mm');
              
              return (
                <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-white/40 mb-1 ml-1">{msg.user_name}</span>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none'}`}>
                    <p className="text-sm break-words">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-white/30 mt-1 mx-1">{timeStr}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t border-white/10 bg-[#0F0F12] rounded-b-xl">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
