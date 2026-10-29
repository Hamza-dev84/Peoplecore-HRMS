import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">HRMS Enterprise</h1>
      <ApiStatus />
    </main>
  );
}