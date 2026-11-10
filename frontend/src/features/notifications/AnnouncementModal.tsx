"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getErrorMessage } from "@/lib/errors";
import { notificationService, type AnnouncementPayload } from "@/services/notification.service";

interface FormValues {
  title: string;
  message: string;
  audience: NonNullable<AnnouncementPayload["audience"]>;
}

interface AnnouncementModalProps {
  onClose: () => void;
}

export function AnnouncementModal({ onClose }: AnnouncementModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { title: "", message: "", audience: "all" } });

  const onSubmit = async (values: FormValues) => {
    setError(null);

    try {
      const { recipients } = await notificationService.sendAnnouncement({
        title: values.title.trim(),
        message: values.message.trim(),
        audience: values.audience,
      });
      toast.success(`Announcement sent to ${recipients} ${recipients === 1 ? "person" : "people"}`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Send announcement"
      description="Everyone in the selected audience gets a notification"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="announcement-form" loading={isSubmitting}>
            Send
          </Button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Select label="Audience" {...register("audience")}>
          <option value="all">Everyone</option>
          <option value="employee">Employees only</option>
          <option value="hr">HR only</option>
        </Select>

        <Input
          label="Title"
          placeholder="e.g. Office closed on Friday"
          error={errors.title?.message}
          {...register("title", {
            required: "Title is required",
            validate: (value) => value.trim().length > 0 || "Title is required",
            maxLength: { value: 100, message: "Title cannot exceed 100 characters" },
          })}
        />

        <Textarea
          label="Message"
          placeholder="Write your announcement"
          error={errors.message?.message}
          {...register("message", {
            required: "Message is required",
            validate: (value) => value.trim().length > 0 || "Message is required",
            maxLength: { value: 500, message: "Message cannot exceed 500 characters" },
          })}
        />
      </form>
    </Modal>
  );
}