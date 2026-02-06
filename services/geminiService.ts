
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyConfig, Questionnaire, QuestionType } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateSurvey = async (config: SurveyConfig): Promise<Questionnaire> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    请作为一个专业的市场调研专家，根据以下信息生成一份高质量的中文调研问卷：
    - 调研目的：${config.purpose}
    - 调研对象：${config.targetAudience}
    - 题目数量：${config.questionCount}
    
    要求：
    1. 题目应当科学合理，覆盖人口统计学特征（如适用）及核心研究目的。
    2. 题型多样化，包括单选题、多选题、开放题和评分题。
    3. 输出内容必须是合法的 JSON 格式。
    4. 确保语言专业、亲切。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "问卷标题" },
          description: { type: Type.STRING, description: "问卷卷首语/说明" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING, description: "问题内容" },
                type: { 
                  type: Type.STRING, 
                  enum: [QuestionType.SINGLE_CHOICE, QuestionType.MULTI_CHOICE, QuestionType.OPEN_ENDED, QuestionType.RATING],
                  description: "题型"
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "如果是选择题，提供选项列表"
                }
              },
              required: ["id", "text", "type"]
            }
          }
        },
        required: ["title", "description", "questions"]
      }
    }
  });

  if (!response.text) {
    throw new Error("AI 未生成有效内容");
  }

  return JSON.parse(response.text.trim()) as Questionnaire;
};
