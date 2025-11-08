"use client";

import React, { useLayoutEffect, useRef, useCallback } from "react";
import { ScreenPlayElement } from "@/types/screenplay";

interface EditableLineProps {
  element: ScreenPlayElement;
  isFocused: boolean;
  onUpdate: (id: string, text: string) => void;
  onEnter: (id: string) => void;
  onShiftEnter: (id: string) => void;
  onBackspace: (id: string) => void;
  onFocus: (id: string) => void;
  onArrowUp: (id: string) => void;
  onArrowDown: (id: string) => void;
}

function EditableLine({
  element,
  isFocused,
  onUpdate,
  onEnter,
  onShiftEnter,
  onBackspace,
  onFocus,
  onArrowUp,
  onArrowDown,
}: EditableLineProps) {
  const lineRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef(false);

  const getLineStyles = () => {
    const base = "editable-line";
    switch (element.type) {
      case "scene_heading":
        return `${base} scene-heading`;
      case "character":
        return `${base} character`;
      case "dialogue":
        return `${base} dialogue`;
      case "parenthetical":
        return `${base} parenthetical`;
      case "transition":
        return `${base} transition`;
      default:
        return `${base} action`;
    }
  };

  // Get cursor position (offset from start)
  const getCursorPosition = useCallback((): number => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    
    const range = sel.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    if (!lineRef.current) return 0;
    
    preSelectionRange.selectNodeContents(lineRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    
    return preSelectionRange.toString().length;
  }, []);

  // Set cursor position (offset from start)
  const setCursorPosition = useCallback((offset: number) => {
    const el = lineRef.current;
    if (!el) return;

    const range = document.createRange();
    const sel = window.getSelection();
    
    let charCount = 0;
    let nodeStack: Node[] = [el];
    let node: Node | undefined;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const nextCharCount = charCount + (textNode.length || 0);
        
        if (nextCharCount >= offset) {
          range.setStart(textNode, offset - charCount);
          range.collapse(true);
          foundStart = true;
        } else {
          charCount = nextCharCount;
        }
      } else {
        // Push children onto stack in reverse order
        const children = Array.from(node.childNodes);
        for (let i = children.length - 1; i >= 0; i--) {
          nodeStack.push(children[i]);
        }
      }
    }

    if (!foundStart && el.childNodes.length > 0) {
      // Fallback: place at end
      range.selectNodeContents(el);
      range.collapse(false);
    } else if (!foundStart) {
      // Empty element
      range.setStart(el, 0);
      range.collapse(true);
    }

    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  // Focus management with useLayoutEffect (runs synchronously before paint)
  useLayoutEffect(() => {
    const el = lineRef.current;
    if (isFocused && el && document.activeElement !== el) {
      el.focus();
    }
  }, [isFocused]);

  // Sync text content only when NOT focused (prevents caret jump)
  useLayoutEffect(() => {
    const el = lineRef.current;
    if (!el || document.activeElement === el) return;

    if (el.textContent !== element.data.text) {
      const cursorPos = getCursorPosition();
      el.textContent = element.data.text;
      // Restore cursor position after external update
      if (isFocused) {
        setCursorPosition(cursorPos);
      }
    }
  }, [element.data.text, isFocused, getCursorPosition, setCursorPosition]);

  // Input handler
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (isComposingRef.current) return; // Don't update during IME composition
      
      const text = e.currentTarget.textContent || "";
      onUpdate(element.id, text);
    },
    [element.id, onUpdate]
  );

  // Helper to check if cursor is at start
  const isCursorAtStart = useCallback((): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return true;
    const range = sel.getRangeAt(0);
    return getCursorPosition() === 0 && range.collapsed;
  }, [getCursorPosition]);

  // Helper to check if cursor is at end
  const isCursorAtEnd = useCallback((): boolean => {
    const sel = window.getSelection();
    const el = lineRef.current;
    if (!sel || sel.rangeCount === 0 || !el) return true;
    const range = sel.getRangeAt(0);
    const textLength = (el.textContent || "").length;
    return getCursorPosition() === textLength && range.collapsed;
  }, [getCursorPosition]);

  // Key handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const text = target.textContent || "";

      if (e.key === "Enter") {
        e.preventDefault();

        if (e.shiftKey) {
          // Soft break (Shift+Enter) - insert newline character
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode('\n');
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            
            // Trigger update
            const updatedText = target.textContent || "";
            onUpdate(element.id, updatedText);
          }
          onShiftEnter(element.id);
        } else {
          // Hard break (Enter) - creates new screenplay element
          onEnter(element.id);
        }
      } else if (e.key === "Backspace" && text.length === 0) {
        e.preventDefault();
        onBackspace(element.id);
      } else if (e.key === "ArrowUp" && isCursorAtStart()) {
        e.preventDefault();
        onArrowUp(element.id);
      } else if (e.key === "ArrowDown" && isCursorAtEnd()) {
        e.preventDefault();
        onArrowDown(element.id);
      }
    },
    [
      element.id,
      onEnter,
      onShiftEnter,
      onBackspace,
      onArrowUp,
      onArrowDown,
      onUpdate,
      isCursorAtStart,
      isCursorAtEnd,
    ]
  );

  // IME Composition handlers (for international keyboards)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>) => {
      isComposingRef.current = false;
      const text = e.currentTarget.textContent || "";
      onUpdate(element.id, text);
    },
    [element.id, onUpdate]
  );

  return (
    <div
      ref={lineRef}
      contentEditable
      suppressContentEditableWarning
      className={getLineStyles()}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onFocus={() => onFocus(element.id)}
      data-element-id={element.id}
      data-element-type={element.type}
      spellCheck={false}
      aria-label={`screenplay-line-${element.type}`}
    />
  );
}

export default React.memo(EditableLine);
