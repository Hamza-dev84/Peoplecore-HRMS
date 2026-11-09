export const getSafeRedirect = (value: string | null): string => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.startsWith("/login") ||
    value.startsWith("/register")
  ) {
    return "/dashboard";
  }

  return value;
};