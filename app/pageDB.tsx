"use client";
type CountryCode = "uk" | "uae" | "th" | "jp";
type PurposeCode = "investment" | "owner";
type LangCode = "en" | "zh";

function normalizeCountry(v: any): CountryCode {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "uk" || s.includes("united kingdom") || s.includes("英国")) return "uk";
  if (s === "uae" || s.includes("dubai") || s.includes("阿联酋") || s.includes("迪拜")) return "uae";
  if (s === "th" || s.includes("thailand") || s.includes("泰国")) return "th";
  if (s === "jp" || s.includes("japan") || s.includes("日本")) return "jp";
  return "uk";
}

function normalizePurpose(v: any): PurposeCode {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "investment" || s.includes("投资")) return "investment";
  if (s === "owner" || s.includes("自住")) return "owner";
  return "investment";
}

function currencyByCountry(country: CountryCode) {
  const map: Record<CountryCode, "GBP" | "AED" | "THB" | "JPY"> = {
    uk: "GBP",
    uae: "AED",
    th: "THB",
    jp: "JPY",
  };
  return map[country];
}

function safeNumber(v: any): number {
  // 兼容 420,000 / 420000 / "" / undefined
  const s = String(v ?? "").replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

import React, { useMemo, useState } from "react";

type Lang = "en" | "zh";
type Purpose = "investment" | "selfuse";
type HomeCount = "first" | "additional";
type Residency = "resident" | "nonResident";

type Inputs = {
  lang: Lang;
  purpose: Purpose;
  country: CountryCode;

  // Optional metadata
  region: string;
  project: string;

  // UK-only toggles (we keep them visible but meaningful mainly for UK)
  homeCount: HomeCount;
  residency: Residency;

  // Core numbers (strings for input formatting)
  price: string; // property price
  monthlyRent: string; // investment only
  agentFeePct: string; // investment
  mortgagePct: string; // investment
  aprPct: string; // investment
  annualHoldingCosts: string; // can apply to both
  otherOneOffCosts: string; // lawyer/furniture etc (both)

  // self-use only extra
  annualPropertyFeeSelf: string; // user input: service charge/management etc (if they want separate)
};

type Result = {
  currency: string;

  // One-off
  stampDuty: number;
  govSolicitorFeesEst: number;
  otherOneOffCosts: number;
  upfrontCosts: number;

  // Finance (investment)
  loanAmount: number;
  cashDeposit: number;
  interestAnnual: number;

  // Investment outputs
  grossAnnualRent: number;
  agentFeeAnnual: number;
  holdingAnnual: number;
  netAnnualRent: number;
  netYieldPct: number;
  cashOnCashPct: number;

  // Self-use outputs
  councilTaxEst: number;
  utilitiesEst: number;
  propertyFeeSelf: number;
  annualFixedOutgoings: number;
  monthlyFixedOutgoings: number;
  firstYearTotalOutgoings: number; // annual fixed + upfront

  // Sensitivity (investment)
  sensitivity: { apr: number; rentFactor: number; cocPct: number }[];
};

const CURRENCY_BY_COUNTRY: Record<CountryCode, string> = {
  uk: "GBP",
  uae: "AED",
  th: "THB",
  jp: "JPY",
};

const COUNTRY_NAME: Record<Lang, Record<CountryCode, string>> = {
  en: { uk: "UK", uae: "UAE", th: "Thailand", jp: "Japan" },
  zh: { uk: "英国", uae: "阿联酋", th: "泰国", jp: "日本" },
};

const UI = (lang: Lang) => {
  const en = {
    brand: "MyGPC",
    title: "Global Property Calculator",
    subtitle: "My professional Global Property Investment Calculator.",

    language: "Language",
    purpose: "Purpose",
    purposeInvestment: "Investment",
    purposeSelfuse: "Owner-occupier (self-use)",

    country: "Country",
    region: "Region (optional)",
    project: "Project (optional)",

    price: "Property price",
    monthlyRent: "Monthly rent",
    homeCount: "Home count (UK)",
    first: "First home",
    additional: "Additional home",
    residency: "Buyer residency (UK)",
    resident: "Resident buyer",
    nonResident: "Non-resident buyer",

    agentFeePct: "Letting agent fee",
    mortgagePct: "Mortgage",
    aprPct: "APR",
    annualHoldingCosts: "Annual holding costs (optional)",
    otherOneOffCosts: "Other one-off costs (optional)",
    otherPlaceholder: "e.g. lawyer + furniture pack",

    propertyFeeSelf: "Property fee / service charge (self-use input)",

    calc: "Calculate",

    // Results labels
    countryLabel: "Country",
    currencyLabel: "Currency",
    estimateTag: "Estimate",

    // Investment headline
    invTitle: "Estimated Cash-on-Cash ROI",
    netYield: "Net yield (on price)",
    netAnnualRent: "Net annual rent",
    upfrontCosts: "Upfront costs",

    grossAnnualRent: "Gross annual rent",
    agentFeeAnnual: "Letting agent fee (annual)",
    holdingAnnual: "Annual holding costs",
    interestAnnual: "Annual interest cost",
    loanAmount: "Loan amount",
    cashDeposit: "Cash deposit",

    breakdown: "Cost breakdown",
    stampDuty: "Stamp Duty (SDLT)",
    govFees: "Government / Solicitor fees (Estimated)",

    annualCashflow: "Annual cashflow",

    sensitivity: "Sensitivity (Rent vs APR)",
    sensitivityHint: "Cash-on-Cash ROI (%) under Rent change × APR change. Interest-only assumed (MVP).",

    // Self-use headline
    selfTitle: "Estimated Outgoings (Self-use)",
    annualFixed: "Annual fixed outgoings",
    perMonth: "Per month",
    firstYear: "First-year total outgoings",
    councilTax: "Council tax (Estimated)",
    utilities: "Utilities + broadband (Estimated)",
    annualFixedHint: "Annual fixed outgoings exclude mortgage repayment (MVP).",

    // Pro report
    proTitle: "Pro Report (PDF)",
    proHint: "Enter your email to generate and receive a branded PDF report.",
    email: "Email",
    send: "Get Pro Report",
    sending: "Sending…",
    sent: "Sent! Please check your email (PDF attached).",
    failed: "Failed:",

    disclaimer:
      "Disclaimer: Estimates only. Taxes/fees vary by buyer profile and local regulations. This report is not financial advice.",
    noteGov:
      'Note: "Government / Solicitor fees" are estimated for MVP and may differ by city, transaction type, and local rules.',
  };

  const zh = {
    brand: "MyGPC",
    title: "全球房产投资计算器",
    subtitle: "你的专业房产投资计算器.",

    language: "语言",
    purpose: "用途",
    purposeInvestment: "投资",
    purposeSelfuse: "自住",

    country: "国家",
    region: "区域（可选）",
    project: "房产项目（可选）",

    price: "房产价格",
    monthlyRent: "月租金",
    homeCount: "首套/二套（英国）",
    first: "首套",
    additional: "二套/多套",
    residency: "买家身份（英国）",
    resident: "本地买家",
    nonResident: "海外买家",

    agentFeePct: "租房中介费",
    mortgagePct: "贷款比例",
    aprPct: "年利率",
    annualHoldingCosts: "物业费/地税",
    otherOneOffCosts: "其他一次性费用（可选）",
    otherPlaceholder: "例如：律师费、家具包等",

    propertyFeeSelf: "年度其他持有成本(如会计费)",

    calc: "计算",

    countryLabel: "国家",
    currencyLabel: "币种",
    estimateTag: "预估",

    invTitle: "预估现金回报率（Cash-on-Cash ROI）",
    netYield: "净回报率（按房价）",
    netAnnualRent: "年度净租金",
    upfrontCosts: "一次性成本合计",

    grossAnnualRent: "年度总租金",
    agentFeeAnnual: "租房中介费（年度）",
    holdingAnnual: "年度持有成本",
    interestAnnual: "年度利息成本",
    loanAmount: "贷款额",
    cashDeposit: "首付现金",

    breakdown: "成本明细",
    stampDuty: "印花税（SDLT）",
    govFees: "政府/律师等费用（预估）",

    annualCashflow: "年度现金流",

    sensitivity: "敏感性分析（租金 vs 利率）",
    sensitivityHint: "表格显示：租金变化 × 利率变化下的现金回报率（MVP 假设只算利息）。",

    selfTitle: "预估支出（自住）",
    annualFixed: "年度固定支出",
    perMonth: "折合每月",
    firstYear: "第一年总支出（固定 + 一次性）",
    councilTax: "市政税/地方税（预估）",
    utilities: "水电煤网费（预估）",
    annualFixedHint: "年度固定支出不含按揭本金偿还（MVP）。",

    proTitle: "专业报告（PDF）",
    proHint: "填写邮箱，生成并发送带品牌的 PDF 报告。",
    email: "邮箱",
    send: "获取 Pro 报告",
    sending: "发送中…",
    sent: "已发送！请查收邮箱（PDF 附件）。",
    failed: "发送失败：",

    disclaimer:
      "免责声明：仅为估算。税费随买家身份、城市、政策等变化。本报告不构成投资建议。",
    noteGov:
      "注：政府/律师等费用为MVP预估值，可能因城市、交易类型、当地规则而不同。",
  };

  return lang === "en" ? en : zh;
};

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function parseNum(text: string) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, "").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatThousandsInput(raw: string) {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(".");
  const intPart = parts[0];
  const decPart = parts[1]?.slice(0, 2);
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

function fmtMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(v));
}

function fmtPct2(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(2)}%`;
}

/**
 * ✅ UK SDLT rates per your screenshot:
 * 0% up to 125k
 * 2% 125k-250k
 * 5% 250k-925k
 * 10% 925k-1.5m
 * 12% above 1.5m
 * Additional home surcharge: +5% (MVP concept)
 * Non-resident surcharge: +2% (MVP concept)
 */
function calcUKStampDuty(
  price: number,
  homeCount: HomeCount,
  residency: Residency
) {
  const p = Math.max(0, Math.round(price || 0));

  const isAdditional = homeCount === "additional";
  const isNonResident = residency === "nonResident";

  // UK surcharge concepts (MVP):
  // - Additional property surcharge: +3%
  // - Non-resident surcharge: +2%
  const extra = (isAdditional ? 0.03 : 0) + (isNonResident ? 0.02 : 0);

  const bandTax = (slice: number, rate: number) =>
    slice > 0 ? slice * (rate + extra) : 0;

  // === First-time buyer relief (treat "first" as first-time buyer for MVP) ===
  // If price <= 500,000:
  //   - 0% up to 300,000
  //   - 5% on 300,000 to 500,000
  // Otherwise: fall back to standard rates.
  if (homeCount === "first" && p <= 500_000) {
    const sliceAt5 = Math.max(0, Math.min(p, 500_000) - 300_000);
    const tax = sliceAt5 * (0.05 + extra);
    return Math.round(tax);
  }

  // === Standard SDLT rates ===
  // 0% up to 125,000
  // 2% 125,001 - 250,000
  // 5% 250,001 - 925,000
  // 10% 925,001 - 1,500,000
  // 12% above 1,500,000
  const s2 = Math.max(0, Math.min(p, 250_000) - 125_000);
  const s5 = Math.max(0, Math.min(p, 925_000) - 250_000);
  const s10 = Math.max(0, Math.min(p, 1_500_000) - 925_000);
  const s12 = Math.max(0, p - 1_500_000);

  const tax =
    bandTax(s2, 0.02) +
    bandTax(s5, 0.05) +
    bandTax(s10, 0.10) +
    bandTax(s12, 0.12);

  return Math.round(tax);
}

// Other countries stamp duty MVP placeholders (keep simple and consistent)
function estimateStampDutyUAE(price: number) {
  return Math.round(Math.max(0, price * 0.04));
}
function estimateStampDutyTH(price: number) {
  return Math.round(Math.max(0, price * 0.02));
}
function estimateStampDutyJP(price: number) {
  return Math.round(Math.max(0, price * 0.01));
}

// Government / solicitor / admin fee estimate (MVP)
function estimateGovSolicitorFees(country: CountryCode, price: number) {
  const p = Math.max(0, price || 0);
  if (country === "uk") return Math.round(Math.max(1650, p * 0.004));
  if (country === "uae") return Math.round(Math.max(4580, p * 0.0015));
  if (country === "th") return Math.round(Math.max(25000, p * 0.002));
  return Math.round(Math.max(120000, p * 0.0015)); // jp
}

// Self-use estimates (MVP, UK-focused)
function estimateCouncilTaxUK(price: number) {
  const p = Math.max(0, price || 0);
  return Math.round(Math.min(3000, Math.max(1200, p * 0.005)));
}
function estimateUtilitiesUK() {
  return 2000;
}

function computeResult(inputs: Inputs): Result {
  const country = inputs.country;
  const currency = CURRENCY_BY_COUNTRY[country];

  const price = parseNum(inputs.price);
  const monthlyRent = parseNum(inputs.monthlyRent);
  const agentFeePct = clampPct(parseNum(inputs.agentFeePct));
  const mortgagePct = clampPct(parseNum(inputs.mortgagePct));
  const aprPct = clampPct(parseNum(inputs.aprPct));
  const annualHoldingCosts = parseNum(inputs.annualHoldingCosts);
  const otherOneOffCosts = parseNum(inputs.otherOneOffCosts);

  // One-off: stamp duty
  let stampDuty = 0;
  if (country === "uk") stampDuty = calcUKStampDuty(price, inputs.homeCount, inputs.residency);
  if (country === "uae") stampDuty = estimateStampDutyUAE(price);
  if (country === "th") stampDuty = estimateStampDutyTH(price);
  if (country === "jp") stampDuty = estimateStampDutyJP(price);

  const govSolicitorFeesEst = estimateGovSolicitorFees(country, price);
  const upfrontCosts = Math.max(0, stampDuty + govSolicitorFeesEst + otherOneOffCosts);

  // Finance (investment)
  const loanAmount = Math.round((price * mortgagePct) / 100);
  const cashDeposit = Math.max(0, Math.round(price - loanAmount));
  const interestAnnual = Math.round((loanAmount * aprPct) / 100); // interest-only MVP

  // Investment rents
  const grossAnnualRent = Math.round(monthlyRent * 12);
  const agentFeeAnnual = Math.round((grossAnnualRent * agentFeePct) / 100);
  const holdingAnnual = Math.round(annualHoldingCosts);

  const netAnnualRent = Math.round(grossAnnualRent - agentFeeAnnual - holdingAnnual - interestAnnual);

  const netYieldPct = price > 0 ? (netAnnualRent / price) * 100 : 0;
  const cashOnCashPct =
    cashDeposit + upfrontCosts > 0 ? (netAnnualRent / (cashDeposit + upfrontCosts)) * 100 : 0;

  // Self-use
  const councilTaxEst = country === "uk" ? estimateCouncilTaxUK(price) : 0;
  const utilitiesEst = country === "uk" ? estimateUtilitiesUK() : 0;
  const propertyFeeSelf = Math.round(parseNum(inputs.annualPropertyFeeSelf));

  const annualFixedOutgoings =
    Math.round(councilTaxEst + utilitiesEst + annualHoldingCosts + propertyFeeSelf);

  const monthlyFixedOutgoings = Math.round(annualFixedOutgoings / 12);

  const firstYearTotalOutgoings = Math.round(annualFixedOutgoings + upfrontCosts);

  // Sensitivity (investment): Rent [-10%, base, +10%] × APR [3,5,7]
  const aprGrid = [3, 5, 7];
  const rentFactors = [0.9, 1.0, 1.1];
  const sensitivity: { apr: number; rentFactor: number; cocPct: number }[] = [];
  for (const a of aprGrid) {
    for (const rf of rentFactors) {
      const ga = Math.round(grossAnnualRent * rf);
      const af = Math.round((ga * agentFeePct) / 100);
      const ia = Math.round((loanAmount * a) / 100);
      const na = Math.round(ga - af - holdingAnnual - ia);
      const coc = cashDeposit + upfrontCosts > 0 ? (na / (cashDeposit + upfrontCosts)) * 100 : 0;
      sensitivity.push({ apr: a, rentFactor: rf, cocPct: coc });
    }
  }

  return {
    currency,

    stampDuty,
    govSolicitorFeesEst,
    otherOneOffCosts: Math.round(otherOneOffCosts),
    upfrontCosts,

    loanAmount,
    cashDeposit,
    interestAnnual,

    grossAnnualRent,
    agentFeeAnnual,
    holdingAnnual,
    netAnnualRent,
    netYieldPct,
    cashOnCashPct,

    councilTaxEst,
    utilitiesEst,
    propertyFeeSelf,
    annualFixedOutgoings,
    monthlyFixedOutgoings,
    firstYearTotalOutgoings,

    sensitivity,
  };
}

function GoldCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2b2b2b] bg-[#121212] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="text-xs text-[#d7c28a]">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-[#9a9a9a]">{subtitle}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#242424] py-2 last:border-b-0">
      <div className="text-sm text-[#cfcfcf]">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PercentInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 pr-10 text-white outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
        placeholder={placeholder}
        inputMode="decimal"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#b6b6b6]">
        %
      </div>
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
      value={value}
      onChange={(e) => onChange(formatThousandsInput(e.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>({
    lang: "zh",
    purpose: "investment",
    country: "uk",

    region: "",
    project: "",

    homeCount: "first",
    residency: "resident",

    price: "420,000",
    monthlyRent: "1,800",
    agentFeePct: "10",
    mortgagePct: "0",
    aprPct: "5",
    annualHoldingCosts: "2,500",
    otherOneOffCosts: "",

    annualPropertyFeeSelf: "2,500",
  });

  const ui = UI(inputs.lang);
  const result = useMemo(() => computeResult(inputs), [inputs]);

  const isInvestment = inputs.purpose === "investment";
  const currency = result.currency;

  // Pro report email send (client -> /api/pro-report)
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState<string>("");

  async function onSendProReport() {
    try {
      setSendStatus("sending");
      setSendError("");

      const country = normalizeCountry(inputs.country);
      const purpose = normalizePurpose(inputs.purpose);
      const lang: LangCode = inputs.lang === "en" ? "en" : "zh";

      // 兜底币种，避免undefined
      const currencySafe = currencyByCountry(country);

      // 解析所有数字，避免字符串格式导致PDF渲染异常
      const priceNum = parseNum(inputs.price);
      const monthlyRentNum = parseNum(inputs.monthlyRent);
      const agentFeePctNum = clampPct(parseNum(inputs.agentFeePct));
      const mortgagePctNum = clampPct(parseNum(inputs.mortgagePct));
      const aprPctNum = clampPct(parseNum(inputs.aprPct));
      const annualHoldingCostsNum = parseNum(inputs.annualHoldingCosts);
      const otherOneOffCostsNum = parseNum(inputs.otherOneOffCosts);
      const annualPropertyFeeSelfNum = parseNum(inputs.annualPropertyFeeSelf);

      // 构造PDF需要的完整数据（包含中英文文案）
      const payload = {
        email,
        lang,
        purpose,
        country,
        currency: currencySafe,
        // 传递UI文案，确保PDF能渲染对应语言的文字
        ui: UI(lang),
        // 基础输入数据
        inputs: {
          price: priceNum,
          monthlyRent: monthlyRentNum,
          agentFeePct: agentFeePctNum,
          mortgagePct: mortgagePctNum,
          aprPct: aprPctNum,
          annualHoldingCosts: annualHoldingCostsNum,
          otherOneOffCosts: otherOneOffCostsNum,
          annualPropertyFeeSelf: annualPropertyFeeSelfNum,
          region: inputs.region || "",
          project: inputs.project || "",
          homeCount: inputs.homeCount,
          residency: inputs.residency,
        },
        // 计算结果
        results: {
          ...result,
          currency: currencySafe,
          // 格式化后的金额/百分比，方便PDF直接使用
          fmt: {
            cashOnCashPct: fmtPct2(result.cashOnCashPct),
            netYieldPct: fmtPct2(result.netYieldPct),
            netAnnualRent: fmtMoney(result.netAnnualRent),
            upfrontCosts: fmtMoney(result.upfrontCosts),
            grossAnnualRent: fmtMoney(result.grossAnnualRent),
            agentFeeAnnual: fmtMoney(result.agentFeeAnnual),
            holdingAnnual: fmtMoney(result.holdingAnnual),
            loanAmount: fmtMoney(result.loanAmount),
            cashDeposit: fmtMoney(result.cashDeposit),
            interestAnnual: fmtMoney(result.interestAnnual),
            stampDuty: fmtMoney(result.stampDuty),
            govSolicitorFeesEst: fmtMoney(result.govSolicitorFeesEst),
            otherOneOffCosts: fmtMoney(result.otherOneOffCosts),
            councilTaxEst: fmtMoney(result.councilTaxEst),
            utilitiesEst: fmtMoney(result.utilitiesEst),
            propertyFeeSelf: fmtMoney(result.propertyFeeSelf),
            annualFixedOutgoings: fmtMoney(result.annualFixedOutgoings),
            monthlyFixedOutgoings: fmtMoney(result.monthlyFixedOutgoings),
            firstYearTotalOutgoings: fmtMoney(result.firstYearTotalOutgoings),
          }
        },
        // 元数据
        meta: {
          countryLabel: COUNTRY_NAME[lang][country],
          createdAt: new Date().toLocaleString(lang === "en" ? "en-US" : "zh-CN"),
          website: "https://www.mygpc.co"
        }
      };

      // 发送请求到API
      const res = await fetch("/api/pro-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP Error: ${res.status}`);
        throw new Error(text);
      }

      setSendStatus("sent");
    } catch (e: any) {
      setSendStatus("error");
      setSendError(e?.message || "Unknown error");
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-[#d7c28a]">{ui.brand}</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{ui.title}</h1>
            <p className="mt-2 text-sm text-[#b6b6b6]">{ui.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-[#b6b6b6]">{ui.language}</div>
            <div className="inline-flex rounded-xl border border-[#2b2b2b] bg-[#101010] p-1">
              <button
                type="button"
                onClick={() => setInputs((s) => ({ ...s, lang: "en" }))}
                className={`rounded-lg px-3 py-1 text-sm ${
                  inputs.lang === "en" ? "bg-[#d7c28a] text-black" : "text-[#cfcfcf]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setInputs((s) => ({ ...s, lang: "zh" }))}
                className={`rounded-lg px-3 py-1 text-sm ${
                  inputs.lang === "zh" ? "bg-[#d7c28a] text-black" : "text-[#cfcfcf]"
                }`}
              >
                中文
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-8 rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Purpose */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.purpose}</label>
              <select
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.purpose}
                onChange={(e) => setInputs((s) => ({ ...s, purpose: e.target.value as Purpose }))}
              >
                <option value="investment">{ui.purposeInvestment}</option>
                <option value="selfuse">{ui.purposeSelfuse}</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.country}</label>
              <select
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.country}
                onChange={(e) => setInputs((s) => ({ ...s, country: e.target.value as CountryCode }))}
              >
                <option value="uk">{COUNTRY_NAME[inputs.lang].uk}</option>
                <option value="uae">{COUNTRY_NAME[inputs.lang].uae}</option>
                <option value="th">{COUNTRY_NAME[inputs.lang].th}</option>
                <option value="jp">{COUNTRY_NAME[inputs.lang].jp}</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.region}</label>
              <input
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.region}
                onChange={(e) => setInputs((s) => ({ ...s, region: e.target.value }))}
                placeholder={inputs.lang === "en" ? "e.g. London / Dubai Marina" : "例如：伦敦 / 迪拜码头"}
              />
            </div>

            {/* Project */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.project}</label>
              <input
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.project}
                onChange={(e) => setInputs((s) => ({ ...s, project: e.target.value }))}
                placeholder={inputs.lang === "en" ? "e.g. London Dock" : "例如：London Dock"}
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm text-[#d7c28a]">
                {ui.price} ({currency})
              </label>
              <div className="mt-2">
                <MoneyInput
                  value={inputs.price}
                  onChange={(v) => setInputs((s) => ({ ...s, price: v }))}
                  placeholder="e.g. 420,000"
                />
              </div>
            </div>

            {/* UK residency */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.residency}</label>
              <select
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.residency}
                onChange={(e) => setInputs((s) => ({ ...s, residency: e.target.value as Residency }))}
              >
                <option value="resident">{ui.resident}</option>
                <option value="nonResident">{ui.nonResident}</option>
              </select>
            </div>

            {/* UK homeCount */}
            <div>
              <label className="text-sm text-[#d7c28a]">{ui.homeCount}</label>
              <select
                className="mt-2 w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
                value={inputs.homeCount}
                onChange={(e) => setInputs((s) => ({ ...s, homeCount: e.target.value as HomeCount }))}
              >
                <option value="first">{ui.first}</option>
                <option value="additional">{ui.additional}</option>
              </select>
            </div>

            {/* Monthly rent */}
            <div className={isInvestment ? "" : "opacity-50"}>
              <label className="text-sm text-[#d7c28a]">
                {ui.monthlyRent} ({currency})
              </label>
              <div className="mt-2">
                <MoneyInput
                  value={inputs.monthlyRent}
                  onChange={(v) => setInputs((s) => ({ ...s, monthlyRent: v }))}
                  placeholder="e.g. 1,800"
                />
              </div>
            </div>

            {/* Agent fee % */}
            <div className={isInvestment ? "" : "opacity-50"}>
              <label className="text-sm text-[#d7c28a]">
                {ui.agentFeePct} (%)
              </label>
              <div className="mt-2">
                <PercentInput
                  value={inputs.agentFeePct}
                  onChange={(v) => setInputs((s) => ({ ...s, agentFeePct: v }))}
                />
              </div>
            </div>

            {/* Mortgage % */}
            <div className={isInvestment ? "" : "opacity-50"}>
              <label className="text-sm text-[#d7c28a]">
                {ui.mortgagePct} (%)
              </label>
              <div className="mt-2">
                <PercentInput
                  value={inputs.mortgagePct}
                  onChange={(v) => setInputs((s) => ({ ...s, mortgagePct: v }))}
                />
              </div>
            </div>

            {/* APR % */}
            <div className={isInvestment ? "" : "opacity-50"}>
              <label className="text-sm text-[#d7c28a]">
                {ui.aprPct} (%)
              </label>
              <div className="mt-2">
                <PercentInput
                  value={inputs.aprPct}
                  onChange={(v) => setInputs((s) => ({ ...s, aprPct: v }))}
                />
              </div>
            </div>

            {/* Annual holding */}
            <div>
              <label className="text-sm text-[#d7c28a]">
                {ui.annualHoldingCosts} ({currency})
              </label>
              <div className="mt-2">
                <MoneyInput
                  value={inputs.annualHoldingCosts}
                  onChange={(v) => setInputs((s) => ({ ...s, annualHoldingCosts: v }))}
                  placeholder="e.g. 2,500"
                />
              </div>
            </div>

            {/* Other one-off */}
            <div>
              <label className="text-sm text-[#d7c28a]">
                {ui.otherOneOffCosts} ({currency})
              </label>
              <div className="mt-2">
                <MoneyInput
                  value={inputs.otherOneOffCosts}
                  onChange={(v) => setInputs((s) => ({ ...s, otherOneOffCosts: v }))}
                  placeholder={ui.otherPlaceholder}
                />
              </div>
            </div>

            {/* Self-use property fee */}
            <div className={inputs.purpose === "selfuse" ? "" : "opacity-50"}>
              <label className="text-sm text-[#d7c28a]">
                {ui.propertyFeeSelf} ({currency})
              </label>
              <div className="mt-2">
                <MoneyInput
                  value={inputs.annualPropertyFeeSelf}
                  onChange={(v) => setInputs((s) => ({ ...s, annualPropertyFeeSelf: v }))}
                  placeholder="e.g. 2,500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="w-full rounded-2xl bg-[#d7c28a] px-6 py-4 text-base font-semibold text-black shadow-[0_15px_40px_rgba(215,194,138,0.25)]"
              onClick={() => window.scrollTo({ top: 999999, behavior: "smooth" })}
            >
              {ui.calc}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10 rounded-3xl border border-[#2b2b2b] bg-gradient-to-b from-[#141414] to-[#0b0b0b] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="text-xs text-[#d7c28a]">
              {ui.countryLabel}: {COUNTRY_NAME[inputs.lang][inputs.country]} · {ui.currencyLabel}: {currency}
              {inputs.region ? ` · ${ui.region.replace("（可选）", "").replace("(optional)", "").trim()}: ${inputs.region}` : ""}
              {inputs.project ? ` · ${ui.project.replace("（可选）", "").replace("(optional)", "").trim()}: ${inputs.project}` : ""}
            </div>
            <div className="rounded-2xl border border-[#2b2b2b] bg-[#0f0f0f] px-4 py-2 text-xs text-[#b6b6b6]">
              {ui.estimateTag}
            </div>
          </div>

          {isInvestment ? (
            <>
              {/* Investment headline */}
              <div className="mt-6 rounded-3xl border border-[#2b2b2b] bg-[#101010] p-6">
                <div className="text-xs text-[#d7c28a]">{ui.invTitle}</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight text-white">
                  {fmtPct2(result.cashOnCashPct)}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <GoldCard title={ui.netYield} value={fmtPct2(result.netYieldPct)} />
                  <GoldCard title={ui.netAnnualRent} value={`${currency} ${fmtMoney(result.netAnnualRent)}`} />
                  <GoldCard title={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <GoldCard title={ui.grossAnnualRent} value={`${currency} ${fmtMoney(result.grossAnnualRent)}`} />
                <GoldCard title={ui.agentFeeAnnual} value={`${currency} ${fmtMoney(result.agentFeeAnnual)}`} />
                <GoldCard title={ui.holdingAnnual} value={`${currency} ${fmtMoney(result.holdingAnnual)}`} />
                <GoldCard title={ui.loanAmount} value={`${currency} ${fmtMoney(result.loanAmount)}`} />
                <GoldCard title={ui.cashDeposit} value={`${currency} ${fmtMoney(result.cashDeposit)}`} />
                <GoldCard title={ui.interestAnnual} value={`${currency} ${fmtMoney(result.interestAnnual)}`} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6">
                  <div className="text-sm font-semibold text-white">{ui.breakdown}</div>
                  <div className="mt-4">
                    <Row label={ui.stampDuty} value={`${currency} ${fmtMoney(result.stampDuty)}`} />
                    <Row label={ui.govFees} value={`${currency} ${fmtMoney(result.govSolicitorFeesEst)}`} />
                    <Row label={ui.otherOneOffCosts} value={`${currency} ${fmtMoney(result.otherOneOffCosts)}`} />
                    <Row label={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                  </div>
                  <div className="mt-4 text-xs text-[#7b7b7b]">{ui.noteGov}</div>
                </div>

                <div className="rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6">
                  <div className="text-sm font-semibold text-white">{ui.annualCashflow}</div>
                  <div className="mt-4">
                    <Row label={ui.grossAnnualRent} value={`${currency} ${fmtMoney(result.grossAnnualRent)}`} />
                    <Row label={ui.agentFeeAnnual} value={`${currency} ${fmtMoney(result.agentFeeAnnual)}`} />
                    <Row label={ui.holdingAnnual} value={`${currency} ${fmtMoney(result.holdingAnnual)}`} />
                    <Row label={ui.interestAnnual} value={`${currency} ${fmtMoney(result.interestAnnual)}`} />
                    <Row label={ui.netAnnualRent} value={`${currency} ${fmtMoney(result.netAnnualRent)}`} />
                  </div>
                </div>
              </div>

              {/* Sensitivity */}
              <div className="mt-6 rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm font-semibold text-white">{ui.sensitivity}</div>
                  <div className="text-xs text-[#7b7b7b]">{ui.sensitivityHint}</div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-xl border border-[#2b2b2b] bg-[#101010] px-3 py-2 text-left text-xs text-[#d7c28a]">
                          APR \ Rent
                        </th>
                        <th className="border border-[#2b2b2b] bg-[#101010] px-3 py-2 text-center text-xs text-[#d7c28a]">
                          -10%
                        </th>
                        <th className="border border-[#2b2b2b] bg-[#101010] px-3 py-2 text-center text-xs text-[#d7c28a]">
                          Base
                        </th>
                        <th className="rounded-tr-xl border border-[#2b2b2b] bg-[#101010] px-3 py-2 text-center text-xs text-[#d7c28a]">
                          +10%
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[3, 5, 7].map((apr) => (
                        <tr key={apr}>
                          <td className="border border-[#2b2b2b] bg-[#0b0b0b] px-3 py-3 text-left text-sm font-semibold text-white">
                            {apr}%
                          </td>
                          {[0.9, 1.0, 1.1].map((rf) => {
                            const item = result.sensitivity.find((x) => x.apr === apr && x.rentFactor === rf);
                            const v = item?.cocPct ?? 0;
                            return (
                              <td
                                key={`${apr}-${rf}`}
                                className="border border-[#2b2b2b] px-3 py-3 text-center text-sm font-semibold text-white"
                              >
                                {fmtPct2(v)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-[#7b7b7b]">{ui.disclaimer}</div>
              </div>
            </>
          ) : (
            <>
              {/* Self-use headline */}
              <div className="mt-6 rounded-3xl border border-[#2b2b2b] bg-[#101010] p-6">
                <div className="text-xs text-[#d7c28a]">{ui.selfTitle}</div>

                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <GoldCard
                    title={ui.annualFixed}
                    value={`${currency} ${fmtMoney(result.annualFixedOutgoings)}`}
                    subtitle={ui.annualFixedHint}
                  />
                  <GoldCard title={ui.perMonth} value={`${currency} ${fmtMoney(result.monthlyFixedOutgoings)}`} />
                  <GoldCard
                    title={ui.firstYear}
                    value={`${currency} ${fmtMoney(result.firstYearTotalOutgoings)}`}
                    subtitle={`${ui.annualFixed} + ${ui.upfrontCosts}`}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6">
                  <div className="text-sm font-semibold text-white">{ui.annualFixed}</div>
                  <div className="mt-4">
                    <Row label={ui.councilTax} value={`${currency} ${fmtMoney(result.councilTaxEst)}`} />
                    <Row label={ui.utilities} value={`${currency} ${fmtMoney(result.utilitiesEst)}`} />
                    <Row label={ui.holdingAnnual} value={`${currency} ${fmtMoney(result.holdingAnnual)}`} />
                    <Row label={ui.propertyFeeSelf} value={`${currency} ${fmtMoney(result.propertyFeeSelf)}`} />
                    <Row label={ui.annualFixed} value={`${currency} ${fmtMoney(result.annualFixedOutgoings)}`} />
                  </div>
                </div>

                <div className="rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6">
                  <div className="text-sm font-semibold text-white">{ui.upfrontCosts}</div>
                  <div className="mt-4">
                    <Row label={ui.stampDuty} value={`${currency} ${fmtMoney(result.stampDuty)}`} />
                    <Row label={ui.govFees} value={`${currency} ${fmtMoney(result.govSolicitorFeesEst)}`} />
                    <Row label={ui.otherOneOffCosts} value={`${currency} ${fmtMoney(result.otherOneOffCosts)}`} />
                    <Row label={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                  </div>
                  <div className="mt-4 text-xs text-[#7b7b7b]">{ui.noteGov}</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-[#7b7b7b]">{ui.disclaimer}</div>
            </>
          )}
        </div>

        {/* Pro Report */}
        <div className="mt-8 rounded-3xl border border-[#2b2b2b] bg-[#0f0f0f] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="text-lg font-semibold text-white">{ui.proTitle}</div>
          <div className="mt-1 text-sm text-[#b6b6b6]">{ui.proHint}</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <input
              className="w-full rounded-2xl border border-[#2b2b2b] bg-[#0b0b0b] px-4 py-3 text-white outline-none"
              placeholder={inputs.lang === "en" ? "name@example.com" : "例如：name@example.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
            />

            <button
              type="button"
              onClick={onSendProReport}
              disabled={!email || sendStatus === "sending"}
              className="rounded-2xl bg-[#d7c28a] px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendStatus === "sending" ? ui.sending : ui.send}
            </button>
          </div>

          {sendStatus === "sent" ? (
            <div className="mt-3 text-sm text-[#d7c28a]">{ui.sent}</div>
          ) : null}

          {sendStatus === "error" ? (
            <div className="mt-3 text-sm text-red-400">
              {ui.failed} {sendError}
            </div>
          ) : null}

          <div className="mt-4 text-xs text-[#7b7b7b]">{ui.disclaimer}</div>
        </div>

        <div className="mt-10 text-center text-xs text-[#7b7b7b]">{ui.disclaimer}</div>
      </div>
    </div>
  );
}