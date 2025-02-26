import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
  isGenerating: boolean;
}

export function ChatInput({ onSubmit, isLoading, isGenerating }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    await onSubmit(input);
    setInput('');
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to build..."
          disabled={isLoading || isGenerating}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isLoading || isGenerating}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              Working...
            </span>
          ) : 'Generate Code'}
        </Button>
      </form>
    </div>
  );
}
