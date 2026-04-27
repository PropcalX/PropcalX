export type CountryCode = "uk" | "uae" | "th" | "jp";
export type Lang = "en" | "zh";
export type Purpose = "investment" | "selfuse";
export type PurposeCode = "investment" | "owner";
export type HomeCount = "first" | "additional";
export type Residency = "resident" | "nonResident";

export type Inputs = {
  lang: Lang;
  purpose: Purpose;
  country: CountryCode;
  region: string;
  project: string;
  homeCount: HomeCount;
  residency: Residency;
  price: string;
  monthlyRent: string;
  agentFeePct: string;
  mortgagePct: string;
  aprPct: string;
  annualHoldingCosts: string;
  otherOneOffCosts: string;
  annualPropertyFeeSelf: string;
};

export type SensitivityPoint = {
  apr: number;
  rentFactor: number;
  cocPct: number;
};

export type Result = {
  currency: string;
  stampDuty: number;
  govSolicitorFeesEst: number;
  otherOneOffCosts: number;
  upfrontCosts: number;
  loanAmount: number;
  cashDeposit: number;
  interestAnnual: number;
  grossAnnualRent: number;
  agentFeeAnnual: number;
  holdingAnnual: number;
  netAnnualRent: number;
  netYieldPct: number;
  cashOnCashPct: number;
  councilTaxEst: number;
  utilitiesEst: number;
  propertyFeeSelf: number;
  annualFixedOutgoings: number;
  monthlyFixedOutgoings: number;
  firstYearTotalOutgoings: number;
  paymentPlan: Array<{ label: string; value: number }>;
  sensitivity: SensitivityPoint[];
};

export type UiText = ReturnType<typeof getUiText>;

export type ProReportPayload = {
  email: string;
  lang: Lang;
  purpose: PurposeCode;
  country: CountryCode;
  currency: string;
  ui: UiText;
  inputs: {
    price: number;
    monthlyRent: number;
    agentFeePct: number;
    mortgagePct: number;
    aprPct: number;
    annualHoldingCosts: number;
    otherOneOffCosts: number;
    annualPropertyFeeSelf: number;
    region: string;
    project: string;
    homeCount: HomeCount;
    residency: Residency;
  };
  results: Result & {
    fmt: Record<string, string>;
  };
  meta: {
    countryLabel: string;
    createdAt: string;
    website: string;
  };
  createdAtISO: string;
  brand: {
    name: string;
    website: string;
  };
};

export const initialInputs: Inputs = {
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
};

export const COUNTRY_NAME: Record<Lang, Record<CountryCode, string>> = {
  en: { uk: "United Kingdom", uae: "UAE", th: "Thailand", jp: "Japan" },
  zh: { uk: "英国", uae: "阿联酋", th: "泰国", jp: "日本" },
};

export function normalizeCountry(value: unknown): CountryCode {
  const text = String(value ?? "").toLowerCase().trim();
  if (text === "uk" || text.includes("united kingdom") || text.includes("英国")) return "uk";
  if (text === "uae" || text.includes("dubai") || text.includes("阿联酋")) return "uae";
  if (text === "th" || text.includes("thailand") || text.includes("泰国")) return "th";
  if (text === "jp" || text.includes("japan") || text.includes("日本")) return "jp";
  return "uk";
}

export function normalizePurpose(value: unknown): PurposeCode {
  const text = String(value ?? "").toLowerCase().trim();
  if (text === "investment" || text.includes("投资")) return "investment";
  if (text === "selfuse" || text === "owner" || text.includes("自住")) return "owner";
  return "investment";
}

export function currencyByCountry(country: CountryCode) {
  const map: Record<CountryCode, "GBP" | "AED" | "THB" | "JPY"> = {
    uk: "GBP",
    uae: "AED",
    th: "THB",
    jp: "JPY",
  };

  return map[country];
}

export function parseNum(text: string) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, "").replace(/[^\d.]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function formatThousandsInput(raw: string) {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(".");
  const intPart = parts[0];
  const decPart = parts[1]?.slice(0, 2);
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function fmtMoney(n: number) {
  const value = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function fmtPct2(n: number) {
  const value = Number.isFinite(n) ? n : 0;
  return `${value.toFixed(2)}%`;
}

export function getUiText(lang: Lang) {
  const en = {
    brand: "MyGPC",
    title: "Global Property Calculator",
    subtitle:
      "Estimate acquisition costs, annual cash flow, and first-year outgoings before requesting a branded investor report.",
    language: "Language",
    purpose: "Purpose",
    purposeInvestment: "Investment",
    purposeSelfuse: "Owner-occupier",
    country: "Country",
    region: "Region (optional)",
    project: "Project / Development (optional)",
    price: "Property price",
    monthlyRent: "Monthly rent",
    homeCount: "Home profile (UK)",
    first: "First home",
    additional: "Additional home",
    residency: "Buyer residency (UK)",
    resident: "Resident buyer",
    nonResident: "Overseas buyer",
    agentFeePct: "Letting agent fee",
    mortgagePct: "Mortgage LTV",
    aprPct: "APR",
    annualHoldingCosts: "Annual holding costs",
    otherOneOffCosts: "Other one-off costs",
    otherPlaceholder: "e.g. furniture, legal extras, setup",
    propertyFeeSelf: "Annual property fee / service charge",
    calc: "View results",
    countryLabel: "Country",
    currencyLabel: "Currency",
    estimateTag: "Professional estimate",
    invTitle: "Estimated Cash-on-Cash ROI",
    netYield: "Net yield",
    netAnnualRent: "Net annual rent",
    upfrontCosts: "Upfront costs",
    grossAnnualRent: "Gross annual rent",
    agentFeeAnnual: "Agent fee (annual)",
    holdingAnnual: "Holding costs (annual)",
    interestAnnual: "Interest cost (annual)",
    loanAmount: "Loan amount",
    cashDeposit: "Cash deposit",
    breakdown: "Acquisition cost breakdown",
    stampDuty: "Stamp duty",
    govFees: "Legal / registration / admin",
    annualCashflow: "Annual operating cash flow",
    sensitivity: "Sensitivity matrix",
    sensitivityHint: "Cash-on-cash ROI under rent and APR changes.",
    selfTitle: "Estimated Self-use Outgoings",
    annualFixed: "Annual fixed outgoings",
    perMonth: "Monthly equivalent",
    firstYear: "First-year total outgoings",
    councilTax: "Council tax",
    utilities: "Utilities and broadband",
    annualFixedHint: "Mortgage principal repayments are excluded from this MVP estimate.",
    proTitle: "Get Your Professional Report",
    proHint:
      "Enter your email to receive a polished PDF styled around your investment breakdown template.",
    email: "Email address",
    send: "Email my report",
    sending: "Sending...",
    sent: "Your report has been sent. Please check your inbox.",
    failed: "Unable to send report:",
    disclaimer:
      "Estimates only. Taxes, fees, and financing terms vary by buyer profile, project, and local regulation.",
    noteGov:
      "Legal, registry, and admin figures are estimated to give buyers a realistic budget envelope.",
    reportSummaryTitle: "Executive summary",
    reportSummaryText:
      "This report translates your calculator inputs into a client-ready acquisition and cash flow view.",
    paymentPlan: "Indicative payment plan",
    paymentPlanHint: "Suggested schedule for reservation, exchange, and completion.",
    nextSteps: "Suggested next steps",
    nextStepsItems: [
      "Confirm exact legal and registration costs with the developer or solicitor.",
      "Validate rent and service charge assumptions against the selected building and unit type.",
      "Review financing options if leverage will be used for the purchase.",
    ],
    buyerProfile: "Buyer profile",
    propertySnapshot: "Property snapshot",
    assumptions: "Key assumptions",
    websiteLabel: "Website",
  };

  const zh = {
    brand: "MyGPC",
    title: "全球房产投资计算器",
    subtitle: "先快速测算购房成本、租金回报和首年支出，再获取专业客户报告。",
    language: "语言",
    purpose: "用途",
    purposeInvestment: "投资",
    purposeSelfuse: "自住",
    country: "国家",
    region: "区域（可选）",
    project: "项目名称（可选）",
    price: "房产价格",
    monthlyRent: "月租金",
    homeCount: "购房属性（英国）",
    first: "首套房",
    additional: "二套或以上",
    residency: "买家身份（英国）",
    resident: "本地买家",
    nonResident: "海外买家",
    agentFeePct: "中介管理费",
    mortgagePct: "贷款比例",
    aprPct: "年化利率",
    annualHoldingCosts: "每年持有成本",
    otherOneOffCosts: "其他一次性费用",
    otherPlaceholder: "例如：家具包、律师附加费、开户费用",
    propertyFeeSelf: "每年物业费 / 服务费",
    calc: "查看测算结果",
    countryLabel: "国家",
    currencyLabel: "币种",
    estimateTag: "专业测算",
    invTitle: "预计现金回报率",
    netYield: "净收益率",
    netAnnualRent: "年度净租金",
    upfrontCosts: "一次性购房成本",
    grossAnnualRent: "年度总租金",
    agentFeeAnnual: "年度中介费",
    holdingAnnual: "年度持有成本",
    interestAnnual: "年度利息成本",
    loanAmount: "贷款金额",
    cashDeposit: "首付现金",
    breakdown: "购房费用明细",
    stampDuty: "印花税",
    govFees: "律师 / 注册 / 行政费",
    annualCashflow: "年度现金流",
    sensitivity: "敏感性分析",
    sensitivityHint: "展示租金变化和利率变化下的现金回报率。",
    selfTitle: "预计自住支出",
    annualFixed: "年度固定支出",
    perMonth: "折合每月",
    firstYear: "首年总支出",
    councilTax: "市政税",
    utilities: "水电网等杂费",
    annualFixedHint: "当前估算不含按揭本金偿还。",
    proTitle: "获取专业报告",
    proHint: "填写邮箱后即可收到一份参考你现有模板风格生成的专业 PDF 报告。",
    email: "邮箱地址",
    send: "发送专业报告",
    sending: "发送中...",
    sent: "报告已发送，请查收邮箱。",
    failed: "报告发送失败：",
    disclaimer: "以上结果仅供参考，具体税费、律师费、租金和贷款条件需以实际项目和当地政策为准。",
    noteGov: "律师费、注册费和行政杂费为估算值，用于帮助客户更完整地预估总预算。",
    reportSummaryTitle: "报告摘要",
    reportSummaryText: "本报告会把计算器输入整理成适合发给潜在客户的购房和回报分析。",
    paymentPlan: "参考付款节点",
    paymentPlanHint: "用于模拟定金、交换合同和交房尾款的资金安排。",
    nextSteps: "建议下一步",
    nextStepsItems: [
      "向开发商或律师确认项目的准确税费和注册费用。",
      "根据具体户型核实租金、物业费和维护成本假设。",
      "如考虑贷款，进一步比较不同按揭方案的利率和现金流影响。",
    ],
    buyerProfile: "买家画像",
    propertySnapshot: "物业概览",
    assumptions: "核心假设",
    websiteLabel: "官网",
  };

  return lang === "en" ? en : zh;
}

function calcUKStampDuty(price: number, homeCount: HomeCount, residency: Residency) {
  const p = Math.max(0, Math.round(price || 0));
  const isAdditional = homeCount === "additional";
  const isNonResident = residency === "nonResident";
  const extra = (isAdditional ? 0.05 : 0) + (isNonResident ? 0.02 : 0);
  const bandTax = (slice: number, rate: number) => (slice > 0 ? slice * (rate + extra) : 0);

  if (homeCount === "first" && p <= 500_000) {
    const baseTax = Math.max(0, Math.min(p, 500_000) - 300_000) * 0.05;
    const extraTax = p * extra;
    return Math.round(baseTax + extraTax);
  }

  const s0 = Math.max(0, Math.min(p, 125_000));
  const s2 = Math.max(0, Math.min(p, 250_000) - 125_000);
  const s5 = Math.max(0, Math.min(p, 925_000) - 250_000);
  const s10 = Math.max(0, Math.min(p, 1_500_000) - 925_000);
  const s12 = Math.max(0, p - 1_500_000);

  return Math.round(
    bandTax(s0, 0.0) +
      bandTax(s2, 0.02) +
      bandTax(s5, 0.05) +
      bandTax(s10, 0.1) +
      bandTax(s12, 0.12),
  );
}

function estimateStampDutyUAE(price: number) {
  return Math.round(Math.max(0, price * 0.04));
}

function estimateStampDutyTH(price: number) {
  return Math.round(Math.max(0, price * 0.02));
}

function estimateStampDutyJP(price: number) {
  return Math.round(Math.max(0, price * 0.01));
}

function estimateGovSolicitorFees(country: CountryCode, price: number) {
  const p = Math.max(0, price || 0);
  if (country === "uk") return Math.round(Math.max(1650, p * 0.004));
  if (country === "uae") return Math.round(Math.max(4580, p * 0.0015));
  if (country === "th") return Math.round(Math.max(25000, p * 0.002));
  return Math.round(Math.max(120000, p * 0.0015));
}

function estimateCouncilTaxUK(price: number) {
  const p = Math.max(0, price || 0);
  return Math.round(Math.min(3000, Math.max(1200, p * 0.005)));
}

function estimateUtilitiesUK() {
  return 2000;
}

function buildPaymentPlan(price: number) {
  const reservation = Math.min(2500, Math.round(price * 0.005));
  const exchange = Math.max(0, Math.round(price * 0.1 - reservation));
  const completion = Math.max(0, Math.round(price - reservation - exchange));

  return [
    { label: "Reservation / 定金", value: reservation },
    { label: "Exchange / 签约首付", value: exchange },
    { label: "Completion / 尾款", value: completion },
  ];
}

export function computeResult(inputs: Inputs): Result {
  const country = inputs.country;
  const currency = currencyByCountry(country);
  const price = parseNum(inputs.price);
  const monthlyRent = parseNum(inputs.monthlyRent);
  const agentFeePct = clampPct(parseNum(inputs.agentFeePct));
  const mortgagePct = clampPct(parseNum(inputs.mortgagePct));
  const aprPct = clampPct(parseNum(inputs.aprPct));
  const annualHoldingCosts = parseNum(inputs.annualHoldingCosts);
  const otherOneOffCosts = parseNum(inputs.otherOneOffCosts);

  let stampDuty = 0;
  if (country === "uk") stampDuty = calcUKStampDuty(price, inputs.homeCount, inputs.residency);
  if (country === "uae") stampDuty = estimateStampDutyUAE(price);
  if (country === "th") stampDuty = estimateStampDutyTH(price);
  if (country === "jp") stampDuty = estimateStampDutyJP(price);

  const govSolicitorFeesEst = estimateGovSolicitorFees(country, price);
  const upfrontCosts = Math.max(0, stampDuty + govSolicitorFeesEst + otherOneOffCosts);
  const loanAmount = Math.round((price * mortgagePct) / 100);
  const cashDeposit = Math.max(0, Math.round(price - loanAmount));
  const interestAnnual = Math.round((loanAmount * aprPct) / 100);
  const grossAnnualRent = Math.round(monthlyRent * 12);
  const agentFeeAnnual = Math.round((grossAnnualRent * agentFeePct) / 100);
  const holdingAnnual = Math.round(annualHoldingCosts);
  const netAnnualRent = Math.round(grossAnnualRent - agentFeeAnnual - holdingAnnual - interestAnnual);
  const netYieldPct = price > 0 ? (netAnnualRent / price) * 100 : 0;
  const cashOnCashPct =
    cashDeposit + upfrontCosts > 0 ? (netAnnualRent / (cashDeposit + upfrontCosts)) * 100 : 0;
  const councilTaxEst = country === "uk" ? estimateCouncilTaxUK(price) : 0;
  const utilitiesEst = country === "uk" ? estimateUtilitiesUK() : 0;
  const propertyFeeSelf = Math.round(parseNum(inputs.annualPropertyFeeSelf));
  const annualFixedOutgoings = Math.round(
    councilTaxEst + utilitiesEst + annualHoldingCosts + propertyFeeSelf,
  );
  const monthlyFixedOutgoings = Math.round(annualFixedOutgoings / 12);
  const firstYearTotalOutgoings = Math.round(annualFixedOutgoings + upfrontCosts);

  const sensitivity: SensitivityPoint[] = [];
  for (const apr of [3, 5, 7]) {
    for (const rentFactor of [0.9, 1.0, 1.1]) {
      const annualRent = Math.round(grossAnnualRent * rentFactor);
      const annualAgent = Math.round((annualRent * agentFeePct) / 100);
      const annualInterest = Math.round((loanAmount * apr) / 100);
      const net = Math.round(annualRent - annualAgent - holdingAnnual - annualInterest);
      const coc =
        cashDeposit + upfrontCosts > 0 ? (net / (cashDeposit + upfrontCosts)) * 100 : 0;
      sensitivity.push({ apr, rentFactor, cocPct: coc });
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
    paymentPlan: buildPaymentPlan(price),
    sensitivity,
  };
}

export function formatResult(result: Result) {
  return {
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
  };
}

export function buildReportPayload(inputs: Inputs, email: string): ProReportPayload {
  const lang = inputs.lang === "en" ? "en" : "zh";
  const country = normalizeCountry(inputs.country);
  const purpose = normalizePurpose(inputs.purpose);
  const ui = getUiText(lang);
  const result = computeResult(inputs);

  return {
    email,
    lang,
    purpose,
    country,
    currency: currencyByCountry(country),
    ui,
    inputs: {
      price: parseNum(inputs.price),
      monthlyRent: parseNum(inputs.monthlyRent),
      agentFeePct: clampPct(parseNum(inputs.agentFeePct)),
      mortgagePct: clampPct(parseNum(inputs.mortgagePct)),
      aprPct: clampPct(parseNum(inputs.aprPct)),
      annualHoldingCosts: parseNum(inputs.annualHoldingCosts),
      otherOneOffCosts: parseNum(inputs.otherOneOffCosts),
      annualPropertyFeeSelf: parseNum(inputs.annualPropertyFeeSelf),
      region: inputs.region || "",
      project: inputs.project || "",
      homeCount: inputs.homeCount,
      residency: inputs.residency,
    },
    results: {
      ...result,
      fmt: formatResult(result),
    },
    meta: {
      countryLabel: COUNTRY_NAME[lang][country],
      createdAt: new Date().toLocaleString(lang === "en" ? "en-GB" : "zh-CN"),
      website: "https://www.mygpc.co",
    },
    createdAtISO: new Date().toISOString(),
    brand: {
      name: "MyGPC",
      website: "www.mygpc.co",
    },
  };
}
