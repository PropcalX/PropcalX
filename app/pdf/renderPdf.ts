import { renderToBuffer } from '@react-pdf/renderer';
import ProReport from './ProReport';
import type { ProReportProps } from './ProReport';

export async function generateProReportPdf(data: ProReportProps['data']) {
  try {
    const pdfComponent = <ProReport data={data} />;
    const pdfBuffer = await renderToBuffer(pdfComponent);
    
    return { success: true, pdfBuffer } as const;
  } catch (error) {
    console.error('PDF 生成失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 生成未知错误' 
    } as const;
  }
}