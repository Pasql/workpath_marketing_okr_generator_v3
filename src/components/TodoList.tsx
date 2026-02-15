"use client";

import { useEffect, useRef, useState } from "react";
import type { TodoItem } from "@/lib/types";

interface TodoListProps {
  todos: TodoItem[];
}

export default function TodoList({ todos }: TodoListProps) {
  const completed = todos.filter((t) => t.completed).length;
  const total = todos.length;
  const isEmpty = total === 0;

  // Track which items just completed for the flash animation
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevCompletedRef.current;
    const newlyDone = new Set<string>();

    for (const todo of todos) {
      if (todo.completed && !prev.has(todo.id)) {
        newlyDone.add(todo.id);
      }
    }

    if (newlyDone.size > 0) {
      setJustCompleted(newlyDone);
      const timer = setTimeout(() => setJustCompleted(new Set()), 800);
      return () => clearTimeout(timer);
    }

    // Update ref for next comparison
    prevCompletedRef.current = new Set(todos.filter((t) => t.completed).map((t) => t.id));
  }, [todos]);

  // Keep ref in sync after animation clears
  useEffect(() => {
    if (justCompleted.size === 0) {
      prevCompletedRef.current = new Set(todos.filter((t) => t.completed).map((t) => t.id));
    }
  }, [justCompleted, todos]);

  return (
    <div className="mt-4 w-full px-1">
      <div className={`p-3 rounded-xl border ${isEmpty ? "bg-[#363953]/15 border-dashed border-[#363953]" : "bg-[#363953]/30 border-[#363953]"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isEmpty ? "text-[#838895]/60" : "text-[#838895]"}`}>
            Coaching Progress
          </span>
          {!isEmpty && (
            <span className="text-[10px] text-[#838895] font-mono">
              {completed}/{total}
            </span>
          )}
        </div>

        {isEmpty ? (
          <p className="text-xs text-[#838895]/40 leading-relaxed">
            Steps will appear once coaching begins.
          </p>
        ) : (
          <div className="space-y-1.5">
            {todos.map((todo) => {
              const isFlashing = justCompleted.has(todo.id);

              return (
                <div
                  key={todo.id}
                  className={`flex items-center gap-2.5 rounded-md px-1.5 py-1 -mx-1.5 transition-all duration-500 ${
                    isFlashing ? "bg-[#669C89]/15" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div className="relative shrink-0">
                    {todo.completed ? (
                      <div className={`w-4 h-4 rounded-full bg-[#669C89]/20 flex items-center justify-center transition-transform duration-300 ${
                        isFlashing ? "scale-125" : "scale-100"
                      }`}>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-[#669C89]"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={isFlashing ? "animate-check-draw" : ""}
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#838895]/40" />
                    )}

                    {/* Ripple ring on completion */}
                    {isFlashing && (
                      <div className="absolute inset-0 -m-1 rounded-full border-2 border-[#669C89]/50 animate-ripple-out" />
                    )}
                  </div>

                  {/* Text */}
                  <span
                    className={`text-xs leading-snug transition-all duration-500 ${
                      todo.completed
                        ? isFlashing
                          ? "text-[#669C89] font-medium"
                          : "text-[#838895]/60 line-through"
                        : "text-[#C2C5CE]"
                    }`}
                  >
                    {todo.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
