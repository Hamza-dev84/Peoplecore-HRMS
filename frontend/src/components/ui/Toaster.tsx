"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "10px",
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          fontSize: "14px",
        },
      }}
    />
  );
}