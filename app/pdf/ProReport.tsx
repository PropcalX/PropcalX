import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// 🔥 完整的类型定义（TS 文件中合法）
export type ProReportProps = {
  data: {
    lang: 'zh' | 'en';
    purpose: 'investment' | 'self';
    currency: string;
    ui: Record<string, string>;
    results: {
      fmt: Record<string, string | number>;
      breakdown?: Array<{ name: string; value: string }>;
    };
    meta: {
      countryLabel: string;
      createdAt: string;
      website: string;
    };
    email?: string;
    // 新增字段的类型定义（解决 Vercel 报错）
    createdAtISO: string;
    brand: {
      name: string;
      website: string;
    };
  };
};

// 字体注册
const fontPath = path.join(process.cwd(), 'public/fonts/');

Font.register({
  family: 'MyGPCFont',
  fonts: [
    {
      src: `${fontPath}NotoSansSC-Regular.ttf`,
      fontWeight: 'normal',
      fontStyle: 'normal',
      unicodeRange: 'U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF' as any,
    },
    {
      src: `${fontPath}NotoSans-Variable.ttf`,
      fontWeight: 'normal',
      fontStyle: 'normal',
      unicodeRange: 'U+0000-007F' as any,
    },
  ] as any,
});

Font.register({
  family: 'MyGPCFont',
  fonts: [
    {
      src: `${fontPath}NotoSansSC-Regular.ttf`,
      fontWeight: 'bold',
      fontStyle: 'normal',
      unicodeRange: 'U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF' as any,
    },
    {
      src: `${fontPath}NotoSans-Variable.ttf`,
      fontWeight: 'bold',
      fontStyle: 'normal',
      unicodeRange: 'U+0000-007F' as any,
    },
  ] as any,
});

// 样式定义
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'MyGPCFont' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottom: '1px solid #e0e0e0' },
  brand: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
  brandGold: { color: '#d7c28a' },
  meta: { fontSize: 10, color: '#7b7b7b', textAlign: 'right' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 20 },
  subtitle: { fontSize: 14, fontWeight: 'bold', color: '#d7c28a', marginBottom: 15 },
  card: { backgroundColor: '#121212', borderRadius: 10, padding: 15, marginBottom: 15 },
  cardTitle: { fontSize: 10, color: '#d7c28a', marginBottom: 8 },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  cardSubtitle: { fontSize: 9, color: '#9a9a9a', marginTop: 5 },
  row: { display: 'flex', justifyContent: 'space-between', paddingVertical: 6, borderBottom: '1px solid #242424' },
  rowLast: { borderBottom: 'none' },
  rowLabel: { fontSize: 11, color: '#cfcfcf' },
  rowValue: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  grid3: { display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  grid2: { display: 'flex', justifyContent: 'space-between', gap: 15, marginBottom: 20 },
  gridItem: { flex: 1 },
  hint: { fontSize: 9, color: '#7b7b7b', marginTop: 10 },
  disclaimer: { fontSize: 8, color: '#7b7b7b', marginTop: 20, textAlign: 'center' },
});

// 组件定义（匹配类型）
const ProReport = ({ data }: ProReportProps) => {
  const { lang, purpose, currency, ui, results, meta, brand } = data;
  const isInvestment = purpose === 'investment';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            {brand.name} <Text style={styles.brandGold}>Pro Report</Text>
          </Text>
          <View>
            <Text style={styles.meta}>{meta.countryLabel} · {currency}</Text>
            <Text style={styles.meta}>{new Date(data.createdAtISO).toLocaleString()}</Text>
            <Text style={styles.meta}>{brand.website}</Text>
          </View>
        </View>

        <Text style={styles.title}>{isInvestment ? ui.invTitle : ui.selfTitle}</Text>

        {isInvestment && (
          <View style={styles.grid3}>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.netYield}</Text>
              <Text style={styles.cardValue}>{results.fmt.netYieldPct}</Text>
            </View>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.netAnnualRent}</Text>
              <Text style={styles.cardValue}>{currency} {results.fmt.netAnnualRent}</Text>
            </View>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.upfrontCosts}</Text>
              <Text style={styles.cardValue}>{currency} {results.fmt.upfrontCosts}</Text>
            </View>
          </View>
        )}

        {!isInvestment && (
          <View style={styles.grid3}>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.annualFixed}</Text>
              <Text style={styles.cardValue}>{currency} {results.fmt.annualFixedOutgoings}</Text>
              <Text style={styles.cardSubtitle}>{ui.annualFixedHint}</Text>
            </View>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.perMonth}</Text>
              <Text style={styles.cardValue}>{currency} {results.fmt.monthlyFixedOutgoings}</Text>
            </View>
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.cardTitle}>{ui.firstYear}</Text>
              <Text style={styles.cardValue}>{currency} {results.fmt.firstYearTotalOutgoings}</Text>
            </View>
          </View>
        )}

        <View style={styles.grid2}>
          <View style={[styles.gridItem, styles.card]}>
            <Text style={styles.subtitle}>{ui.breakdown}</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{ui.stampDuty}</Text>
              <Text style={styles.rowValue}>{currency} {results.fmt.stampDuty}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{ui.govFees}</Text>
              <Text style={styles.rowValue}>{currency} {results.fmt.govSolicitorFeesEst}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{ui.otherOneOffCosts}</Text>
              <Text style={styles.rowValue}>{currency} {results.fmt.otherOneOffCosts}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>{ui.upfrontCosts}</Text>
              <Text style={styles.rowValue}>{currency} {results.fmt.upfrontCosts}</Text>
            </View>
            <Text style={styles.hint}>{ui.noteGov}</Text>
          </View>

          {isInvestment ? (
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.subtitle}>{ui.annualCashflow}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.grossAnnualRent}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.grossAnnualRent}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.agentFeeAnnual}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.agentFeeAnnual}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.holdingAnnual}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.holdingAnnual}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.interestAnnual}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.interestAnnual}</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{ui.netAnnualRent}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.netAnnualRent}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.gridItem, styles.card]}>
              <Text style={styles.subtitle}>{ui.annualFixed}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.councilTax}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.councilTaxEst}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.utilities}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.utilitiesEst}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.holdingAnnual}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.holdingAnnual}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{ui.propertyFeeSelf}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.propertyFeeSelf}</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{ui.annualFixed}</Text>
                <Text style={styles.rowValue}>{currency} {results.fmt.annualFixedOutgoings}</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>{ui.disclaimer}</Text>
      </Page>
    </Document>
  );
};

export default ProReport;