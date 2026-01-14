import { GoogleGenAI } from "@google/genai";

// Função segura para pegar a IA apenas quando necessário
const getAI = () => {
  // Tenta pegar a chave do Vite
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  // Se não tiver chave, retorna null (não tenta criar e não dá erro)
  if (!apiKey) return null;
  
  // Se tiver chave, cria a instância
  return new GoogleGenAI({ apiKey });
};

export const getStyleAssistantResponse = async (userMessage: string) => {
  try {
    const ai = getAI();
    // Se não tiver IA configurada, responde o básico para não travar
    if (!ai) return "Sistema de IA temporariamente indisponível (Chave não configurada).";

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: "Você é o assistente virtual da Man's Space...",
      },
    });
    return response.text() || "Sem resposta.";
  } catch (error) {
    console.error("Erro IA:", error);
    return "Desculpe, não consegui responder agora.";
  }
};

export const generateWhatsAppMessage = async (data: any) => {
  try {
    const ai = getAI();
    
    // MENSAGEM PADRÃO (FALLBACK) - Caso a IA falhe ou não tenha chave
    const fallbackMsg = `Olá Man's Space! Gostaria de agendar.\n\n*Cliente:* ${data.firstName} ${data.lastName}\n*Serviços:* ${data.services.join(', ')}\n*Data:* ${data.date} às ${data.time}\n*Barbeiro:* ${data.barber}`;

    if (!ai) return fallbackMsg;

    const prompt = `Gere mensagem de WhatsApp para agendamento de barbearia.
    Cliente: ${data.firstName}, Data: ${data.date} às ${data.time}.
    Serviços: ${data.services.join(', ')}. Barbeiro: ${data.barber}.
    Seja curto e cordial.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    return response.text() || fallbackMsg;
  } catch (error) {
    console.error("Erro IA:", error);
    // Em c
