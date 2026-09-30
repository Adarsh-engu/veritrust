import React, { useState } from 'react';

interface AskBarProps {
  status: "idle" | "running" | "done" | "error";
  error: string | null;
  onAsk: (question: string) => void;
}

export const AskBar: React.FC<AskBarProps> = ({ status, error, onAsk }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "running") return;
    onAsk(input);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          disabled={status === "running"}
          className="flex-1 border border-outline-dim p-2 rounded text-[13px] font-sans"
          placeholder="Ask a policy question..." 
        />
        <button 
          type="submit" 
          disabled={status === "running" || !input.trim()}
          className="bg-on-surface text-surface px-4 py-2 rounded text-[13px] font-medium disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded">
          {error}
        </div>
      )}

      {status === "running" && !error && (
        <div className="p-4 flex items-center justify-center gap-3 text-outline">
          <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
          <span className="font-mono text-[11px] uppercase tracking-widest">Checking policies...</span>
        </div>
      )}
    </div>
  );
};
