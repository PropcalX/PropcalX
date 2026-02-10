import { renderToBuffer } from '@react-pdf/renderer';
import ProReport from './ProReport.jsx';

// 纯 JS 函数，无 TS 类型约束
export async function generateProReportPdf(data) {
  try {
    // JSX 在这里会被正确解析（因为是 .js 文件，TS 不校验）
    const pdfComponent = <ProReport data={data} />;
    const pdfBuffer = await renderToBuffer(pdfComponent);
    
    return { success: true, pdfBuffer };
  } catch (error) {
    console.error('PDF 生成失败:', error);
    return { 
      success: false, 
      error: error.message || 'PDF 生成未知错误' 
    };
  }
}