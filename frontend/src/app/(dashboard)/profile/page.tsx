"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { ROLE_LABELS, ROLE_VARIANT } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ProfileCard({ profile, onChange }: { profile: Employee; onChange: (value: Employee) => void }) {
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be 2MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const updated = await employeeService.uploadProfileImage(file);
      onChange(updated);
      await refreshUser();
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <Avatar name={profile.name} src={profile.profileImage} size={96} />

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          loading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Camera size={16} /> Change photo
        </Button>
        <p className="mt-2 text-xs text-slate-400">JPG, PNG or WEBP, up to 2MB</p>

        <h2 className="mt-5 text-lg font-semibold text-slate-900">{profile.name}</h2>
        <p className="text-sm text-slate-500">{profile.email}</p>
        <Badge variant={ROLE_VARIANT[profile.role]} className="mt-3">
          {ROLE_LABELS[profile.role]}
        </Badge>
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
        {[
          ["Department", profile.department],
          ["Designation", profile.designation],
          ["Joining date", profile.joiningDate ? formatDate(profile.joiningDate) : ""],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">{value || "-"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

interface PersonalValues {
  name: string;
  phone: string;
}

function PersonalInfoForm({ profile, onChange }: { profile: Employee; onChange: (value: Employee) => void }) {
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalValues>({
    defaultValues: { name: profile.name, phone: profile.phone ?? "" },
  });

  const onSubmit = async (values: PersonalValues) => {
    setError(null);
    try {
      const updated = await employeeService.updateProfile(values);
      onChange(updated);
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Card title="Personal information" description="Update your name and phone number">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
              maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
            })}
          />
          <Input
            label="Phone"
            placeholder="03001234567"
            error={errors.phone?.message}
            {...register("phone", {
              pattern: { value: /^[0-9+\-\s()]{7,20}$/, message: "Enter a valid phone number" },
            })}
          />
          <Input label="Email" value={profile.email} disabled readOnly />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function PasswordForm() {
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>();

  const onSubmit = async (values: PasswordValues) => {
    setError(null);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed. Please login again.");
      await logout();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Card title="Change password" description="You will be signed out after changing your password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword", { required: "Current password is required" })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === getValues("newPassword") || "Passwords do not match",
            })}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    employeeService
      .getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!profile) return <PageLoader />;

  return (
    <>
      <PageHeader title="My profile" description="Manage your personal information and security" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} onChange={setProfile} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <PersonalInfoForm profile={profile} onChange={setProfile} />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}