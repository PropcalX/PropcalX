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
    { src: path.join(fontPath, "NotoSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontPath, "NotoSans-Variable.ttf"), fontWeight: 700 },
    { src: path.join(fontPath, "NotoSansSC-Regular.ttf"), fontWeight: 500 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 34,
    backgroundColor: "#f6f2e8",
    fontFamily: "MyGPCSans",
    color: "#14202a",
    fontSize: 10.5,
  },
  hero: {
    backgroundColor: "#0b1720",
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBrand: {
    color: "#d7c28a",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 700,
    maxWidth: 300,
    lineHeight: 1.2,
  },
  heroMeta: {
    alignItems: "flex-end",
    color: "#b8c0c5",
    fontSize: 9.5,
    gap: 4,
  },
  heroGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: "#132430",
    borderRadius: 14,
    padding: 12,
  },
  heroCardLabel: {
    color: "#d7c28a",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroCardValue: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
  },
  heroCardSub: {
    marginTop: 4,
    color: "#b8c0c5",
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#0d1e29",
    marginBottom: 8,
  },
  sectionIntro: {
    color: "#42535d",
    lineHeight: 1.45,
    marginBottom: 10,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  panel: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    border: "1 solid #e4d7b6",
    padding: 14,
  },
  panelTitle: {
    fontSize: 10,
    color: "#8b6e24",
    fontWeight: 700,
    marginBottom: 8,
  },
  keyValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 5,
    borderBottom: "1 solid #ece8dd",
  },
  keyValueRowLast: {
    borderBottom: "none",
  },
  keyLabel: {
    color: "#43535d",
  },
  keyValue: {
    color: "#0e1b24",
    fontWeight: 700,
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniCell: {
    width: "48%",
    backgroundColor: "#fffaf1",
    borderRadius: 10,
    padding: 10,
    border: "1 solid #efe2be",
  },
  miniLabel: {
    fontSize: 8.5,
    color: "#8b6e24",
  },
  miniValue: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: 700,
  },
  table: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1 solid #e7dec8",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#10202b",
    color: "#ffffff",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottom: "1 solid #ede6d7",
  },
  cell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 9.5,
  },
  listItem: {
    marginTop: 5,
    color: "#34434d",
    lineHeight: 1.45,
  },
  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTop: "1 solid #d8ccb0",
    color: "#596972",
    fontSize: 8.5,
    lineHeight: 1.4,
  },
});

function rowStyle(index: number, total: number) {
  return total - 1 === index ? [styles.keyValueRow, styles.keyValueRowLast] : styles.keyValueRow;
}

export default function ProReport({ data }: ProReportProps) {
  const isInvestment = data.purpose === "investment";
  const currency = data.currency;
  const projectLabel = data.inputs.project || data.inputs.region || data.meta.countryLabel;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroBrand}>{data.brand.name}</Text>
              <Text style={styles.heroTitle}>
                {isInvestment ? "Professional Property Investment Report" : "Professional Property Cost Report"}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <Text>{projectLabel}</Text>
              <Text>{data.meta.countryLabel}</Text>
              <Text>{data.meta.createdAt}</Text>
              <Text>{data.brand.website}</Text>
            </View>
          </View>

          <View style={styles.heroGrid}>
            <View style={styles.heroCard}>
              <Text style={styles.heroCardLabel}>
                {isInvestment ? data.ui.netYield : data.ui.annualFixed}
              </Text>
              <Text style={styles.heroCardValue}>
                {isInvestment ? data.results.fmt.netYieldPct : `${currency} ${data.results.fmt.annualFixedOutgoings}`}
              </Text>
              <Text style={styles.heroCardSub}>{data.ui.reportSummaryText}</Text>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.heroCardLabel}>
                {isInvestment ? data.ui.netAnnualRent : data.ui.firstYear}
              </Text>
              <Text style={styles.heroCardValue}>
                {isInvestment
                  ? `${currency} ${data.results.fmt.netAnnualRent}`
                  : `${currency} ${data.results.fmt.firstYearTotalOutgoings}`}
              </Text>
              <Text style={styles.heroCardSub}>{data.ui.noteGov}</Text>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.heroCardLabel}>{data.ui.upfrontCosts}</Text>
              <Text style={styles.heroCardValue}>{currency} {data.results.fmt.upfrontCosts}</Text>
              <Text style={styles.heroCardSub}>{data.ui.paymentPlanHint}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.ui.reportSummaryTitle}</Text>
          <Text style={styles.sectionIntro}>{data.ui.reportSummaryText}</Text>
          <View style={styles.twoCol}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{data.ui.propertySnapshot}</Text>
              {[
                [data.ui.countryLabel, data.meta.countryLabel],
                [data.ui.currencyLabel, currency],
                [data.ui.project, data.inputs.project || "-"],
                [data.ui.region, data.inputs.region || "-"],
              ].map(([label, value], index, arr) => (
                <View key={label} style={rowStyle(index, arr.length)}>
                  <Text style={styles.keyLabel}>{label}</Text>
                  <Text style={styles.keyValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{data.ui.buyerProfile}</Text>
              {[
                [data.ui.purpose, isInvestment ? data.ui.purposeInvestment : data.ui.purposeSelfuse],
                [data.ui.homeCount, data.inputs.homeCount === "first" ? data.ui.first : data.ui.additional],
                [data.ui.residency, data.inputs.residency === "resident" ? data.ui.resident : data.ui.nonResident],
                [data.ui.websiteLabel, data.meta.website],
              ].map(([label, value], index, arr) => (
                <View key={label} style={rowStyle(index, arr.length)}>
                  <Text style={styles.keyLabel}>{label}</Text>
                  <Text style={styles.keyValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.ui.assumptions}</Text>
          <View style={styles.miniGrid}>
            <View style={styles.miniCell}>
              <Text style={styles.miniLabel}>{data.ui.price}</Text>
              <Text style={styles.miniValue}>{currency} {data.inputs.price.toLocaleString()}</Text>
            </View>
            <View style={styles.miniCell}>
              <Text style={styles.miniLabel}>{data.ui.monthlyRent}</Text>
              <Text style={styles.miniValue}>{currency} {data.inputs.monthlyRent.toLocaleString()}</Text>
            </View>
            <View style={styles.miniCell}>
              <Text style={styles.miniLabel}>{data.ui.mortgagePct}</Text>
              <Text style={styles.miniValue}>{data.inputs.mortgagePct}%</Text>
            </View>
            <View style={styles.miniCell}>
              <Text style={styles.miniLabel}>{data.ui.aprPct}</Text>
              <Text style={styles.miniValue}>{data.inputs.aprPct}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.ui.breakdown}</Text>
          <View style={styles.twoCol}>
            <View style={styles.panel}>
              {[
                [data.ui.stampDuty, `${currency} ${data.results.fmt.stampDuty}`],
                [data.ui.govFees, `${currency} ${data.results.fmt.govSolicitorFeesEst}`],
                [data.ui.otherOneOffCosts, `${currency} ${data.results.fmt.otherOneOffCosts}`],
                [data.ui.upfrontCosts, `${currency} ${data.results.fmt.upfrontCosts}`],
              ].map(([label, value], index, arr) => (
                <View key={label} style={rowStyle(index, arr.length)}>
                  <Text style={styles.keyLabel}>{label}</Text>
                  <Text style={styles.keyValue}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              {isInvestment
                ? [
                    [data.ui.grossAnnualRent, `${currency} ${data.results.fmt.grossAnnualRent}`],
                    [data.ui.agentFeeAnnual, `${currency} ${data.results.fmt.agentFeeAnnual}`],
                    [data.ui.holdingAnnual, `${currency} ${data.results.fmt.holdingAnnual}`],
                    [data.ui.interestAnnual, `${currency} ${data.results.fmt.interestAnnual}`],
                    [data.ui.netAnnualRent, `${currency} ${data.results.fmt.netAnnualRent}`],
                  ].map(([label, value], index, arr) => (
                    <View key={label} style={rowStyle(index, arr.length)}>
                      <Text style={styles.keyLabel}>{label}</Text>
                      <Text style={styles.keyValue}>{value}</Text>
                    </View>
                  ))
                : [
                    [data.ui.councilTax, `${currency} ${data.results.fmt.councilTaxEst}`],
                    [data.ui.utilities, `${currency} ${data.results.fmt.utilitiesEst}`],
                    [data.ui.holdingAnnual, `${currency} ${data.results.fmt.holdingAnnual}`],
                    [data.ui.propertyFeeSelf, `${currency} ${data.results.fmt.propertyFeeSelf}`],
                    [data.ui.annualFixed, `${currency} ${data.results.fmt.annualFixedOutgoings}`],
                  ].map(([label, value], index, arr) => (
                    <View key={label} style={rowStyle(index, arr.length)}>
                      <Text style={styles.keyLabel}>{label}</Text>
                      <Text style={styles.keyValue}>{value}</Text>
                    </View>
                  ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.ui.paymentPlan}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cell}>Stage</Text>
              <Text style={styles.cell}>Amount</Text>
            </View>
            {data.results.paymentPlan.map((item, index) => (
              <View
                key={item.label}
                style={
                  index === data.results.paymentPlan.length - 1
                    ? [styles.tableRow, { borderBottom: "none" }]
                    : styles.tableRow
                }
              >
                <Text style={styles.cell}>{item.label}</Text>
                <Text style={styles.cell}>{currency} {item.value.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.ui.nextSteps}</Text>
          {data.ui.nextStepsItems.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>{data.ui.disclaimer}</Text>
      </Page>
    </Document>
  );
}
