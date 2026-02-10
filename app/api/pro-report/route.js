import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateProReportPdf } from '../../pdf/renderPdf.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const payload = await req.json();
    const { email } = payload;

    // 校验邮箱
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '请提供有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 🔥 核心修复：补充缺失字段的默认值，兼容前端传参不完整
    const safePayload = {
      // 基础字段默认值
      lang: payload.lang || 'zh',
      purpose: payload.purpose || 'investment',
      currency: payload.currency || '¥',
      email,
      // 补充 price 字段（解决 "expected number" 报错）
      price: typeof payload.price === 'number' ? payload.price : 0,
      // 补充 results 字段（解决 breakdown 数组报错）
      results: {
        fmt: payload.results?.fmt || {
          netYieldPct: '0%',
          netAnnualRent: '0',
          upfrontCosts: '0',
          stampDuty: '0',
          govSolicitorFeesEst: '0',
          otherOneOffCosts: '0',
          grossAnnualRent: '0',
          agentFeeAnnual: '0',
          holdingAnnual: '0',
          interestAnnual: '0',
          annualFixedOutgoings: '0',
          monthlyFixedOutgoings: '0',
          firstYearTotalOutgoings: '0',
          councilTaxEst: '0',
          utilitiesEst: '0',
          propertyFeeSelf: '0',
        },
        breakdown: Array.isArray(payload.results?.breakdown) ? payload.results.breakdown : [], // 补充数组默认值
      },
      // 补充 ui 多语言文案默认值
      ui: payload.ui || {
        invTitle: '房产投资分析报告',
        selfTitle: '自住成本分析报告',
        netYield: '净收益率',
        netAnnualRent: '年净租金',
        upfrontCosts: '前期总成本',
        breakdown: '成本明细',
        stampDuty: '印花税',
        govFees: '政府/律师费用',
        otherOneOffCosts: '其他一次性成本',
        noteGov: '费用仅供参考，以政府实际收取为准',
        annualCashflow: '年度现金流',
        grossAnnualRent: '年总租金',
        agentFeeAnnual: '中介年费',
        holdingAnnual: '持有成本（年）',
        interestAnnual: '贷款利息（年）',
        annualFixed: '年度固定支出',
        perMonth: '每月固定支出',
        firstYear: '首年总支出',
        councilTax: '市政税',
        utilities: '水电燃气费',
        propertyFeeSelf: '物业费（自住）',
        disclaimer: '本报告仅供参考，不构成投资建议',
      },
      // 补充 meta 元数据默认值
      meta: payload.meta || {
        countryLabel: '中国',
        createdAt: new Date().toLocaleString(),
        website: 'https://mygpc.co',
      },
    };

    // 生成 PDF（使用兼容后的 safePayload）
    const pdfResult = await generateProReportPdf(safePayload);
    if (!pdfResult.success) {
      return NextResponse.json(
        { success: false, error: pdfResult.error },
        { status: 500 }
      );
    }

    // 发送邮件
    const response = await resend.emails.send({
      from: 'MyGPC <report@mygpc.co>', // 确保该邮箱已在 Resend 验证
      to: [email],
      subject: safePayload.lang === 'zh' ? 'MyGPC 房产投资专业报告' : 'MyGPC Property Investment Pro Report',
      html: safePayload.lang === 'zh' ? '<p>您好，您的 MyGPC 房产投资报告已生成，详见附件。</p>' : '<p>Your MyGPC property investment report has been generated, please check the attachment.</p>',
      attachments: [
        {
          filename: safePayload.lang === 'zh' ? 'MyGPC_房产投资报告.pdf' : 'MyGPC_Investment_Report.pdf',
          content: pdfResult.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ 
      success: true, 
      message: safePayload.lang === 'zh' ? 'PDF 已发送至您的邮箱' : 'PDF has been sent to your email',
      response 
    });

  } catch (error) {
    console.error('邮件发送失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '未知错误',
        message: 'PDF 生成或邮件发送失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: true, 
      message: 'MyGPC Pro Report API 已就绪',
      note: '请使用 POST 请求提交数据生成并发送 PDF'
    },
    { status: 200 }
  );
}