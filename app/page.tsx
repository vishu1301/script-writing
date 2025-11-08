import Image from "next/image";
import ScreenPlayEditor from "./component/screenplay-editor";

export default function Home() {
  return (
    <div className="bg-gray-50 flex items-center justify-center py-20 min-h-screen w-full">
      <ScreenPlayEditor />
    </div>
  );
}
