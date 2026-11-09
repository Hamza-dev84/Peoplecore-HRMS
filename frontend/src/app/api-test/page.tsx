"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/errors";
import { AUTH_LOGOUT_EVENT, setAccessToken } from "@/lib/token";
import { authService } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";
import { employeeService } from "@/services/employee.service";
import { reportService } from "@/services/report.service";

export default function ApiTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onLogout = () => toast.error("Session expired. Please login again.");
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const run = async (action: () => Promise<unknown>) => {
    setLoading(true);
    try {
      setOutput((await action()) ?? "Done");
    } catch (error) {
      setOutput(null);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold">API Test</h1>

      <Card title="Login">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Button loading={loading} onClick={() => run(() => authService.login({ email, password }))}>
            Login
          </Button>
        </div>
      </Card>

      <Card title="Requests">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => run(() => authService.getMe())}>
            Get me
          </Button>
          <Button variant="outline" onClick={() => run(() => dashboardService.get())}>
            Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => run(() => employeeService.list({ page: 1, limit: 5 }))}
          >
            Employees
          </Button>
          <Button variant="outline" onClick={() => run(() => reportService.download("employees", "csv"))}>
            Download CSV
          </Button>
          <Button variant="outline" onClick={() => run(() => authService.refreshSession())}>
            Refresh session
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              run(async () => {
                setAccessToken("invalid-token");
                return authService.getMe();
              })
            }
          >
            Break token, then Get me
          </Button>
          <Button variant="danger" onClick={() => run(() => authService.logout())}>
            Logout
          </Button>
        </div>
      </Card>

      <Card title="Output">
        <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {output ? JSON.stringify(output, null, 2) : "No output yet"}
        </pre>
      </Card>
    </main>
  );
}