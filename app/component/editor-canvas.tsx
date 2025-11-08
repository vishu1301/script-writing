// components/screenplay/EditorCanvas.tsx

"use client";

import React, { useEffect } from "react";
// import EditableLine from "./EditableLine";
import { ScreenPlayElement } from "@/types/screenplay";
import useScreenPlay from "@/hook/use-screenplay-data";
import EditableLine from "./editable-line";
// import useScreenPlay from "@/hooks/use-screenplay-data";
import "./style/editor-canvas-style.css"; // Ensure this path is correct

function EditorCanvas() {
  const {
    screenPlayData,
    focusElementId,
    setFocusElementId,
    addLine,
    updateLine,
    deleteLine,
    initialize,
  } = useScreenPlay();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleEnter = (id: string) => {
    const currentElement = screenPlayData.find((el) => el.id === id);
    if (!currentElement) return;

    let nextType: ScreenPlayElement["type"] = "action";

    // Standard Screenplay formatting rules
    if (currentElement.type === "scene_heading") {
      nextType = "action";
    } else if (currentElement.type === "character") {
      nextType = "dialogue";
    } else if (currentElement.type === "dialogue") {
      nextType = "character";
    } else if (currentElement.type === "parenthetical") {
      nextType = "dialogue";
    } else if (currentElement.type === "action") {
      nextType = "action";
    } else if (currentElement.type === "transition") {
      nextType = "scene_heading";
    }

    addLine(nextType, id);
  };

  const handleShiftEnter = (id: string) => {
    // Soft break logic is handled in EditableLine.
    console.log("Shift+Enter (Soft Break) in element:", id);
  };

  const handleBackspace = (id: string) => {
    const currentElement = screenPlayData.find((el) => el.id === id);
    // Only delete the line if it is completely empty
    if (
      currentElement &&
      currentElement.data.text.trim() === "" &&
      screenPlayData.length > 1
    ) {
      deleteLine(id);
    }
  };

  const handleArrowUp = (id: string) => {
    const index = screenPlayData.findIndex((el) => el.id === id);
    if (index > 0) {
      setFocusElementId(screenPlayData[index - 1].id);
    }
  };

  const handleArrowDown = (id: string) => {
    const index = screenPlayData.findIndex((el) => el.id === id);
    if (index < screenPlayData.length - 1) {
      setFocusElementId(screenPlayData[index + 1].id);
    } else if (index === screenPlayData.length - 1) {
      // Add a new action line if pressing down on the last element
      addLine("action", id);
    }
  };

  return (
    <div className="canvas-page">
      <div className="canvas-sheet">
        {screenPlayData.length === 0 ? (
          <div className="placeholder">Start typing your screenplay...</div>
        ) : (
          screenPlayData.map((element: ScreenPlayElement) => (
            <EditableLine
              key={element.id}
              element={element}
              isFocused={focusElementId === element.id}
              onUpdate={updateLine}
              onEnter={handleEnter}
              onShiftEnter={handleShiftEnter}
              onBackspace={handleBackspace}
              onFocus={setFocusElementId}
              onArrowUp={handleArrowUp}
              onArrowDown={handleArrowDown}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default EditorCanvas;
