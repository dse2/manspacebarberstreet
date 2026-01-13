
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStyleAssistantResponse = async (userMessage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: "Você é o assistente virtual da Man's Space - Barber Street. Seja educado, use um tom profissional e moderno (estilo barbearia premium). Ajude os clientes a escolherem cortes e barbas. Se perguntarem sobre preços, cite Corte R$40 e Barba R$40. Localização: Vale do Jatobá, BH.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico. Como posso ajudar hoje?";
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
  const prompt = `Gere uma mensagem elegante e organizada para WhatsApp solicitando um agendamento na barbearia Man's Space.
  Dados do Cliente: ${data.firstName} ${data.lastName}
  Contato: ${data.phone} | ${data.email}
  Barbeiro: ${data.barber}
  Serviços: ${data.services.join(', ')}
  Produtos Adicionais: ${data.products.length > 0 ? data.products.join(', ') : 'Nenhum'}
  Data: ${data.date} às ${data.time}
  Valor Estimado: R$ ${data.total.toFixed(2)}
  
  Instruções: Use emojis de barbearia (💈, ✂️, 🪒), seja muito profissional e cordial. A mensagem deve ser escrita do ponto de vista do cliente para a barbearia. Organize os itens em lista.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Booking Message Error:", error);
    return `Olá Man's Space! Gostaria de agendar um horário.\n\nCliente: ${data.firstName}\nServiço: ${data.services.join(', ')}\nData: ${data.date} às ${data.time}\nBarbeiro: ${data.barber}`;
  }
};
