"use client";

import React, { useEffect, useCallback } from "react";
import {
  FileText,
  User,
  MessageSquare,
  AlignLeft,
  ArrowRightLeft,
  Type,
} from "lucide-react";
import useScreenPlay from "@/hook/use-screenplay-data";

const formatTypes = [
  { type: "scene_heading", label: "Scene Heading", icon: FileText, key: "1" },
  { type: "action", label: "Action", icon: AlignLeft, key: "2" },
  { type: "character", label: "Character", icon: User, key: "3" },
  { type: "dialogue", label: "Dialogue", icon: MessageSquare, key: "4" },
  { type: "parenthetical", label: "Parenthetical", icon: Type, key: "5" },
  { type: "transition", label: "Transition", icon: ArrowRightLeft, key: "6" },
] as const;

function FormatButton() {
  const { focusElementId, changeLineType, screenPlayData } = useScreenPlay();

  const currentElement = screenPlayData.find((el) => el.id === focusElementId);
  const currentType = currentElement?.type || "action";

  const refocusElement = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const element = document.querySelector(
        `[data-element-id="${id}"]`
      ) as HTMLElement;
      
      if (element) {
        element.focus();
        
        // Restore cursor to end
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, type: typeof currentType) => {
      e.preventDefault();

      if (focusElementId) {
        changeLineType(focusElementId, type);
        refocusElement(focusElementId);
      }
    },
    [focusElementId, changeLineType, refocusElement]
  );

  // Keyboard shortcuts for format changes (Ctrl/Cmd + 1-6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && focusElementId) {
        const keyMap: { [key: string]: typeof currentType } = {
          "1": "scene_heading",
          "2": "action",
          "3": "character",
          "4": "dialogue",
          "5": "parenthetical",
          "6": "transition",
        };

        const type = keyMap[e.key];
        if (type) {
          e.preventDefault();
          changeLineType(focusElementId, type);
          refocusElement(focusElementId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusElementId, changeLineType, refocusElement]);

  return (
    <div className="bg-white p-3 border border-gray-100 w-full max-w-3xl shadow-lg rounded-3xl">
      <div className="flex items-center gap-2 flex-wrap">
        {formatTypes.map(({ type, label, icon: Icon, key }) => (
          <button
            key={type}
            onMouseDown={handleMouseDown}
            onClick={(e) => handleClick(e, type)}
            // disabled={!focusElementId}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-95
              ${
                currentType === type
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            `}
            title={`${label} (Ctrl/Cmd+${key})`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        <div className="ml-auto text-xs text-gray-500 hidden md:flex items-center gap-2">
          <span className="font-semibold">{screenPlayData.length}</span>
          <span>lines</span>
        </div>
      </div>

      {focusElementId && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          Selected: {currentType.replace("_", " ").toUpperCase()} | Use
          Ctrl/Cmd+1-6 for shortcuts
        </div>
      )}
    </div>
  );
}

export default FormatButton;
