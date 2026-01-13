
import React, { useState, useEffect } from 'react';
import { SERVICES, TEAM } from '../constants';
import { Service, Barber, SelectedProduct } from '../types';
import { generateWhatsAppMessage } from '../services/gemini';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServices?: Service[];
  initialProducts?: SelectedProduct[];
  onClearSelection?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  initialServices = [], 
  initialProducts = [],
  onClearSelection
}) => {
  const [step, setStep] = useState(1); // 1: Contato, 2: Itens, 3: Barbeiro, 4: Agenda, 5: IA Message
  
  // Form Contato
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [selectedServices, setSelectedServices] = useState<Service[]>(initialServices);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(initialProducts);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const [aiMessage, setAiMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setSelectedServices(initialServices);
      setSelectedProducts(initialProducts);
      if (initialServices.length > 0 || initialProducts.length > 0) {
        // Se já vem com itens, podemos ir direto ou pedir contato
        setStep(1);
      }
    }
  }, [isOpen, initialServices, initialProducts]);

  if (!isOpen) return null;

  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0) + 
                     selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    setStep(5);
    const message = await generateWhatsAppMessage({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      barber: selectedBarber?.name || 'Qualquer profissional',
      services: selectedServices.map(s => s.name),
      products: selectedProducts.map(p => `${p.quantity}x ${p.name}`),
      date,
      time,
      total: totalPrice
    });
    setAiMessage(message || '');
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiMessage);
    alert('Mensagem copiada!');
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(aiMessage);
    window.open(`https://wa.me/5531992820181?text=${encoded}`, '_blank');
  };

  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();
    today.setHours(0,0,0,0);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const monthName = currentCalendarDate.toLocaleString('pt-br', { month: 'long' });

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8" />);
    for (let d = 1; d <= totalDays; d++) {
      const currentDayDate = new Date(year, month, d);
      const isPast = currentDayDate < today;
      const dateString = `${String(d).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      const isSelected = date === dateString;

      days.push(
        <button 
          key={d} 
          disabled={isPast} 
          onClick={() => setDate(dateString)} 
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${isPast ? 'text-gray-200 cursor-not-allowed' : isSelected ? 'bg-black text-white scale-110 shadow-lg' : 'hover:bg-gray-100 text-black'}`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))} className="p-1 font-black hover:bg-gray-100 rounded">←</button>
          <h4 className="text-[10px] font-black uppercase text-black italic">{monthName} {year}</h4>
          <button onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))} className="p-1 font-black hover:bg-gray-100 rounded">→</button>
        </div>
        <div className="grid grid-cols-7 text-center mb-2 text-[8px] font-black text-gray-300">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white w-full max-w-sm rounded-[3rem] border border-gray-100 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]`}>
        <div className="p-6 md:p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-black tracking-tight uppercase italic leading-none">Agendamento IA</h2>
            <button onClick={onClose} className="text-gray-300 hover:text-black text-3xl font-light">&times;</button>
          </div>

          <div className="flex justify-between mb-8 gap-2">
            {[1, 2, 3, 4, 5].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-black' : 'bg-gray-100'}`} />)}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Informações de Contato</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" placeholder="Nome" 
                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="col-span-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black" 
                  />
                  <input 
                    type="text" placeholder="Sobrenome" 
                    value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="col-span-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black" 
                  />
                  <input 
                    type="tel" placeholder="Celular (WhatsApp)" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black" 
                  />
                  <input 
                    type="email" placeholder="E-mail" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black" 
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Serviços e Adicionais</h3>
                <div className="space-y-2">
                  {SERVICES.slice(0, 8).map(s => {
                    const isSelected = selectedServices.some(item => item.id === s.id);
                    return (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedServices(prev => isSelected ? prev.filter(x => x.id !== s.id) : [...prev, s])}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex justify-between items-center ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}
                      >
                        <span className="font-black uppercase text-[10px]">{s.name}</span>
                        <span className="text-blue-600 font-black text-[10px]">R$ {s.price.toFixed(0)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Escolha seu Barbeiro</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM.map(b => (
                    <button 
                      key={b.id} onClick={() => setSelectedBarber(b)}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${selectedBarber?.id === b.id ? 'border-black bg-gray-50 scale-105' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-gray-100 flex items-center justify-center font-black">
                        {b.image ? <img src={b.image} alt={b.name} className="w-full h-full object-cover" /> : b.initials}
                      </div>
                      <span className="text-[9px] font-black uppercase text-center leading-tight">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data e Horário</h3>
                {renderCalendar()}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                    <button 
                      key={t} onClick={() => setTime(t)}
                      className={`py-2 rounded-lg text-[9px] font-black border transition-all ${time === t ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">A Inteligência Artificial está preparando sua mensagem...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 text-left relative group">
                      <div className="absolute top-4 right-4 text-[8px] font-black text-blue-600 uppercase tracking-widest opacity-40">AI Generated</div>
                      <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap italic leading-relaxed">
                        {aiMessage}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        Enviar pelo WhatsApp ➔
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="w-full bg-black text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-gray-800 transition-all"
                      >
                        Copiar Texto
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {step < 5 && (
            <div className="pt-6 border-t border-gray-100 mt-auto flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="px-6 py-4 rounded-2xl border-2 border-gray-100 font-black text-[10px] uppercase text-gray-400 hover:text-black hover:border-black transition-all">
                  ←
                </button>
              )}
              <button 
                disabled={
                  (step === 1 && (!formData.firstName || !formData.phone)) ||
                  (step === 2 && selectedServices.length === 0) ||
                  (step === 3 && !selectedBarber) ||
                  (step === 4 && (!date || !time))
                }
                onClick={() => step === 4 ? handleGenerateMessage() : setStep(step + 1)}
                className="flex-1 bg-black text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 transition-all"
              >
                {step === 4 ? 'GERAR MENSAGEM IA' : 'PRÓXIMO ➔'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
