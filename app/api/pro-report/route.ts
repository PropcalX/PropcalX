import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { generateProReportPdf } from "../../pdf/renderPdf";
import type { ProReportPayload } from "../../lib/reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  email: z.string().email(),
  lang: z.enum(["en", "zh"]),
  purpose: z.enum(["investment", "owner"]),
  country: z.enum(["uk", "uae", "th", "jp"]),
  currency: z.string().min(1),
  ui: z.record(z.string(), z.any()),
  inputs: z.object({
    price: z.number(),
    monthlyRent: z.number(),
    agentFeePct: z.number(),
    mortgagePct: z.number(),
    aprPct: z.number(),
    annualHoldingCosts: z.number(),
    otherOneOffCosts: z.number(),
    annualPropertyFeeSelf: z.number(),
    region: z.string(),
    project: z.string(),
    homeCount: z.enum(["first", "additional"]),
    residency: z.enum(["resident", "nonResident"]),
  }),
  results: z.object({
    currency: z.string(),
    stampDuty: z.number(),
    govSolicitorFeesEst: z.number(),
    otherOneOffCosts: z.number(),
    upfrontCosts: z.number(),
    loanAmount: z.number(),
    cashDeposit: z.number(),
    interestAnnual: z.number(),
    grossAnnualRent: z.number(),
    agentFeeAnnual: z.number(),
    holdingAnnual: z.number(),
    netAnnualRent: z.number(),
    netYieldPct: z.number(),
    cashOnCashPct: z.number(),
    councilTaxEst: z.number(),
    utilitiesEst: z.number(),
    propertyFeeSelf: z.number(),
    annualFixedOutgoings: z.number(),
    monthlyFixedOutgoings: z.number(),
    firstYearTotalOutgoings: z.number(),
    paymentPlan: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
      }),
    ),
    sensitivity: z.array(
      z.object({
        apr: z.number(),
        rentFactor: z.number(),
        cocPct: z.number(),
      }),
    ),
    fmt: z.record(z.string(), z.string()),
  }),
  meta: z.object({
    countryLabel: z.string(),
    createdAt: z.string(),
    website: z.string(),
  }),
  createdAtISO: z.string(),
  brand: z.object({
    name: z.string(),
    website: z.string(),
  }),
});

function getMissingEnvVars() {
  const required = ["RESEND_API_KEY", "REPORT_FROM_EMAIL"];
  return required.filter((key) => !process.env[key]);
}

export async function POST(request: NextRequest) {
  try {
    const rawPayload = await request.json();
    const parsed = payloadSchema.safeParse(rawPayload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const missingEnv = getMissingEnvVars();
    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required environment variables: ${missingEnv.join(", ")}`,
        },
        { status: 500 },
      );
    }

    const payload = parsed.data as ProReportPayload;
    const pdfResult = await generateProReportPdf(payload);

    if (!pdfResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: pdfResult.error,
        },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const filename =
      payload.lang === "zh" ? "MyGPC-Professional-Property-Report.pdf" : "MyGPC-Professional-Property-Report.pdf";

    const emailResult = await resend.emails.send({
      from: process.env.REPORT_FROM_EMAIL as string,
      to: [payload.email],
      subject:
        payload.lang === "zh"
          ? "MyGPC 专业房产测算报告"
          : "Your MyGPC Professional Property Report",
      html:
        payload.lang === "zh"
          ? `<p>您好，您的 MyGPC 专业房产测算报告已经生成，详见附件。</p><p>如果你希望获取更详细的项目建议，可以直接回复这封邮件。</p>`
          : `<p>Your MyGPC professional property report is ready and attached.</p><p>If you want a more detailed project recommendation, you can simply reply to this email.</p>`,
      attachments: [
        {
          filename,
          content: pdfResult.pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message:
        payload.lang === "zh" ? "报告已发送到客户邮箱" : "The report has been sent to the client email.",
      emailResult,
    });
  } catch (error) {
    console.error("Failed to generate or send report", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "MyGPC professional report endpoint is ready.",
  });
}
