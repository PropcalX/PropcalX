import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateProReportPdf } from '../../pdf/renderPdf';
import type { ProReportProps } from '../../pdf/ProReport';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
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

    // 校验核心数据
    if (!payload.ui || !payload.results || !payload.meta) {
      return NextResponse.json(
        { success: false, error: 'PDF 生成所需的核心数据缺失' },
        { status: 400 }
      );
    }

    // 生成 PDF（用 ProReportProps['data'] 约束类型）
    const pdfResult = await generateProReportPdf(payload as ProReportProps['data']);
    if (!pdfResult.success) {
      return NextResponse.json(
        { success: false, error: pdfResult.error },
        { status: 500 }
      );
    }

    // 发送邮件（修复 contentType 字段）
    const response = await resend.emails.send({
      from: 'MyGPC <report@mygpc.co>',
      to: [email],
      subject: payload.lang === 'zh' ? 'MyGPC 房产投资专业报告' : 'MyGPC Property Investment Pro Report',
      html: payload.lang === 'zh' ? '<p>您好，您的 MyGPC 房产投资报告已生成，详见附件。</p>' : '<p>Your MyGPC property investment report has been generated, please check the attachment.</p>',
      attachments: [
        {
          filename: payload.lang === 'zh' ? 'MyGPC_房产投资报告.pdf' : 'MyGPC_Investment_Report.pdf',
          content: pdfResult.pdfBuffer,
          contentType: 'application/pdf', // 正确字段
        },
      ],
    });

    return NextResponse.json({ 
      success: true, 
      message: payload.lang === 'zh' ? 'PDF 已发送至您的邮箱' : 'PDF has been sent to your email',
      response 
    });

  } catch (error) {
    console.error('邮件发送失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误',
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