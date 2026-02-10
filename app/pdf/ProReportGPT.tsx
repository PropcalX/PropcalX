// app/pdf/ProReport.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";
import path from "path";

const fontNoto = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf");
const fontNotoSC = path.join(process.cwd(), "public", "fonts", "NotoSansSC.ttf");

Font.register({
  family: "MyGPCFont",
  fonts: [
    { src: fontNoto, fontWeight: "normal" },
    { src: fontNotoSC, fontWeight: "bold" }, // 这里不是真的 bold，只是给中文兜底
  ],
});
type CountryCode = "uk" | "uae" | "th" | "jp";

type ReportData = {
  lang: "en" | "zh";
  createdAtISO: string;

  purpose: "investment" | "owner";
  country: CountryCode;
  currency: string;

  propertyName?: string;
  location?: string;

  price: number;
  monthlyRent?: number;

  mortgagePct?: number;
  aprPct?: number;
  agentFeePct?: number;

  annualHoldingCosts?: number;
  otherOneOffCosts?: number;

  results: {
    upfrontCosts: number;
    grossAnnualRent: number;
    agentFeeAnnual: number;
    interestAnnual: number;
    netAnnualRent: number;

    netYieldPct: number;
    cashOnCashPct: number;

    ownerAnnualOutgoings?: number;
    ownerMonthlyOutgoings?: number;

    breakdown: Array<{ label: string; value: number }>;
  };

  brand?: {
    name: string;
    website: string;
  };

  toEmail?: string;
};

const COLORS = {
  bg: "#0B0B0B",
  panel: "#111111",
  panel2: "#0F0F0F",
  line: "#242424",
  border: "#3A2F12",
  gold: "#F6E39A",
  gold2: "#D9B54A",
  goldSoft: "#E6D28A",
  white: "#FFFFFF",
  muted: "#CDBE86",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingLeft: 34,
    paddingRight: 34,
    paddingBottom: 58, // ✅ 留出固定 footer 空间，避免 footer 被挤到下一页
    fontSize: 10.5,
    fontFamily: "MyGPCFont",
    backgroundColor: COLORS.bg,
    color: COLORS.goldSoft,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: { fontSize: 16, fontWeight: 700, color: COLORS.white },
  meta: { fontSize: 9.5, color: COLORS.goldSoft, lineHeight: 1.35 },

  title: { fontSize: 14, fontWeight: 800, color: COLORS.white },
  subtitle: { marginTop: 6, fontSize: 10.5, color: COLORS.goldSoft, lineHeight: 1.35 },

  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: COLORS.panel,
  },
  panelTight: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.panel2,
  },

  sectionHeader: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionHeaderText: { fontSize: 11, fontWeight: 800, color: COLORS.gold },

  grid2: { flexDirection: "row", gap: 10 },
  colWide: { flexGrow: 1.25 }, // ✅ 左列更宽，避免竖排
  colNarrow: { flexGrow: 0.95 },

  kvRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  kvKey: { color: COLORS.muted },
  kvVal: { color: COLORS.gold, fontWeight: 700 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  hero: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: COLORS.panel,
    marginBottom: 10,
  },
  heroLabel: { fontSize: 10, color: COLORS.goldSoft },
  heroValue: { fontSize: 40, fontWeight: 900, color: COLORS.white, marginTop: 4 },
  heroNote: { marginTop: 6, fontSize: 9.5, color: COLORS.goldSoft },

  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpiCard: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.panel2,
  },
  kpiTitle: { fontSize: 9.5, color: COLORS.muted },
  kpiValue: { fontSize: 15, fontWeight: 900, color: COLORS.gold, marginTop: 6 },

  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  trHead: { flexDirection: "row", backgroundColor: "#151515", paddingVertical: 8, paddingHorizontal: 10 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  th: { color: COLORS.gold, fontWeight: 800, fontSize: 9.5 },
  td: { color: COLORS.goldSoft, fontSize: 9.5 },
  tdStrong: { color: COLORS.gold, fontSize: 9.5, fontWeight: 800 },

  // ✅ 关键：左列更宽 + 文本不允许逐字符断行（wrap={false}）
  cellA: { flex: 2.2 },
  cellB: { flex: 1, textAlign: "right" },

  // ✅ 固定 footer，彻底消灭“第4页只剩一行字”
  footer: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 22,
    fontSize: 8.8,
    color: COLORS.muted,
    lineHeight: 1.35,
  },

  // Sensitivity
  matrix: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: "hidden" },
  matrixRow: { flexDirection: "row" },
  mCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.line,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  mCellHead: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.line,
    backgroundColor: "#151515",
  },
  mText: { fontSize: 9, color: COLORS.goldSoft },
  mTextBold: { fontSize: 9, fontWeight: 800, color: COLORS.gold },
});

function t(lang: "en" | "zh") {
  const en = {
    coverTitle: "Pro Property Report",
    coverTag: "Financial model-style summary (MVP)",
    disclaimer:
      "Disclaimer: Estimates only. Taxes/fees vary by buyer profile and local regulations. This report is not financial advice.",
    country: "Country",
    currency: "Currency",
    purpose: "Purpose",
    investment: "Investment",
    owner: "Owner-occupier",
    created: "Created",
    for: "For",
    property: "Property Overview",
    acquisition: "Acquisition Assumptions",
    financing: "Financing Assumptions",
    operating: "Operating Assumptions",
    outputs: "Outputs",
    cashRoi: "Cash-on-Cash ROI",
    netYield: "Net Yield (on price)",
    netAnnual: "Net Annual Rent",
    upfront: "Upfront Costs",
    annualCash: "Annual Cashflow",
    upfrontBreak: "Upfront Cost Breakdown",
    sensitivity: "Sensitivity (Rent vs APR)",
    price: "Purchase price",
    name: "Name",
    location: "Location",
    monthlyRent: "Monthly rent",
    grossAnnualRent: "Gross annual rent",
    agentFeePct: "Letting agent fee %",
    agentFeeAnnual: "Agent fee (annual)",
    holding: "Holding costs (annual)",
    mortgagePct: "Mortgage %",
    loanAmount: "Loan amount",
    deposit: "Cash deposit",
    apr: "APR %",
    interest: "Interest (annual)",
    otherOneOff: "Other one-off costs",
    total: "Total",
    net: "Net annual rent",
    rowItem: "Item",
    rowAmount: "Amount",
    rowLine: "Line",
    rentChange: "Rent change",
    aprRow: "APR",
  };
  const zh = {
    coverTitle: "专业版房产测算报告",
    coverTag: "金融模型版式（MVP）",
    disclaimer:
      "免责声明：本报告为预估结果，税费/成本可能因城市、交易类型、买家身份等而变化。本报告不构成任何投资建议。",
    country: "国家",
    currency: "币种",
    purpose: "用途",
    investment: "投资",
    owner: "自住",
    created: "生成时间",
    for: "收件人",
    property: "房产概览",
    acquisition: "购置假设",
    financing: "融资假设",
    operating: "运营假设",
    outputs: "输出结果",
    cashRoi: "现金回报率（Cash-on-Cash）",
    netYield: "净回报率（按总价）",
    netAnnual: "年净租金",
    upfront: "一次性成本",
    annualCash: "年度现金流",
    upfrontBreak: "一次性成本拆分",
    sensitivity: "敏感性分析（租金 vs 利率）",
    price: "购房总价",
    name: "名称",
    location: "城市/位置",
    monthlyRent: "月租金",
    grossAnnualRent: "年租金总额",
    agentFeePct: "中介费 %",
    agentFeeAnnual: "年中介费",
    holding: "年度持有成本",
    mortgagePct: "贷款比例 %",
    loanAmount: "贷款金额",
    deposit: "首付现金",
    apr: "年利率 %",
    interest: "年利息",
    otherOneOff: "其他一次性费用",
    total: "合计",
    net: "年净租金",
    rowItem: "项目",
    rowAmount: "金额",
    rowLine: "科目",
    rentChange: "租金变化",
    aprRow: "利率",
  };
  return lang === "zh" ? zh : en;
}

function countryName(code: CountryCode, lang: "en" | "zh") {
  const map = {
    uk: { en: "UK", zh: "英国" },
    uae: { en: "UAE", zh: "阿联酋" },
    th: { en: "Thailand", zh: "泰国" },
    jp: { en: "Japan", zh: "日本" },
  } as const;
  return map[code][lang];
}

const safeNum = (n: any) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const money = (currency: string, n: number) =>
  `${currency} ${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-GB")}`;

const pct2 = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(2)}%`;

function computeLoan(price: number, mortgagePct: number) {
  const loan = (price * mortgagePct) / 100;
  const deposit = Math.max(0, price - loan);
  return { loan, deposit };
}

function computeNetAnnual({
  price,
  monthlyRent,
  agentFeePct,
  holdingAnnual,
  mortgagePct,
  aprPct,
}: {
  price: number;
  monthlyRent: number;
  agentFeePct: number;
  holdingAnnual: number;
  mortgagePct: number;
  aprPct: number;
}) {
  const gross = monthlyRent * 12;
  const agent = gross * (agentFeePct / 100);
  const { loan } = computeLoan(price, mortgagePct);
  const interest = loan * (aprPct / 100);
  const net = gross - agent - holdingAnnual - interest;
  return { gross, agent, interest, net };
}

function computeCashOnCash(netAnnual: number, deposit: number, upfront: number) {
  const base = deposit + upfront;
  if (base <= 0) return 0;
  return (netAnnual / base) * 100;
}

function Section({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={styles.kvVal}>{v}</Text>
    </View>
  );
}

function TableKV({
  headA,
  headB,
  rows,
}: {
  headA: string;
  headB: string;
  rows: Array<{ a: string; b: string; strong?: boolean }>;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.trHead}>
        <Text style={[styles.th, styles.cellA]}>{headA}</Text>
        <Text style={[styles.th, styles.cellB]}>{headB}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tr}>
          {/* ✅ wrap={false} 防止逐字符断行 */}
          <Text wrap={false} style={[r.strong ? styles.tdStrong : styles.td, styles.cellA]}>
            {r.a}
          </Text>
          <Text style={[r.strong ? styles.tdStrong : styles.td, styles.cellB]}>{r.b}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ text }: { text: string }) {
  return <Text style={styles.footer}>{text}</Text>;
}

function Cover({ data }: { data: ReportData }) {
  const c = t(data.lang);
  const brandName = data.brand?.name ?? "MyGPC";
  const website = data.brand?.website ?? "mygpc.co";
  const purposeText = data.purpose === "investment" ? c.investment : c.owner;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>{brandName}</Text>
        <View>
          <Text style={styles.meta}>{c.coverTag}</Text>
          <Text style={styles.meta}>
            {c.country}: {countryName(data.country, data.lang)}  |  {c.currency}: {data.currency}
          </Text>
          <Text style={styles.meta}>
            {c.purpose}: {purposeText}
          </Text>
        </View>
      </View>

      <View style={[styles.panel, { padding: 18, marginTop: 8 }]}>
        <Text style={styles.title}>{c.coverTitle}</Text>
        <Text style={styles.subtitle}>
          {data.lang === "zh"
            ? "品牌化可转发测算：输入假设 + 输出结果 + 成本拆分 + 敏感性分析。"
            : "A branded shareable snapshot: assumptions + outputs + breakdown + sensitivity."}
        </Text>

        <View style={{ marginTop: 14 }}>
          <KV k={c.created} v={new Date(data.createdAtISO).toLocaleString(data.lang === "zh" ? "zh-CN" : "en-GB")} />
          {data.toEmail ? <KV k={c.for} v={data.toEmail} /> : null}
          <KV k={c.country} v={countryName(data.country, data.lang)} />
          <KV k={c.currency} v={data.currency} />
          <KV k={c.purpose} v={purposeText} />
          <KV k={c.name} v={data.propertyName?.trim() ? data.propertyName : (data.lang === "zh" ? "（可选）" : "(optional)")} />
          <KV k={c.location} v={data.location?.trim() ? data.location : (data.lang === "zh" ? "（可选）" : "(optional)")} />
        </View>

        <View style={styles.divider} />
        <Text style={{ fontSize: 9.5, color: COLORS.muted, lineHeight: 1.5 }}>
          {data.lang === "zh"
            ? `品牌网址：${website}  •  建议：截图 KPI 与敏感性矩阵用于宣传。`
            : `Website: ${website}  •  Tip: screenshot KPIs & the sensitivity matrix for marketing.`}
        </Text>
      </View>

      <Footer text={c.disclaimer} />
    </Page>
  );
}

function Assumptions({ data }: { data: ReportData }) {
  const c = t(data.lang);

  const price = safeNum(data.price);
  const rent = safeNum(data.monthlyRent);
  const mortgagePct = safeNum(data.mortgagePct);
  const apr = safeNum(data.aprPct);
  const agentFeePct = safeNum(data.agentFeePct);
  const holding = safeNum(data.annualHoldingCosts);
  const otherOneOff = safeNum(data.otherOneOffCosts);

  const { loan, deposit } = computeLoan(price, mortgagePct);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>{data.brand?.name ?? "MyGPC"}</Text>
        <View>
          <Text style={styles.meta}>
            {c.country}: {countryName(data.country, data.lang)}  |  {c.currency}: {data.currency}
          </Text>
          <Text style={styles.meta}>
            {c.created}: {new Date(data.createdAtISO).toLocaleString(data.lang === "zh" ? "zh-CN" : "en-GB")}
          </Text>
        </View>
      </View>

      <Section title={c.property} />
      <View style={styles.grid2}>
        <View style={[styles.colWide, styles.panelTight]}>
          <KV k={c.name} v={data.propertyName?.trim() ? data.propertyName : "-"} />
          <KV k={c.location} v={data.location?.trim() ? data.location : "-"} />
          <KV k={c.country} v={countryName(data.country, data.lang)} />
          <KV k={c.currency} v={data.currency} />
          <KV k={c.price} v={money(data.currency, price)} />
        </View>

        <View style={[styles.colNarrow, styles.panelTight]}>
          {data.purpose === "investment" ? (
            <>
              <KV k={c.monthlyRent} v={money(data.currency, rent)} />
              <KV k={c.grossAnnualRent} v={money(data.currency, rent * 12)} />
              <KV k={c.agentFeePct} v={pct2(agentFeePct)} />
              <KV k={c.holding} v={money(data.currency, holding)} />
            </>
          ) : (
            <>
              <KV k={c.holding} v={money(data.currency, holding)} />
              <KV k={c.otherOneOff} v={money(data.currency, otherOneOff)} />
              <KV k={c.upfront} v={money(data.currency, safeNum(data.results.upfrontCosts))} />
            </>
          )}
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <Section title={c.acquisition} />
        <TableKV
          headA={c.rowLine}
          headB={c.rowAmount}
          rows={[
            { a: c.upfront, b: money(data.currency, safeNum(data.results.upfrontCosts)), strong: true },
            { a: c.otherOneOff, b: money(data.currency, otherOneOff) },
          ]}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Section title={c.financing} />
        <TableKV
          headA={c.rowLine}
          headB={c.rowAmount}
          rows={[
            { a: c.mortgagePct, b: pct2(mortgagePct) },
            { a: c.loanAmount, b: money(data.currency, loan), strong: true },
            { a: c.deposit, b: money(data.currency, deposit), strong: true },
            { a: c.apr, b: pct2(apr) },
          ]}
        />
      </View>

      <Footer text={c.disclaimer} />
    </Page>
  );
}

function Output({ data }: { data: ReportData }) {
  const c = t(data.lang);
  const isOwner = data.purpose === "owner";

  const heroLabel = isOwner
    ? (data.lang === "zh" ? "年度固定支出（预估）" : "Estimated Annual Outgoings")
    : c.cashRoi;

  const heroValue = isOwner
    ? money(data.currency, safeNum(data.results.ownerAnnualOutgoings ?? safeNum(data.annualHoldingCosts)))
    : pct2(safeNum(data.results.cashOnCashPct));

  const price = safeNum(data.price);
  const mortgagePct = safeNum(data.mortgagePct);
  const { loan, deposit } = computeLoan(price, mortgagePct);

  const breakdown = Array.isArray(data.results.breakdown) ? data.results.breakdown : [];
  const hasBreakdown = breakdown.length > 0;

  const gross = safeNum(data.results.grossAnnualRent);
  const agentAnnual = safeNum(data.results.agentFeeAnnual);
  const holding = safeNum(data.annualHoldingCosts);
  const interest = safeNum(data.results.interestAnnual);
  const net = safeNum(data.results.netAnnualRent);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>{data.brand?.name ?? "MyGPC"}</Text>
        <View>
          <Text style={styles.meta}>
            {c.outputs} • {countryName(data.country, data.lang)} • {data.currency}
          </Text>
          <Text style={styles.meta}>
            {new Date(data.createdAtISO).toLocaleString(data.lang === "zh" ? "zh-CN" : "en-GB")}
          </Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{heroLabel}</Text>
        <Text style={styles.heroValue}>{heroValue}</Text>
        <Text style={styles.heroNote}>
          {data.lang === "zh"
            ? "适合截图宣传的高端版式（MVP 预估）。"
            : "Luxury layout designed for screenshots (MVP estimates)."}
        </Text>
      </View>

      {!isOwner && (
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>{c.netYield}</Text>
            <Text style={styles.kpiValue}>{pct2(safeNum(data.results.netYieldPct))}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>{c.netAnnual}</Text>
            <Text style={styles.kpiValue}>{money(data.currency, net)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>{c.upfront}</Text>
            <Text style={styles.kpiValue}>{money(data.currency, safeNum(data.results.upfrontCosts))}</Text>
          </View>
        </View>
      )}

      <View style={styles.grid2}>
        {/* ✅ 左边宽：现金流 */}
        <View style={[styles.colWide, styles.panelTight]}>
          <Section title={c.annualCash} />
          <TableKV
            headA={c.rowLine}
            headB={c.rowAmount}
            rows={[
              { a: c.grossAnnualRent, b: money(data.currency, gross), strong: true },
              { a: c.agentFeeAnnual, b: money(data.currency, agentAnnual) },
              { a: c.holding, b: money(data.currency, holding) },
              { a: c.interest, b: money(data.currency, interest) },
              { a: c.net, b: money(data.currency, net), strong: true },
            ]}
          />
          <View style={styles.divider} />
          <KV k={c.loanAmount} v={money(data.currency, loan)} />
          <KV k={c.deposit} v={money(data.currency, deposit)} />
        </View>

        {/* ✅ 右边：一次性拆分 */}
        <View style={[styles.colNarrow, styles.panelTight]}>
          <Section title={c.upfrontBreak} />
          {hasBreakdown ? (
            <TableKV
              headA={c.rowItem}
              headB={c.rowAmount}
              rows={[
                ...breakdown.slice(0, 8).map((x) => ({
                  a: x.label,
                  b: money(data.currency, safeNum(x.value)),
                })),
                { a: c.total, b: money(data.currency, safeNum(data.results.upfrontCosts)), strong: true },
              ]}
            />
          ) : (
            <Text style={{ color: COLORS.muted, lineHeight: 1.4 }}>
              {data.lang === "zh"
                ? "暂无拆分明细（建议将印花税/政府与律师费/其他一次性费用分别传入 breakdown）。"
                : "No breakdown items. Suggest splitting Stamp Duty / Fees / Other into breakdown."}
            </Text>
          )}
        </View>
      </View>

      <Footer text={c.disclaimer} />
    </Page>
  );
}

function Sensitivity({ data }: { data: ReportData }) {
  const c = t(data.lang);

  const price = safeNum(data.price);
  const monthlyRent = safeNum(data.monthlyRent);
  const agentFeePct = safeNum(data.agentFeePct);
  const holding = safeNum(data.annualHoldingCosts);
  const mortgagePct = safeNum(data.mortgagePct);
  const upfront = safeNum(data.results.upfrontCosts);

  const { deposit } = computeLoan(price, mortgagePct);

  const rentMultipliers = [0.9, 1.0, 1.1];
  const aprLevels = [3, 5, 7];

  function cellValue(rMult: number, apr: number) {
    const calc = computeNetAnnual({
      price,
      monthlyRent: monthlyRent * rMult,
      agentFeePct,
      holdingAnnual: holding,
      mortgagePct,
      aprPct: apr,
    });
    const coc = computeCashOnCash(calc.net, deposit, upfront);
    return coc;
  }

  const rentLabels = data.lang === "zh" ? ["-10%", "基准", "+10%"] : ["-10%", "Base", "+10%"];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>{data.brand?.name ?? "MyGPC"}</Text>
        <View>
          <Text style={styles.meta}>
            {c.sensitivity} • {countryName(data.country, data.lang)} • {data.currency}
          </Text>
          <Text style={styles.meta}>
            {new Date(data.createdAtISO).toLocaleString(data.lang === "zh" ? "zh-CN" : "en-GB")}
          </Text>
        </View>
      </View>

      <Section title={c.sensitivity} />
      <Text style={{ color: COLORS.muted, fontSize: 9.5, marginBottom: 10, lineHeight: 1.4 }}>
        {data.lang === "zh"
          ? "下表展示在“租金变化 × 利率变化”下的现金回报率（%）。模型为 MVP 的利息-only 估算。"
          : "Table shows Cash-on-Cash ROI (%) under Rent change × APR change. MVP assumes interest-only."}
      </Text>

      <View style={styles.matrix}>
        <View style={styles.matrixRow}>
          <View style={[styles.mCellHead, { flex: 1 }]}>
            <Text style={styles.mTextBold}>
              {c.aprRow} \\ {c.rentChange}
            </Text>
          </View>
          {rentLabels.map((lab, i) => (
            <View key={i} style={styles.mCellHead}>
              <Text style={styles.mTextBold}>{lab}</Text>
            </View>
          ))}
        </View>

        {aprLevels.map((apr, rIdx) => (
          <View key={rIdx} style={styles.matrixRow}>
            <View style={[styles.mCellHead, { flex: 1, backgroundColor: "#121212" }]}>
              <Text style={styles.mTextBold}>{apr}%</Text>
            </View>

            {rentMultipliers.map((m, cIdx) => {
              const v = cellValue(m, apr);
              return (
                <View key={cIdx} style={styles.mCell}>
                  <Text style={styles.mTextBold}>{pct2(v)}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <Footer text={c.disclaimer} />
    </Page>
  );
}

export default function ProReportPDF({ data }: { data: ReportData }) {
  return (
    <Document>
      <Cover data={data} />
      <Assumptions data={data} />
      <Output data={data} />
      <Sensitivity data={data} />
    </Document>
  );
}