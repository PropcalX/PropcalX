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
  reportDetails: z.object({
    email: z.string().email(),
    postcode: z.string(),
    development: z.string(),
    plotNumber: z.string(),
    levelAspect: z.string(),
    propertyType: z.string(),
    bedrooms: z.string(),
    internalAreaSqft: z.string(),
    internalAreaSqm: z.string(),
    totalAreaSqm: z.string(),
    askingPrice: z.string(),
    discountPct: z.string(),
    fxRate: z.string(),
    legalFee: z.string(),
    stampDutyAdminFee: z.string(),
    amlCheckFee: z.string(),
    landRegistryFee: z.string(),
    landSearchFee: z.string(),
    leaseholdFee: z.string(),
    chapsFee: z.string(),
    annualMaintenanceFee: z.string(),
    serviceChargePerSqft: z.string(),
    monthlyRentOverride: z.string(),
    reservationFee: z.string(),
    exchangeDepositPct: z.string(),
    completionDate: z.string(),
    notes: z.string(),
  }),
  rentalMarket: z
    .object({
      postcode: z.string(),
      source: z.literal("rightmove"),
      searchUrl: z.string(),
      averagePcm: z.number(),
      medianPcm: z.number(),
      minPcm: z.number(),
      maxPcm: z.number(),
      listingCount: z.number(),
      sampleListings: z.array(
        z.object({
          title: z.string(),
          pricePcm: z.number(),
          bedrooms: z.number().optional(),
          propertyType: z.string().optional(),
          url: z.string().optional(),
        }),
      ),
    })
    .nullable()
    .optional(),
  financialBreakdown: z.object({
    currency: z.string(),
    cnyRate: z.number(),
    development: z.string(),
    plotNumber: z.string(),
    levelAspect: z.string(),
    postcode: z.string(),
    internalAreaSqft: z.number(),
    internalAreaSqm: z.number(),
    totalAreaSqm: z.number(),
    askingPrice: z.number(),
    discountedPrice: z.number(),
    monthlyRent: z.number(),
    annualRentalIncome: z.number(),
    rentalPerWeek: z.number(),
    annualMaintenanceFee: z.number(),
    annualHoldingCosts: z.number(),
    totalAnnualPropertyCosts: z.number(),
    annualCashProfit: z.number(),
    annualLeveragedProfit: z.number(),
    netAnnualYieldPct: z.number(),
    leveragedYieldPct: z.number(),
    loanAmount: z.number(),
    annualInterestCost: z.number(),
    feeLines: z.array(z.object({ label: z.string(), value: z.number() })),
    oneOffCostsTotal: z.number(),
    totalPurchaseCost: z.number(),
    paymentPlan: z.array(z.object({ label: z.string(), date: z.string().optional(), value: z.number() })),
    notes: z.string(),
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
    paymentPlan: z.array(z.object({ label: z.string(), value: z.number() })),
    sensitivity: z.array(z.object({ apr: z.number(), rentFactor: z.number(), cocPct: z.number() })),
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
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!process.env.REPORT_FROM_EMAIL && !process.env.FROM_EMAIL) {
    missing.push("REPORT_FROM_EMAIL or FROM_EMAIL");
  }
  return missing;
}

function getSenderEmail() {
  return process.env.REPORT_FROM_EMAIL || process.env.FROM_EMAIL || "";
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
      return NextResponse.json({ success: false, error: pdfResult.error }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailResult = await resend.emails.send({
      from: getSenderEmail(),
      to: [payload.email],
      subject:
        payload.lang === "zh"
          ? "MyGPC Financial Breakdown 专业报告"
          : "Your MyGPC Financial Breakdown Report",
      html:
        payload.lang === "zh"
          ? "<p>您好，您的 MyGPC Financial Breakdown 专业报告已经生成，详见附件。</p><p>如需进一步修改项目参数，可以直接回复这封邮件。</p>"
          : "<p>Your MyGPC Financial Breakdown report is ready and attached.</p><p>If you want to refine the project assumptions, simply reply to this email.</p>",
      attachments: [
        {
          filename: "MyGPC-Professional-Property-Report.pdf",
          content: pdfResult.pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: payload.lang === "zh" ? "报告已发送到客户邮箱" : "The report has been sent to the client email.",
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
    message: "MyGPC financial breakdown report endpoint is ready.",
  });
}
