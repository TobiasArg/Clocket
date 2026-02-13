import { useEffect, useState } from "react";
import { HomeDesktop } from "@/pages";

export function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/hello")
      .then((r) => r.json())
      .then((d: { message?: string }) => setMessage(d.message || ""))
      .catch(() => setMessage("No response from backend"));
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-1 w-full">
        <HomeDesktop />
      </div>
      {message && (
        <div className="text-center text-sm text-gray-400 py-2">
          Backend: {message}
        </div>
      )}
    </div>
  );
}
