import axios from "axios";
import { api } from "@/lib/axios";
import { downloadFile } from "@/lib/download";

export type ReportType = "employees" | "attendance" | "leaves";
export type ReportFormat = "csv" | "pdf";

export const reportService = {
  async download(
    type: ReportType,
    format: ReportFormat,
    params?: Record<string, string | undefined>
  ): Promise<void> {
    try {
      const response = await api.get<Blob>(`/reports/${type}`, {
        params: { ...params, format },
        responseType: "blob",
      });

      const date = new Date().toISOString().slice(0, 10);
      downloadFile(response.data, `${type}-report-${date}.${format}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          throw new Error((JSON.parse(text) as { message?: string }).message ?? "Download failed");
        } catch (parseError) {
          if (parseError instanceof SyntaxError) throw new Error("Download failed");
          throw parseError;
        }
      }
      throw error;
    }
  },
};