import { renderToBuffer } from '@react-pdf/renderer';
// 🔴 关键：仅导入组件（值）和类型，不混用
import ProReport from './ProReport';
import type { ProReportProps } from './ProReport';

// 🔴 关键：用 ProReportProps['data'] 约束入参，而非组件本身
export async function generateProReportPdf(data: ProReportProps['data']) {
  try {
    // 渲染组件：仅作为值使用，不涉及类型
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