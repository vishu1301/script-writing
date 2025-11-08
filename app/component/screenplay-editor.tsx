// components/screenplay/ScreenPlayEditor.tsx

"use client";

import React from "react";
import FormatButton from "./format-button";
import EditorCanvas from "./editor-canvas";


function ScreenPlayEditor() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center py-10 gap-6 w-full">
      <div className="sticky top-4 z-10 w-full flex justify-center">
        <FormatButton />
      </div>
      <EditorCanvas />
    </div>
  );
}

export default ScreenPlayEditor;