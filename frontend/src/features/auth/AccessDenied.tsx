import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function AccessDenied() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        icon={ShieldAlert}
        title="Access denied"
        description="You do not have permission to view this page. Contact your administrator if you think this is a mistake."
        action={
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}