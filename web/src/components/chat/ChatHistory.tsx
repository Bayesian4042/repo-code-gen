import { useRef, useEffect } from 'react';
import { ChatMessage } from './types';

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-sm">Start a conversation to generate code</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages
        .filter(msg => msg.role !== 'tool' && msg.content !== null)
        .map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg shadow-sm text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-50 border border-blue-100' 
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="font-medium mb-1">
              {msg.role === 'user' ? 'You' : (msg.agent_name || 'AI')}
            </div>
            <div className="text-gray-800">
              {typeof msg.content === 'string' 
                ? msg.content.length > 100 
                  ? `${msg.content.substring(0, 100)}...` 
                  : msg.content
                : 'Content not available'}
            </div>
          </div>
        ))}
      <div ref={scrollRef} />
    </div>
  );
}
