import { screenPlayData, ScreenPlayElement } from "@/types/screenplay";
import { useState, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";

function useScreenPlay() {
  const [screenPlayData, setScreenPlayData] = useState<screenPlayData>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusElementId, setFocusElementId] = useState<string | null>(null);

  // Use ref to avoid stale closures in setTimeout
  const focusElementIdRef = useRef<string | null>(null);

  const generateId = useCallback(() => {
    return uuid();
  }, []);

  const addLine = useCallback(
    (type: ScreenPlayElement["type"], afterId?: string) => {
      const newElement: ScreenPlayElement = {
        id: generateId(),
        type,
        data: { text: "" },
        metadata: {
          characterCount: 0,
          wordCount: 0,
          timestamp: Date.now(),
        },
      };

      setScreenPlayData((prev) => {
        if (!afterId) return [...prev, newElement];

        const index = prev.findIndex((el) => el.id === afterId);
        if (index === -1) return [...prev, newElement];

        const newData = [...prev];
        newData.splice(index + 1, 0, newElement);
        return newData;
      });

      // Set focus to the new line
      focusElementIdRef.current = newElement.id;
      setFocusElementId(newElement.id);

      return newElement.id;
    },
    [generateId]
  );

  const updateLine = useCallback((id: string, text: string) => {
    const words = text.split(/\s+/).filter(Boolean);

    setScreenPlayData((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              data: { ...el.data, text },
              metadata: {
                ...el.metadata,
                characterCount: text.length,
                wordCount: words.length,
                timestamp: Date.now(),
              },
            }
          : el
      )
    );
  }, []);

  const deleteLine = useCallback((id: string) => {
    setScreenPlayData((prev) => {
      const index = prev.findIndex((el) => el.id === id);
      if (index === -1) return prev;

      // Focus the line above, or the line below
      const focusId = prev[index - 1]?.id || prev[index + 1]?.id || null;

      // Set focus and move caret to end of previous line on delete
      if (focusId) {
        focusElementIdRef.current = focusId;
        setFocusElementId(focusId);

        // Use requestAnimationFrame for smoother focus transition
        requestAnimationFrame(() => {
          const elToFocus = document.querySelector(
            `[data-element-id="${focusId}"]`
          ) as HTMLElement;
          if (elToFocus) {
            elToFocus.focus();
            // Move caret to end
            const range = document.createRange();
            range.selectNodeContents(elToFocus);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        });
      }

      return prev.filter((el) => el.id !== id);
    });
  }, []);

  const changeLineType = useCallback(
    (id: string, type: ScreenPlayElement["type"]) => {
      setScreenPlayData((prev) => {
        return prev.map((el) => (el.id === id ? { ...el, type } : el));
      });

      // Maintain focus after type change
      focusElementIdRef.current = id;
      setFocusElementId(id);
    },
    []
  );

  const initialize = useCallback(() => {
    if (screenPlayData.length === 0) {
      const initialId = generateId();
      const initialElement: ScreenPlayElement = {
        id: initialId,
        type: "action",
        data: { text: "" },
        metadata: {
          characterCount: 0,
          wordCount: 0,
          timestamp: Date.now(),
        },
      };

      setScreenPlayData([initialElement]);
      setFocusElementId(initialId);
      focusElementIdRef.current = initialId;
    }
  }, [screenPlayData.length, generateId]);

  return {
    screenPlayData,
    isLoading,
    focusElementId,
    setFocusElementId: useCallback((id: string | null) => {
      focusElementIdRef.current = id;
      setFocusElementId(id);
    }, []),
    addLine,
    updateLine,
    deleteLine,
    changeLineType,
    initialize,
    setScreenPlayData,
  };
}

export default useScreenPlay;
