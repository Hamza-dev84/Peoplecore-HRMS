
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const config = {
  apiUrl,
  apiOrigin: apiUrl.replace(/\/api\/?$/, ""),
};