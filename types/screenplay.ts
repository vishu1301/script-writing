// types/screenplay.ts

export interface ScreenPlayElement {
  id: string;
  type: "scene_heading" | "character" | "dialogue" | "action" | "parenthetical" | "transition";
  data: {
    text: string;
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
  };
  metadata: {
    characterCount?: number;
    wordCount?: number;
    timestamp?: number;
  };
}

export type screenPlayData = ScreenPlayElement[];