"use client";

import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

type Country = "UK" | "Dubai" | "Thailand" | "Japan";
type Purpose = "investment" | "owner";
type Lang = "en" | "zh";
type UKBuyerResidency = "uk_resident" | "overseas_buyer";
type UKPropertyCount = "first_home" | "additional_home";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Accept "1,200,000" "1 200 000" "1200000" */
function parseNumber(input: string): number {
  const cleaned = (input || "")
    .replace(/[,\s]/g, "")
    .replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatThousands(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatMoney(n: number, currency: string) {
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------------- i18n ----------------
const I18N: Record<Lang, Record<string, string>> = {
  en: {
    title: "Global Property Calculator",
    subtitle: "Screenshot-ready ROI + costs (MVP).",
    language: "Language",
    en: "EN",
    zh: "中文",

    purpose: "Purpose",
    purpose_invest: "Investment",
    purpose_owner: "Owner-occupied",

    country: "Country",
    UK: "UK",
    Dubai: "Dubai (UAE)",
    Thailand: "Thailand",
    Japan: "Japan",

    property_price: "Property Price",
    buyer_residency: "Buyer residency",
    uk_resident: "UK resident",
    overseas_buyer: "Overseas buyer",
    property_count: "Home count",
    first_home: "First home",
    additional_home: "Additional home",

    monthly_rent: "Monthly Rent",
    agent_fee_pct: "Letting agent fee (%)",
    mortgage_pct: "Mortgage (%)",
    interest_rate_pct: "APR (%)",

    annual_holding: "Annual Holding Costs",
    service_charge: "Service charge / management fee",
    other_oneoff: "Other one-off costs",

    optional: "(optional)",
    self_input: "(self-input)",
    calculate: "Calculate",

    // Investment results
    est_roi: "Estimated Cash-on-Cash ROI",
    roi_formula: "Net annual rent ÷ (Deposit + Upfront Costs)",
    net_yield: "Net Yield (on price)",
    net_annual_rent: "Net Annual Rent",
    upfront_costs: "Upfront Costs",

    gross_annual_rent: "Gross Annual Rent",
    letting_agent_fee_annual: "Letting Agent Fee (annual)",
    annual_holding_costs: "Annual Holding Costs",
    loan_amount: "Loan Amount",
    cash_deposit: "Cash Deposit",
    annual_interest_cost: "Annual Interest Cost",

    upfront_breakdown: "Upfront Cost Breakdown",
    estimate: "Estimate",
    purchase_tax: "Purchase Tax",
    gov_admin_est: "Government / Admin Fees (Estimated)",
    other_oneoff_costs: "Other One-off Costs",
    total_upfront_costs: "Total Upfront Costs",

    annual_cashflow: "Annual Cashflow",
    gross_vs_net: "Gross vs Net",
    breakdown: "Breakdown",

    disclaimer:
      "Disclaimer: Estimates only. Taxes/fees vary by buyer profile and local regulations.",
    note_est:
      'Note: "Government / Admin Fees" are estimated for MVP and may differ by city, transaction type, and local rules.',

    // Owner results
    owner_title: "Estimated Annual Running Costs",
    owner_sub: "Owner-occupied scenario (no rental income)",
    per_month: "Per month",
    owner_total: "Total Annual Running Costs",
    owner_council_tax: "Council / Municipal Tax (Estimated)",
    owner_utilities: "Utilities (Estimated)",
    owner_property_tax: "Property / Land Tax (Estimated)",
    owner_service_charge: "Service charge (self-input)",
    owner_breakdown: "Annual Cost Breakdown",

    country_label: "Country",
    currency_label: "Currency",

    // CTA
    pro_report: "Generate Pro Report (PDF)",
    pro_hint: "Next: connect to Zapier to generate a branded PDF and email it.",
    email_prompt: "Enter your email to receive the report:",
    sending_ok: "Generating. Check your inbox in 1–2 minutes.",
    sending_fail: "Failed. Try again.",
    invalid_price: "Please enter a valid property price.",
  },

  zh: {
    title: "全球房产投资计算器",
    subtitle: "可截图宣传的 ROI + 成本预估（MVP）。",
    language: "语言",
    en: "EN",
    zh: "中文",

    purpose: "用途",
    purpose_invest: "投资",
    purpose_owner: "自住",

    country: "国家",
    UK: "英国",
    Dubai: "迪拜（阿联酋）",
    Thailand: "泰国",
    Japan: "日本",

    property_price: "房产价格",
    buyer_residency: "买家身份",
    uk_resident: "英国本地买家",
    overseas_buyer: "海外买家",
    property_count: "首套/二套",
    first_home: "首套",
    additional_home: "二套/加购",

    monthly_rent: "月租金",
    agent_fee_pct: "租房中介费（%）",
    mortgage_pct: "贷款比例（%）",
    interest_rate_pct: "年利率（%）",

    annual_holding: "年度持有成本",
    service_charge: "物业费/管理费",
    other_oneoff: "其他一次性费用",

    optional: "（可选）",
    self_input: "（用户自填）",
    calculate: "计算",

    // Investment results
    est_roi: "现金回报率（预估）",
    roi_formula: "年度净租金 ÷（首付 + 前期成本）",
    net_yield: "净收益率（按房价）",
    net_annual_rent: "年度净租金",
    upfront_costs: "前期成本",

    gross_annual_rent: "年度毛租金",
    letting_agent_fee_annual: "年度中介费",
    annual_holding_costs: "年度持有成本",
    loan_amount: "贷款金额",
    cash_deposit: "首付（自有资金）",
    annual_interest_cost: "年度利息成本",

    upfront_breakdown: "前期成本明细",
    estimate: "预估",
    purchase_tax: "购置税费",
    gov_admin_est: "政府/登记/行政费用（预估）",
    other_oneoff_costs: "其他一次性费用",
    total_upfront_costs: "前期成本合计",

    annual_cashflow: "年度现金流",
    gross_vs_net: "毛 vs 净",
    breakdown: "构成",

    disclaimer: "免责声明：本结果为估算，仅供参考；税费可能因买家身份及当地法规而不同。",
    note_est: "注：政府/登记/行政费用为MVP预估值，可能因城市、交易类型及当地规定而不同。",

    // Owner results
    owner_title: "年度固定支出（预估）",
    owner_sub: "适用于自住场景（不含租金收益）",
    per_month: "折合每月",
    owner_total: "年度固定支出合计",
    owner_council_tax: "市政税/地方税（预估）",
    owner_utilities: "水电煤网费（预估）",
    owner_property_tax: "房产税/地税（预估）",
    owner_service_charge: "物业费/管理费（用户自填）",
    owner_breakdown: "年度支出明细",

    country_label: "国家",
    currency_label: "币种",

    // CTA
    pro_report: "生成专业版报告（PDF）",
    pro_hint: "下一步：连接 Zapier，一键生成 PDF 并发送到邮箱。",
    email_prompt: "请输入邮箱以接收报告：",
    sending_ok: "报告生成中，1-2分钟后请查收邮箱。",
    sending_fail: "发送失败，请稍后重试。",
    invalid_price: "请输入有效的房产价格。",
  },
};

function tFactory(lang: Lang) {
  return (key: string) => I18N[lang][key] ?? key;
}

// ------------------- Models (MVP) -------------------
function calcUKSDLT(price: number, isAdditional: boolean, isOverseas: boolean): number {
  const bands = [
    { upTo: 250000, rate: 0.0 },
    { upTo: 925000, rate: 0.05 },
    { upTo: 1500000, rate: 0.1 },
    { upTo: Infinity, rate: 0.12 },
  ];

  let remaining = price;
  let last = 0;
  let tax = 0;

  for (const b of bands) {
    const cap = b.upTo;
    const bandSize = Math.max(0, Math.min(remaining, cap - last));
    tax += bandSize * b.rate;
    remaining -= bandSize;
    last = cap;
    if (remaining <= 0) break;
  }

  if (isAdditional) tax += price * 0.03;
  if (isOverseas) tax += price * 0.02;

  return Math.max(0, Math.round(tax));
}

function calcDubaiGovCosts(priceAED: number) {
  const dld = priceAED * 0.04;
  const trustee = 4000;
  const admin = 580;
  return { purchaseTax: Math.round(dld), otherGovFees: trustee + admin };
}

function calcThailandGovCosts(priceTHB: number) {
  const transfer = priceTHB * 0.02;
  return { purchaseTax: Math.round(transfer), otherGovFees: 0 };
}

function calcJapanGovCosts(priceJPY: number) {
  const bundle = priceJPY * 0.03;
  return { purchaseTax: Math.round(bundle), otherGovFees: 0 };
}

// Gov/Admin fee estimate (UK/TH/JP)
function calcUKGovAdminFeesEstimate(priceGBP: number) {
  let landRegistry = 0;
  if (priceGBP <= 100000) landRegistry = 40;
  else if (priceGBP <= 200000) landRegistry = 95;
  else if (priceGBP <= 500000) landRegistry = 150;
  else if (priceGBP <= 1000000) landRegistry = 295;
  else landRegistry = 500;

  const searchesAndAdmin = 350;
  return Math.round(landRegistry + searchesAndAdmin);
}
function calcThailandGovAdminFeesEstimate(priceTHB: number) {
  return Math.round(priceTHB * 0.005);
}
function calcJapanGovAdminFeesEstimate(priceJPY: number) {
  return Math.round(priceJPY * 0.007);
}

// Owner-occupied annual running cost estimates (MVP)
function estimateUKCouncilTax(priceGBP: number) {
  if (priceGBP <= 250000) return 1800;
  if (priceGBP <= 500000) return 2200;
  if (priceGBP <= 1000000) return 2800;
  return 3500;
}
function estimateUKUtilities() {
  return 3000;
}
function estimateDubaiUtilities(priceAED: number) {
  return Math.round(Math.max(12000, priceAED * 0.004));
}
function estimateThailandUtilities(priceTHB: number) {
  return Math.round(Math.max(30000, priceTHB * 0.004));
}
function estimateJapanUtilities(priceJPY: number) {
  return Math.round(Math.max(180000, priceJPY * 0.002));
}
function estimateThailandPropertyTax(priceTHB: number) {
  return Math.round(priceTHB * 0.001);
}
function estimateJapanPropertyTax(priceJPY: number) {
  return Math.round(priceJPY * 0.007);
}

// ------------------- Inputs -------------------
function MoneyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,.\s]/g, "");
          onChange(raw);
        }}
        onBlur={() => {
          const n = parseNumber(value);
          onChange(n ? formatThousands(n) : "");
        }}
        inputMode="decimal"
        className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
        placeholder={placeholder}
      />
    </div>
  );
}

// Percent sign moved into label: no trailing "%" element => alignment fixed
function PercentInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          onChange(raw);
        }}
        inputMode="decimal"
        className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
        placeholder={placeholder}
      />
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => tFactory(lang), [lang]);

  const [purpose, setPurpose] = useState<Purpose>("investment");
  const [country, setCountry] = useState<Country>("UK");

  const currency = useMemo(() => {
    switch (country) {
      case "UK":
        return "GBP";
      case "Dubai":
        return "AED";
      case "Thailand":
        return "THB";
      case "Japan":
        return "JPY";
      default:
        return "USD";
    }
  }, [country]);

  // input strings
  const [priceStr, setPriceStr] = useState("");
  const [rentMonthlyStr, setRentMonthlyStr] = useState("");
  const [annualCostsStr, setAnnualCostsStr] = useState("");
  const [otherOneOffCostsStr, setOtherOneOffCostsStr] = useState("");

  // percentages
  const [mortgagePercentStr, setMortgagePercentStr] = useState("0");
  const [mortgageRateStr, setMortgageRateStr] = useState("5");
  const [agentFeePercentStr, setAgentFeePercentStr] = useState("10");

  // UK selectors
  const [ukResidency, setUkResidency] = useState<UKBuyerResidency>("uk_resident");
  const [ukPropertyCount, setUkPropertyCount] = useState<UKPropertyCount>("first_home");

  const [result, setResult] = useState<null | {
    lang: Lang;
    purpose: Purpose;
    country: Country;
    currency: string;

    // investment
    purchaseTax: number;
    otherGovFees: number;
    otherOneOffCosts: number;
    totalUpfrontCosts: number;

    mortgagePercent: number;
    mortgageRate: number;
    loanAmount: number;
    cashDeposit: number;
    annualInterestCost: number;

    grossAnnualRent: number;
    lettingAgentAnnualFee: number;
    annualHoldingCosts: number;
    netAnnualRent: number;

    netYieldOnPrice: number;
    roiCashOnCash: number;

    // owner
    annualCouncilOrMunicipalTax: number;
    annualUtilities: number;
    annualPropertyTax: number;
    annualServiceCharge: number;
    annualTotalRunningCosts: number;
  }>(null);

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();

    const price = parseNumber(priceStr);
    const rentMonthly = parseNumber(rentMonthlyStr);
    const annualCosts = parseNumber(annualCostsStr);
    const otherOneOff = parseNumber(otherOneOffCostsStr);

    const mortgagePercent = clamp(Number(mortgagePercentStr) || 0, 0, 100);
    const mortgageRate = clamp(Number(mortgageRateStr) || 0, 0, 50);
    const agentFeePercent = clamp(Number(agentFeePercentStr) || 0, 0, 100);

    if (!price || price <= 0) {
      alert(t("invalid_price"));
      return;
    }

    // OWNER MODE
    if (purpose === "owner") {
      let annualCouncilOrMunicipalTax = 0;
      let annualUtilities = 0;
      let annualPropertyTax = 0;

      if (country === "UK") {
        annualCouncilOrMunicipalTax = estimateUKCouncilTax(price);
        annualUtilities = estimateUKUtilities();
        annualPropertyTax = 0;
      } else if (country === "Dubai") {
        annualCouncilOrMunicipalTax = 0;
        annualUtilities = estimateDubaiUtilities(price);
        annualPropertyTax = 0;
      } else if (country === "Thailand") {
        annualCouncilOrMunicipalTax = 0;
        annualUtilities = estimateThailandUtilities(price);
        annualPropertyTax = estimateThailandPropertyTax(price);
      } else if (country === "Japan") {
        annualCouncilOrMunicipalTax = 0;
        annualUtilities = estimateJapanUtilities(price);
        annualPropertyTax = estimateJapanPropertyTax(price);
      }

      const annualServiceCharge = annualCosts; // self input
      const annualTotalRunningCosts =
        annualCouncilOrMunicipalTax + annualUtilities + annualPropertyTax + annualServiceCharge;

      setResult({
        lang,
        purpose,
        country,
        currency,

        purchaseTax: 0,
        otherGovFees: 0,
        otherOneOffCosts: 0,
        totalUpfrontCosts: 0,

        mortgagePercent: 0,
        mortgageRate: 0,
        loanAmount: 0,
        cashDeposit: 0,
        annualInterestCost: 0,

        grossAnnualRent: 0,
        lettingAgentAnnualFee: 0,
        annualHoldingCosts: 0,
        netAnnualRent: 0,

        netYieldOnPrice: 0,
        roiCashOnCash: 0,

        annualCouncilOrMunicipalTax,
        annualUtilities,
        annualPropertyTax,
        annualServiceCharge,
        annualTotalRunningCosts,
      });

      return;
    }

    // INVESTMENT MODE
    let purchaseTax = 0;
    let otherGovFees = 0;

    if (country === "UK") {
      const isAdditional = ukPropertyCount === "additional_home";
      const isOverseas = ukResidency === "overseas_buyer";
      purchaseTax = calcUKSDLT(price, isAdditional, isOverseas);
      otherGovFees = calcUKGovAdminFeesEstimate(price);
    } else if (country === "Dubai") {
      const d = calcDubaiGovCosts(price);
      purchaseTax = d.purchaseTax;
      otherGovFees = d.otherGovFees;
    } else if (country === "Thailand") {
      const g = calcThailandGovCosts(price);
      purchaseTax = g.purchaseTax;
      otherGovFees = calcThailandGovAdminFeesEstimate(price);
    } else if (country === "Japan") {
      const g = calcJapanGovCosts(price);
      purchaseTax = g.purchaseTax;
      otherGovFees = calcJapanGovAdminFeesEstimate(price);
    }

    const totalUpfrontCosts = purchaseTax + otherGovFees + otherOneOff;

    const loanAmount = (price * mortgagePercent) / 100;
    const cashDeposit = Math.max(0, price - loanAmount);
    const annualInterestCost = (loanAmount * mortgageRate) / 100;

    const grossAnnualRent = Math.max(0, rentMonthly) * 12;
    const lettingAgentAnnualFee = grossAnnualRent * (agentFeePercent / 100);
    const annualHoldingCosts = annualCosts;
    const netAnnualRent = Math.max(
      0,
      grossAnnualRent - lettingAgentAnnualFee - annualHoldingCosts - annualInterestCost
    );

    const netYieldOnPrice = grossAnnualRent > 0 ? (netAnnualRent / price) * 100 : 0;
    const totalCashIn = cashDeposit + totalUpfrontCosts;
    const roiCashOnCash = grossAnnualRent > 0 ? (netAnnualRent / totalCashIn) * 100 : 0;

    setResult({
      lang,
      purpose,
      country,
      currency,

      purchaseTax,
      otherGovFees,
      otherOneOffCosts: otherOneOff,
      totalUpfrontCosts,

      mortgagePercent,
      mortgageRate,
      loanAmount,
      cashDeposit,
      annualInterestCost,

      grossAnnualRent,
      lettingAgentAnnualFee,
      annualHoldingCosts,
      netAnnualRent,

      netYieldOnPrice,
      roiCashOnCash,

      annualCouncilOrMunicipalTax: 0,
      annualUtilities: 0,
      annualPropertyTax: 0,
      annualServiceCharge: 0,
      annualTotalRunningCosts: 0,
    });
  }

  // ---------------- Charts ----------------
  const upfrontChartData = useMemo(() => {
    if (!result || result.purpose !== "investment") return null;
    return {
      labels: [t("purchase_tax"), t("gov_admin_est"), t("other_oneoff_costs")],
      datasets: [
        {
          label: t("upfront_costs"),
          data: [result.purchaseTax, result.otherGovFees, result.otherOneOffCosts],
          backgroundColor: ["#D4AF37", "#F59E0B", "#7C3AED"], // gold / amber / royal purple
          borderColor: "#FFFFFF",
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [result, t]);

  const cashflowChartData = useMemo(() => {
    if (!result || result.purpose !== "investment") return null;
    return {
      labels: ["Annual"],
      datasets: [
        { label: t("gross_annual_rent"), data: [result.grossAnnualRent], backgroundColor: "#111827" },
        { label: t("net_annual_rent"), data: [result.netAnnualRent], backgroundColor: "#16A34A" },
        { label: t("letting_agent_fee_annual"), data: [result.lettingAgentAnnualFee], backgroundColor: "#F59E0B" },
        { label: t("annual_holding_costs"), data: [result.annualHoldingCosts], backgroundColor: "#6366F1" },
        { label: t("annual_interest_cost"), data: [result.annualInterestCost], backgroundColor: "#EF4444" },
      ],
    };
  }, [result, t]);

  const ownerChartData = useMemo(() => {
    if (!result || result.purpose !== "owner") return null;
    return {
      labels: [t("owner_council_tax"), t("owner_utilities"), t("owner_property_tax"), t("owner_service_charge")],
      datasets: [
        {
          label: t("owner_breakdown"),
          data: [
            result.annualCouncilOrMunicipalTax,
            result.annualUtilities,
            result.annualPropertyTax,
            result.annualServiceCharge,
          ],
          backgroundColor: ["#D4AF37", "#F59E0B", "#EF4444", "#10B981"], // gold-led palette
          borderColor: "#FFFFFF",
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [result, t]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { position: "bottom" as const }, title: { display: false } },
      cutout: "68%",
    }),
    []
  );

  const barOptions = useMemo(() => {
    return {
      responsive: true,
      elements: { bar: { borderRadius: 10, borderSkipped: false } },
      plugins: {
        legend: { position: "bottom" as const },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.raw ?? 0;
              const ccy = result?.currency || "USD";
              return `${ctx.dataset.label}: ${formatMoney(Number(v), ccy)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value: any) {
              const n = Number(value);
              return Number.isFinite(n) ? formatThousands(n) : value;
            },
          },
        },
      },
    };
  }, [result]);

  // ---------------- Zapier placeholder ----------------
  async function sendToZapier() {
    if (!result) return;
    const email = prompt(t("email_prompt"));
    if (!email) return;

    const zapierURL = "https://hooks.zapier.com/hooks/catch/XXXXX/XXXXX"; // replace

    const payload = {
      email,
      lang: result.lang,
      purpose: result.purpose,
      country: result.country,
      currency: result.currency,
      result,
      inputs: {
        price: parseNumber(priceStr),
        rentMonthly: parseNumber(rentMonthlyStr),
        annualCosts: parseNumber(annualCostsStr),
        otherOneOffCosts: parseNumber(otherOneOffCostsStr),
        mortgagePercent: Number(mortgagePercentStr) || 0,
        mortgageRate: Number(mortgageRateStr) || 0,
        agentFeePercent: Number(agentFeePercentStr) || 0,
        ukResidency,
        ukPropertyCount,
      },
    };

    const r = await fetch(zapierURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert(r.ok ? t("sending_ok") : t("sending_fail"));
  }

  // ---------------- Luxury Gold Hero styles ----------------
  const goldHeroStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, #B9973E 0%, #F1E3B8 40%, #D3AF37 100%)",
  };
  const goldTitle = { color: "#2B230B" };
  const goldSub = { color: "#6E5A23" };
  const goldPill: React.CSSProperties = { background: "rgba(255,255,255,0.45)" };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center bg-white text-black">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("title")}</h1>

            {/* Language switch: NO bilingual labels, only EN or 中文 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">{t("language")}</span>
              <div className="flex rounded-xl border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-2 text-sm font-bold ${lang === "en" ? "bg-black text-white" : "bg-white"}`}
                >
                  {I18N.en.en}
                </button>
                <button
                  type="button"
                  onClick={() => setLang("zh")}
                  className={`px-3 py-2 text-sm font-bold ${lang === "zh" ? "bg-black text-white" : "bg-white"}`}
                >
                  {I18N.zh.zh}
                </button>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mt-1">{t("subtitle")}</p>
        </header>

        {/* Form */}
        <form onSubmit={onCalculate} className="rounded-2xl border p-5 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purpose FIRST */}
            <div>
              <label className="block text-sm font-semibold mb-1">{t("purpose")}</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as Purpose)}
                className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="investment">{t("purpose_invest")}</option>
                <option value="owner">{t("purpose_owner")}</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold mb-1">{t("country")}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="UK">{t("UK")}</option>
                <option value="Dubai">{t("Dubai")}</option>
                <option value="Thailand">{t("Thailand")}</option>
                <option value="Japan">{t("Japan")}</option>
              </select>
            </div>

            <MoneyInput
              label={`${t("property_price")} (${currency})`}
              value={priceStr}
              onChange={setPriceStr}
              placeholder={
                country === "UK"
                  ? "e.g. 750,000"
                  : country === "Dubai"
                  ? "e.g. 2,000,000"
                  : country === "Thailand"
                  ? "e.g. 8,000,000"
                  : "e.g. 90,000,000"
              }
            />

            {/* UK options */}
            {country === "UK" && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("buyer_residency")}</label>
                  <select
                    value={ukResidency}
                    onChange={(e) => setUkResidency(e.target.value as UKBuyerResidency)}
                    className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="uk_resident">{t("uk_resident")}</option>
                    <option value="overseas_buyer">{t("overseas_buyer")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">{t("property_count")}</label>
                  <select
                    value={ukPropertyCount}
                    onChange={(e) => setUkPropertyCount(e.target.value as UKPropertyCount)}
                    className="w-full border rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="first_home">{t("first_home")}</option>
                    <option value="additional_home">{t("additional_home")}</option>
                  </select>
                </div>
              </>
            )}

            {/* Investment-only inputs */}
            {purpose === "investment" && (
              <>
                <MoneyInput
                  label={`${t("monthly_rent")} (${currency})`}
                  value={rentMonthlyStr}
                  onChange={setRentMonthlyStr}
                  placeholder={country === "UK" ? "e.g. 2,800" : "e.g. 12,000"}
                />

                <PercentInput
                  label={t("agent_fee_pct")}
                  value={agentFeePercentStr}
                  onChange={setAgentFeePercentStr}
                  placeholder="e.g. 10"
                  hint={lang === "zh" ? "按年度租金计算（MVP）。" : "Applied to annual rent (MVP)."}
                />

                <PercentInput
                  label={t("mortgage_pct")}
                  value={mortgagePercentStr}
                  onChange={setMortgagePercentStr}
                  placeholder="e.g. 70"
                  hint={lang === "zh" ? "0 表示全款。" : "0 means cash purchase."}
                />

                <PercentInput
                  label={t("interest_rate_pct")}
                  value={mortgageRateStr}
                  onChange={setMortgageRateStr}
                  placeholder="e.g. 5"
                  hint={lang === "zh" ? "MVP 按“只算利息”估算。" : "MVP assumes interest-only annual cost."}
                />
              </>
            )}

            {/* Annual cost field: investment vs owner */}
            <MoneyInput
              label={
                purpose === "investment"
                  ? `${t("annual_holding")} ${t("optional")} (${currency})`
                  : `${t("service_charge")} ${t("self_input")} (${currency})`
              }
              value={annualCostsStr}
              onChange={setAnnualCostsStr}
              placeholder={purpose === "investment" ? "e.g. 4,500" : "e.g. 18,000"}
            />

            {/* Other one-off: investment only */}
            {purpose === "investment" && (
              <MoneyInput
                label={`${t("other_oneoff")} ${t("optional")} (${currency})`}
                value={otherOneOffCostsStr}
                onChange={setOtherOneOffCostsStr}
                placeholder={lang === "zh" ? "例如：律师费 + 家具包" : "e.g. lawyer + furniture pack"}
              />
            )}
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-2xl bg-black text-white py-3 font-extrabold shadow-md active:scale-[0.99]"
          >
            {t("calculate")}
          </button>
        </form>

        {/* ---------------- Investment Results ---------------- */}
        {result && result.purpose === "investment" && (
          <section className="mt-8">
            {/* GOLD HERO */}
            <div className="rounded-3xl p-6 md:p-7 shadow-xl" style={goldHeroStyle}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest" style={goldSub}>
                    {t("est_roi")}
                  </div>
                  <div className="mt-2 text-5xl md:text-6xl font-extrabold leading-none" style={goldTitle}>
                    {result.roiCashOnCash.toFixed(2)}%
                  </div>
                  <div className="mt-2 text-sm" style={goldSub}>
                    {t("roi_formula")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs" style={goldSub}>
                    {t("country_label")}
                  </div>
                  <div className="text-sm font-bold" style={goldTitle}>
                    {t(result.country)}
                  </div>
                  <div className="mt-2 text-xs" style={goldSub}>
                    {t("currency_label")}
                  </div>
                  <div className="text-sm font-bold" style={goldTitle}>
                    {result.currency}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl p-3" style={goldPill}>
                  <div className="text-[11px]" style={goldSub}>
                    {t("net_yield")}
                  </div>
                  <div className="text-lg font-extrabold" style={goldTitle}>
                    {result.netYieldOnPrice.toFixed(2)}%
                  </div>
                </div>
                <div className="rounded-2xl p-3" style={goldPill}>
                  <div className="text-[11px]" style={goldSub}>
                    {t("net_annual_rent")}
                  </div>
                  <div className="text-lg font-extrabold" style={goldTitle}>
                    {formatMoney(result.netAnnualRent, result.currency)}
                  </div>
                </div>
                <div className="rounded-2xl p-3" style={goldPill}>
                  <div className="text-[11px]" style={goldSub}>
                    {t("upfront_costs")}
                  </div>
                  <div className="text-lg font-extrabold" style={goldTitle}>
                    {formatMoney(result.totalUpfrontCosts, result.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { k: t("gross_annual_rent"), v: formatMoney(result.grossAnnualRent, result.currency) },
                { k: t("letting_agent_fee_annual"), v: formatMoney(result.lettingAgentAnnualFee, result.currency) },
                { k: t("annual_holding_costs"), v: formatMoney(result.annualHoldingCosts, result.currency) },
                { k: t("loan_amount"), v: formatMoney(result.loanAmount, result.currency) },
                { k: t("cash_deposit"), v: formatMoney(result.cashDeposit, result.currency) },
                { k: t("annual_interest_cost"), v: formatMoney(result.annualInterestCost, result.currency) },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">{x.k}</div>
                  <div className="mt-1 text-xl font-extrabold">{x.v}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-base font-extrabold">{t("upfront_costs")}</div>
                  <div className="text-xs text-gray-500">{t("breakdown")}</div>
                </div>
                <div className="mt-4">{upfrontChartData ? <Doughnut data={upfrontChartData} options={doughnutOptions} /> : null}</div>
                <div className="mt-3 text-xs text-gray-500">
                  {t("total_upfront_costs")}:{" "}
                  <span className="font-bold">{formatMoney(result.totalUpfrontCosts, result.currency)}</span>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-base font-extrabold">{t("annual_cashflow")}</div>
                  <div className="text-xs text-gray-500">{t("gross_vs_net")}</div>
                </div>
                <div className="mt-4 h-[260px] flex items-center justify-center">
                  {cashflowChartData ? <Bar data={cashflowChartData} options={barOptions} /> : null}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {t("net_annual_rent")}:{" "}
                  <span className="font-bold">{formatMoney(result.netAnnualRent, result.currency)}</span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-base font-extrabold">{t("upfront_breakdown")}</div>
                <div className="text-xs text-gray-500">{t("estimate")}</div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t("purchase_tax")}</span>
                  <span className="font-extrabold">{formatMoney(result.purchaseTax, result.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t("gov_admin_est")}</span>
                  <span className="font-extrabold">{formatMoney(result.otherGovFees, result.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t("other_oneoff_costs")}</span>
                  <span className="font-extrabold">{formatMoney(result.otherOneOffCosts, result.currency)}</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-bold">{t("total_upfront_costs")}</span>
                  <span className="text-lg font-extrabold">{formatMoney(result.totalUpfrontCosts, result.currency)}</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">{t("disclaimer")}</div>
              <div className="mt-2 text-xs text-gray-500">{t("note_est")}</div>
            </div>

            {/* CTA */}
            <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm">
              <div className="text-base font-extrabold">{t("pro_report")}</div>
              <div className="mt-1 text-sm text-gray-600">{t("pro_hint")}</div>
              <button
                type="button"
                className="mt-4 w-full rounded-2xl text-white py-3 font-extrabold shadow-md active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, #B38A22 0%, #D4AF37 50%, #8B6B14 100%)" }}
                onClick={sendToZapier}
              >
                {t("pro_report")}
              </button>
            </div>
          </section>
        )}

        {/* ---------------- Owner Results ---------------- */}
        {result && result.purpose === "owner" && (
          <section className="mt-8">
            {/* GOLD HERO */}
            <div className="rounded-3xl p-6 md:p-7 shadow-xl" style={goldHeroStyle}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest" style={goldSub}>
                    {t("owner_title")}
                  </div>
                  <div className="mt-2 text-4xl md:text-5xl font-extrabold leading-none" style={goldTitle}>
                    {formatMoney(result.annualTotalRunningCosts, result.currency)}
                  </div>
                  <div className="mt-2 text-sm" style={goldSub}>
                    {t("owner_sub")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs" style={goldSub}>
                    {t("country_label")}
                  </div>
                  <div className="text-sm font-bold" style={goldTitle}>
                    {t(result.country)}
                  </div>
                  <div className="mt-2 text-xs" style={goldSub}>
                    {t("currency_label")}
                  </div>
                  <div className="text-sm font-bold" style={goldTitle}>
                    {result.currency}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-3" style={goldPill}>
                  <div className="text-[11px]" style={goldSub}>
                    {t("owner_total")}
                  </div>
                  <div className="text-lg font-extrabold" style={goldTitle}>
                    {formatMoney(result.annualTotalRunningCosts, result.currency)}
                  </div>
                </div>
                <div className="rounded-2xl p-3" style={goldPill}>
                  <div className="text-[11px]" style={goldSub}>
                    {t("per_month")}
                  </div>
                  <div className="text-lg font-extrabold" style={goldTitle}>
                    {formatMoney(result.annualTotalRunningCosts / 12, result.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { k: t("owner_council_tax"), v: formatMoney(result.annualCouncilOrMunicipalTax, result.currency) },
                { k: t("owner_utilities"), v: formatMoney(result.annualUtilities, result.currency) },
                { k: t("owner_property_tax"), v: formatMoney(result.annualPropertyTax, result.currency) },
                { k: t("owner_service_charge"), v: formatMoney(result.annualServiceCharge, result.currency) },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">{x.k}</div>
                  <div className="mt-1 text-xl font-extrabold">{x.v}</div>
                </div>
              ))}
            </div>

            {/* Chart + breakdown */}
            <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-base font-extrabold">{t("owner_breakdown")}</div>
                <div className="text-xs text-gray-500">{t("estimate")}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white p-4">
                  {ownerChartData ? <Doughnut data={ownerChartData} options={doughnutOptions} /> : null}
                </div>

                <div className="rounded-2xl border bg-white p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("owner_council_tax")}</span>
                      <span className="font-extrabold">{formatMoney(result.annualCouncilOrMunicipalTax, result.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("owner_utilities")}</span>
                      <span className="font-extrabold">{formatMoney(result.annualUtilities, result.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("owner_property_tax")}</span>
                      <span className="font-extrabold">{formatMoney(result.annualPropertyTax, result.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("owner_service_charge")}</span>
                      <span className="font-extrabold">{formatMoney(result.annualServiceCharge, result.currency)}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-bold">{t("owner_total")}</span>
                      <span className="text-lg font-extrabold">{formatMoney(result.annualTotalRunningCosts, result.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">{t("disclaimer")}</div>

              <button
                type="button"
                className="mt-4 w-full rounded-2xl text-white py-3 font-extrabold shadow-md active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, #B38A22 0%, #D4AF37 50%, #8B6B14 100%)" }}
                onClick={sendToZapier}
              >
                {t("pro_report")}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}