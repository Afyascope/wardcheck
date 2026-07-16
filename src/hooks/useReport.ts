import { useMutation } from "@tanstack/react-query";
import { submitReport } from "@/api/public";
import type { CreateReportInput } from "@/types/api";

export function useCreateReport() {
  return useMutation({
    mutationFn: ({
      data,
      fingerprintHash,
    }: {
      data: CreateReportInput;
      fingerprintHash?: string;
    }) => submitReport(data, { fingerprintHash }),
  });
}
