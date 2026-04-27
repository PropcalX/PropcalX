import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import ProReport from "./ProReport";
import type { ProReportPayload } from "../lib/reporting";

export async function generateProReportPdf(data: ProReportPayload) {
  try {
    const component = React.createElement(ProReport, { data });
    const pdfBuffer = await renderToBuffer(component as any);
    return { success: true, pdfBuffer } as const;
  } catch (error) {
    console.error("Failed to render PDF", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown PDF rendering error",
    } as const;
  }
}
