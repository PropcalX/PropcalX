import { renderToBuffer } from '@react-pdf/renderer';
import React, { ReactElement } from 'react';
import ProReport from './ProReport';
import type { ProReportProps } from './ProReport';

export async function generateProReportPdf(data: ProReportProps['data']) {
  try {
    // 解决方法：显式创建一个元素，并确保 ProReport 内部使用了 <Document>
    // 如果 ProReport 内部没有 <Document>，请看下方的 ProReport 修改建议
    const pdfComponent = React.createElement(ProReport, { data }) as ReactElement;
    
    const pdfBuffer = await renderToBuffer(pdfComponent as any);
    
    return { success: true, pdfBuffer } as const;
  } catch (error) {
    console.error('PDF 生成失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 生成未知错误' 
    } as const;
  }
}