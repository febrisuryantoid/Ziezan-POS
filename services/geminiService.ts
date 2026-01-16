import { GoogleGenAI } from "@google/genai";
import { Transaction, AppSettings } from '../types';

export const getBusinessInsights = async (
  transactions: Transaction[], 
  settings: AppSettings
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. Unable to fetch AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare data summary
  const totalRevenue = transactions.reduce((acc, t) => acc + t.cost, 0);
  const totalHours = transactions.reduce((acc, t) => acc + t.durationHours, 0);
  const activeMembers = new Set(transactions.map(t => t.memberId)).size;
  
  const prompt = `
    You are a business consultant for a small Playstation Rental business called "Ziezan Station".
    Here is the recent performance data:
    - Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
    - Total Hours Rented: ${totalHours}
    - Unique Active Members: ${activeMembers}
    - Current Hourly Rate: Rp ${settings.hourlyRate}
    
    Please provide 3 short, actionable bullet points to improve business or operational efficiency. 
    Keep it encouraging and professional.
    Response MUST be in Indonesian.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Tidak ada saran saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, asisten AI sedang sibuk. Coba lagi nanti.";
  }
};