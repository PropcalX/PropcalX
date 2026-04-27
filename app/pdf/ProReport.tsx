import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import path from "node:path";
import type { ProReportPayload } from "../lib/reporting";

export type ProReportProps = {
  data: ProReportPayload;
};

const fontPath = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "MyGPCSans",
  fonts: [
    { src: path.join(fontPath, "NotoSansSC-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontPath, "NotoSansSC-Regular.ttf"), fontWeight: 500 },
    { src: path.join(fontPath, "NotoSansSC-Regular.ttf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: 28,
    backgroundColor: "#f7f2e8",
    fontFamily: "MyGPCSans",
    color: "#14202a",
    fontSize: 10,
  },
  hero: {
    backgroundColor: "#0b1720",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  heroBrand: {
    color: "#d7c28a",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  heroTitle: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 700,
  },
  heroMeta: {
    alignItems: "flex-end",
    color: "#c1c6ca",
    fontSize: 9,
    gap: 3,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: "#132430",
    borderRadius: 12,
    padding: 12,
  },
  kpiLabel: {
    color: "#d7c28a",
    fontSize: 8,
    textTransform: "uppercase",
  },
  kpiValue: {
    marginTop: 5,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#13202a",
  },
  panel: {
    backgroundColor: "#ffffff",
    border: "1 solid #e7dcc0",
    borderRadius: 14,
    padding: 12,
  },
  panelTitle: {
    fontSize: 9,
    color: "#8d6f27",
    fontWeight: 700,
    marginBottom: 8,
  },
  split: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flexGrow: 1,
    flexBasis: 0,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 5,
    borderBottom: "1 solid #eee8da",
  },
  kvKey: {
    color: "#51616c",
  },
  kvValue: {
    color: "#0f1c24",
    fontWeight: 700,
  },
  table: {
    borderRadius: 12,
    border: "1 solid #e5dbc2",
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#10202b",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottom: "1 solid #eee6d4",
  },
  cellLabel: {
    flexGrow: 2.3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    color: "#23343f",
  },
  cellValue: {
    flexGrow: 1.2,
    paddingHorizontal: 9,
    paddingVertical: 7,
    color: "#10202b",
    textAlign: "right",
  },
  cellValueStrong: {
    fontWeight: 700,
  },
  headCell: {
    color: "#ffffff",
    fontWeight: 700,
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTop: "1 solid #dbcfae",
    color: "#5d6a71",
    fontSize: 8.3,
    lineHeight: 1.35,
  },
  note: {
    marginTop: 8,
    color: "#556770",
    lineHeight: 1.45,
  },
});

function gbp(value: number) {
  return `GBP ${Math.round(value || 0).toLocaleString("en-GB")}`;
}

function cny(value: number, rate: number) {
  return `CNY ${Math.round((value || 0) * rate).toLocaleString("en-GB")}`;
}

function pct(value: number) {
  return `${(value || 0).toFixed(2)}%`;
}

function Table({
  rows,
  rate,
  includeCny = true,
}: {
  rows: Array<{ label: string; value: number; date?: string; strong?: boolean }>;
  rate: number;
  includeCny?: boolean;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
          <Text style={[styles.cellLabel, styles.headCell]}>Line item</Text>
          <Text style={[styles.cellValue, styles.headCell]}>GBP</Text>
          {includeCny ? <Text style={[styles.cellValue, styles.headCell]}>CNY</Text> : null}
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={index === rows.length - 1 ? [styles.tableRow, { borderBottom: "none" }] : styles.tableRow}
        >
          <Text style={styles.cellLabel}>{row.date ? `${row.date} · ${row.label}` : row.label}</Text>
          <Text style={row.strong ? [styles.cellValue, styles.cellValueStrong] : styles.cellValue}>{gbp(row.value)}</Text>
          {includeCny ? (
            <Text style={row.strong ? [styles.cellValue, styles.cellValueStrong] : styles.cellValue}>{cny(row.value, rate)}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function ProReport({ data }: ProReportProps) {
  const fb = data.financialBreakdown;
  const rent = data.rentalMarket;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.row}>
            <View>
              <Text style={styles.heroBrand}>{data.brand.name}</Text>
              <Text style={styles.heroTitle}>Financial Breakdown Report</Text>
            </View>
            <View style={styles.heroMeta}>
              <Text>{fb.development || data.reportDetails.development || data.inputs.project}</Text>
              <Text>{fb.postcode || data.reportDetails.postcode || data.meta.countryLabel}</Text>
              <Text>{data.meta.createdAt}</Text>
              <Text>{data.brand.website}</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Discounted Price</Text>
              <Text style={styles.kpiValue}>{gbp(fb.discountedPrice)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Annual Rental Income</Text>
              <Text style={styles.kpiValue}>{gbp(fb.annualRentalIncome)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Cash Yield</Text>
              <Text style={styles.kpiValue}>{pct(fb.netAnnualYieldPct)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Property snapshot</Text>
        <View style={styles.split}>
          <View style={[styles.panel, styles.half]}>
            <Text style={styles.panelTitle}>Property details</Text>
            {[
              ["Development", fb.development || "-"],
              ["Plot Number", fb.plotNumber || "-"],
              ["Level / Aspect", fb.levelAspect || "-"],
              ["Postcode", fb.postcode || "-"],
              ["Property Type", data.reportDetails.propertyType || "-"],
              ["Bedrooms", data.reportDetails.bedrooms || "-"],
            ].map(([key, value]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{key}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.panel, styles.half]}>
            <Text style={styles.panelTitle}>Area and pricing</Text>
            {[
              ["Internal area (sqft)", fb.internalAreaSqft.toLocaleString("en-GB")],
              ["Internal area (sqm)", fb.internalAreaSqm.toLocaleString("en-GB")],
              ["Total area (sqm)", fb.totalAreaSqm.toLocaleString("en-GB")],
              ["Asking price", gbp(fb.askingPrice)],
              ["Discounted price", gbp(fb.discountedPrice)],
              ["FX rate", `1 GBP = ${fb.cnyRate} CNY`],
            ].map(([key, value]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{key}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Rental and profit summary</Text>
        <View style={styles.split}>
          <View style={[styles.panel, styles.half]}>
            <Text style={styles.panelTitle}>Cash purchase scenario</Text>
            {[
              ["Monthly rent", gbp(fb.monthlyRent)],
              ["Rental pw", `GBP ${fb.rentalPerWeek.toLocaleString("en-GB")}`],
              ["Annual rental income", gbp(fb.annualRentalIncome)],
              ["Annual maintenance fee", gbp(fb.annualMaintenanceFee)],
              ["Other annual holding costs", gbp(fb.annualHoldingCosts)],
              ["Annual cash profit", gbp(fb.annualCashProfit)],
              ["Net annual yield", pct(fb.netAnnualYieldPct)],
            ].map(([key, value]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{key}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.panel, styles.half]}>
            <Text style={styles.panelTitle}>Mortgage scenario</Text>
            {[
              ["Loan amount", gbp(fb.loanAmount)],
              ["Annual interest cost", gbp(fb.annualInterestCost)],
              ["Annual leveraged profit", gbp(fb.annualLeveragedProfit)],
              ["Leveraged yield", pct(fb.leveragedYieldPct)],
            ].map(([key, value]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{key}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
            {rent ? (
              <Text style={styles.note}>
                Rightmove evidence: median {gbp(rent.medianPcm)} pcm, average {gbp(rent.averagePcm)} pcm, based on {rent.listingCount} nearby listings.
              </Text>
            ) : (
              <Text style={styles.note}>Rightmove rental evidence was not attached to this report.</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>One-off buying costs</Text>
        <Table
          rate={fb.cnyRate}
          rows={[
            ...fb.feeLines.map((item) => ({ label: item.label, value: item.value })),
            { label: "Total one-off buying costs", value: fb.oneOffCostsTotal, strong: true },
            { label: "Total purchase cost", value: fb.totalPurchaseCost, strong: true },
          ]}
        />

        <Text style={styles.sectionTitle}>Payment plan</Text>
        <Table
          rate={fb.cnyRate}
          rows={fb.paymentPlan.map((item) => ({
            label: item.label,
            value: item.value,
            date: item.date,
          }))}
        />

        {rent ? (
          <>
            <Text style={styles.sectionTitle}>Rightmove market evidence</Text>
            <Table
              rate={fb.cnyRate}
              includeCny={false}
              rows={rent.sampleListings.map((item) => ({
                label: `${item.title}${item.bedrooms ? ` · ${item.bedrooms} bed` : ""}${item.propertyType ? ` · ${item.propertyType}` : ""}`,
                value: item.pricePcm,
              }))}
            />
          </>
        ) : null}

        {fb.notes ? <Text style={styles.note}>Notes: {fb.notes}</Text> : null}

        <Text style={styles.footer}>{data.ui.disclaimer}</Text>
      </Page>
    </Document>
  );
}
