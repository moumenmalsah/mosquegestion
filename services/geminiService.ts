import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinances = async (transactions: Transaction[], currentMonthName: string) => {
  // Prepare a summary of data to send to Gemini to avoid token limits with huge lists
  const incomeTotal = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseTotal = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categories: Record<string, number> = {};
  transactions.forEach(t => {
    const key = `${t.type}: ${t.category}`;
    categories[key] = (categories[key] || 0) + t.amount;
  });

  const prompt = `
    أنت مساعد خبير في الإدارة المالية لمسجد.
    إليك ملخص المعاملات للفترة الحالية (${currentMonthName}):
    
    إجمالي المداخيل (الشرط، التبرعات، إلخ): ${incomeTotal}
    إجمالي المصاريف: ${expenseTotal}
    الرصيد المتبقي: ${incomeTotal - expenseTotal}
    
    تفاصيل حسب الفئة:
    ${JSON.stringify(categories, null, 2)}
    
    قم بتحليل هذا الوضع المالي.
    1. قدم ملخصًا عن الصحة المالية للمسجد.
    2. إذا كانت النفقات مرتفعة في فئة معينة، قدم نصائح للتوفير.
    3. قدم اقتراحات لتحسين جمع "الشرط" إذا لزم الأمر.
    4. أجب باللغة العربية بأسلوب محترم ومهني.
    كن موجزًا (بحد أقصى 200 كلمة).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep reasoning for this summary
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، التحليل الذكي غير متاح حالياً. يرجى التحقق من مفتاح API.";
  }
};