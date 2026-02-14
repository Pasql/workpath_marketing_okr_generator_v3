"use client";

import type { TodoItem } from "@/lib/types";

interface TodoListProps {
  todos: TodoItem[];
}

export default function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) return null;

  const completed = todos.filter((t) => t.completed).length;
  const total = todos.length;

  return (
    <div className="mt-4 w-full px-1">
      <div className="p-3 rounded-xl bg-[#363953]/30 border border-[#363953]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#838895]">
            Coaching Progress
          </span>
          <span className="text-[10px] text-[#838895] font-mono">
            {completed}/{total}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2.5 group"
            >
              {/* Checkbox */}
              {todo.completed ? (
                <div className="w-4 h-4 rounded-full bg-[#669C89]/20 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#669C89]">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#838895]/40 shrink-0" />
              )}

              {/* Text */}
              <span
                className={`text-xs leading-snug transition-all duration-300 ${
                  todo.completed
                    ? "text-[#838895]/60 line-through"
                    : "text-[#C2C5CE]"
                }`}
              >
                {todo.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
