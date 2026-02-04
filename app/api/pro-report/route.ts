// app/api/pro-report/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import ProReportPDF from "@/app/pdf/ProReport";

export const runtime = "nodejs"; // important for pdf/email
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  lang: z.enum(["en", "zh"]).default("en"),

  purpose: z.enum(["investment", "owner"]),
  country: z.enum(["uk", "uae", "th", "jp"]),
  currency: z.string().min(1).max(10),

  price: z.number().nonnegative(),
  monthlyRent: z.number().nonnegative().optional(),

  mortgagePct: z.number().min(0).max(100).optional(),
  aprPct: z.number().min(0).max(100).optional(),
  agentFeePct: z.number().min(0).max(100).optional(),

  annualHoldingCosts: z.number().nonnegative().optional(),
  otherOneOffCosts: z.number().nonnegative().optional(),

  ukResidency: z.enum(["resident", "nonResident"]).optional(),
  ukHomeCount: z.enum(["first", "additional"]).optional(),

  results: z.object({
    upfrontCosts: z.number().nonnegative(),
    grossAnnualRent: z.number().nonnegative(),
    agentFeeAnnual: z.number().nonnegative(),
    interestAnnual: z.number().nonnegative(),
    netAnnualRent: z.number(),

    netYieldPct: z.number(),
    cashOnCashPct: z.number(),

    ownerAnnualOutgoings: z.number().optional(),
    ownerMonthlyOutgoings: z.number().optional(),

    breakdown: z.array(
      z.object({
        label: z.string().min(1),
        value: z.number().nonnegative(),
      })
    ),
  }),
});

function subject(lang: "en" | "zh") {
  return lang === "zh" ? "你的 MyGPC 专业版测算报告（PDF）" : "Your MyGPC Pro Report (PDF)";
}
function emailBody(lang: "en" | "zh") {
  if (lang === "zh") {
    return `你好！\n\n附件是你的 MyGPC 专业版测算报告（PDF）。\n\n提示：本报告为预估结果，仅供参考。\n\n— MyGPC`;
  }
  return `Hi!\n\nAttached is your MyGPC Pro Report (PDF).\n\nNote: estimates only.\n\n— MyGPC`;
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = schema.parse(json);

    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;

    if (!resendKey || !from) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY or FROM_EMAIL" },
        { status: 500 }
      );
    }

    // 1) Render PDF
    const pdfBuffer = await renderToBuffer(
      ProReportPDF({
        data: {
          ...data,
          createdAtISO: new Date().toISOString(),
          brand: { name: "MyGPC", website: "mygpc.co" },
        },
      }) as any
    );

    // 2) Send email with attachment
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from,
      to: data.email,
      subject: subject(data.lang),
      text: emailBody(data.lang),
      attachments: [
        {
          filename: data.lang === "zh" ? "MyGPC-专业版报告.pdf" : "MyGPC-Pro-Report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}