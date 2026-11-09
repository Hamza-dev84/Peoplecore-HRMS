import { getImageUrl } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
}

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export function Avatar({ name, src, size = 36 }: AvatarProps) {
  const imageUrl = getImageUrl(src);
  const dimensions = { width: size, height: size };

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        style={dimensions}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      style={{ ...dimensions, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
    >
      {getInitials(name)}
    </span>
  );
}