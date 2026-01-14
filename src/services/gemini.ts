import { GoogleGenAI } from "@google/genai";

// Tenta pegar a chave de forma segura. Se não tiver, fica vazio.
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Função auxiliar para inicializar a IA apenas quando for usada
const getAIClient = () => {
  if (!apiKey) {
    console.warn("Atenção: Chave da API do Google (VITE_GOOGLE_API_KEY) não encontrada.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getStyleAssistantResponse = async (userMessage: string) => {
  const ai = getAIClient();
  
  // Se não tiver IA configurada, responde o básico para não travar
  if (!ai) return "O assistente está em manutenção no momento (Falta API Key).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Atualizei para um modelo mais estável se disponível, ou use o gemini-1.5-flash
      contents: userMessage,
      config: {
        systemInstruction: "Você é o assistente virtual da Man's Space - Barber Street. Seja educado, use um tom profissional e moderno. Ajude clientes com cortes e barbas. Preços: Corte R$40, Barba R$40. Local: Vale do Jatobá, BH.",
      },
    });
    return response.text() || "Não consegui formular uma resposta.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico momentâneo.";
  }
};

export const generateWhatsAppMessage = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  barber: string;
  services: string[];
  products: string[];
  date: string;
  time: string;
  total: number;
}) => {
  const ai = getAIClient();

  // Fallback (Plano B) se a IA não estiver ativa
  const fallbackMessage = `Olá Man's Space! Gostaria de agendar um horário.\n\n*Cliente:* ${data.firstName} ${data.lastName}\n*Serviços:* ${data.services.join(', ')}\n*Data:* ${data.date} às ${data.time}\n*Barbeiro:* ${data.barber}`;

  if (!ai) return fallbackMessage;

  const prompt = `Gere uma mensagem curta, elegante e formatada para WhatsApp solicitando agendamento.
  Dados: ${data.firstName} ${data.lastName}, Tel: ${data.phone}.
  Barbeiro: ${data.barber}. Serviços: ${data.services.join(', ')}.
  Data: ${data.date} às ${data.time}. Total: R$ ${data.total.toFixed(2)}.
  Seja cordial, use emojis (💈, ✂️) e liste os itens.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.7 },
    });
    return response.text() || fallbackMessage;
  } catch (error) {
    console.error("Gemini Booking Message Error:", error);
    return fallbackMessage;
  }
};
