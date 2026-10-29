"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/config";

type Status = "loading" | "online" | "offline";

export default function ApiStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${config.apiUrl}/health`)
      .then((res) => res.json())
      .then((json) => {
        setStatus("online");
        setMessage(json.message);
      })
      .catch(() => setStatus("offline"));
  }, []);

  const color =
    status === "online"
      ? "bg-green-100 text-green-700"
      : status === "offline"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${color}`}>
      {status === "loading" && "Checking API..."}
      {status === "online" && `API online: ${message}`}
      {status === "offline" && "API offline"}
    </span>
  );
}