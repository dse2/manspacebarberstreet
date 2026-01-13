
import React, { useState, useEffect, useMemo } from 'react';
import { SERVICES, TEAM, PRODUCTS } from './constants';
import { Barber, Service, Product, SelectedProduct } from './types';
import { AssistantChat } from './components/AssistantChat';
import { BookingModal } from './components/BookingModal';
import { ProfessionalModal } from './components/ProfessionalModal';
import { ProductModal } from './components/ProductModal';
import { db, UserReview } from './services/db';

const DEFAULT_REVIEWS = [
  { name: "Luiz", comment: "Muito bom", stars: 5 },
  { name: "Bernardo", comment: "Ótimo atendimento e serviço prestado estão de parabéns.", stars: 5 },
  { name: "Hugo", comment: "Ótimo atendimento", stars: 5 },
  { name: "Alexandre", comment: "Excelente barbearia! Ambiente moderno, atendimento impecável, barbeiros muito profissionais e serviços de altíssima qualidade. Experiência 5 estrelas do início ao fim", stars: 5 }
];

// Combinação de todas as fotos: as 6 originais + as 7 novas
const ALL_GALLERY_IMAGES = [
  "https://lh3.googleusercontent.com/p/AF1QipPY8cZE_jI0vCbsdMPJ_Lu5wq_YwDdSgXT5XsDK=s680-w680-h510-rw",
  "https://lh3.googleusercontent.com/p/AF1QipMsfThVDthWGc0Tfa1WLWXA1HxOcnj2EL-k1DkH=s680-w680-h510-rw",
  "https://lh3.googleusercontent.com/p/AF1QipOD4xcQ1PjR6eUHdQy5XGucWbTpqLWbWydmuXmK=s680-w680-h510-rw",
  "https://lh3.googleusercontent.com/p/AF1QipN2xQDMG4ZZuea-tyCwdi1NIBBoQ8Ypwxzn1loj=s680-w680-h510-rw",
  "https://lh3.googleusercontent.com/p/AF1QipM1VAuSRyDV2Dv80JqSocFO3Seya7uF30ZYdHHD=s680-w680-h510-rw",
  "https://lh3.googleusercontent.com/p/AF1QipPH1qJ0UF3KI3Reuwq75ayjUmW4wTEROoBy8ows=s680-w680-h510-rw",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253375881",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253394881",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253407335",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253428147",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253459614",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768253473183",
  "https://img-appbarber-appbeleza.s3.amazonaws.com/manspacebarbers-7umn%2Festablishment-images%2F1768257169089"
];

const App: React.FC = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Barber | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [activeServiceTab, setActiveServiceTab] = useState<'all' | 'corte' | 'barba' | 'estetica'>('all');
  const [productFilterMode, setProductFilterMode] = useState<'all' | 'brand' | 'category'>('all');
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Product['category'] | 'all'>('all');
  
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'cursos' | 'sobre' | 'trabalhe'>('main');

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const loadReviews = async () => {
      const stored = await db.getReviews();
      setUserReviews(stored);
    };
    loadReviews();
  }, []);

  const allReviews = useMemo(() => {
    return [...userReviews, ...DEFAULT_REVIEWS];
  }, [userReviews]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % ALL_GALLERY_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [ALL_GALLERY_IMAGES.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (allReviews.length <= 1) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % allReviews.length);
        setIsTransitioning(false);
      }, 600);
    }, 5000);
    return () => clearInterval(timer);
  }, [allReviews.length]);

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) return;

    const newReview = await db.createReview({
      name: "Visitante",
      comment: reviewComment,
      stars: reviewRating,
    });

    setUserReviews(prev => [newReview, ...prev]);
    setIsReviewModalOpen(false);
    setReviewComment('');
    setReviewRating(5);
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      return isSelected ? prev.filter(s => s.id !== service.id) : [...prev, service];
    });
  };

  const updateProductQuantity = (product: Product, delta: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(p => p.id !== product.id);
        return prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
      } else if (delta > 0) {
        return [...prev, { ...product, quantity: delta }];
      }
      return prev;
    });
  };

  const handleAddFromModal = (product: Product, quantity: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const uniqueBrands = useMemo(() => Array.from(new Set(PRODUCTS.map(p => p.brand).filter(Boolean))).sort() as string[], []);
  const uniqueCategories = useMemo(() => Array.from(new Set(PRODUCTS.map(p => p.category))).sort() as Product['category'][], []);

  const filteredServices = useMemo(() => {
    return activeServiceTab === 'all' 
      ? SERVICES 
      : SERVICES.filter(s => s.category === activeServiceTab || (activeServiceTab === 'estetica' && s.category === 'quimica'));
  }, [activeServiceTab]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (productFilterMode === 'all') return true;
      if (productFilterMode === 'brand') return !activeBrand || p.brand === activeBrand;
      if (productFilterMode === 'category') return activeCategory === 'all' || p.category === activeCategory;
      return true;
    });
  }, [productFilterMode, activeBrand, activeCategory]);

  const totalItemsCount = selectedServices.length + selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0) + 
                     selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const navigateTo = (view: 'main' | 'cursos' | 'sobre' | 'trabalhe', sectionId?: string) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    if (view === 'main' && sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const TitleDecorator = () => (
    <div className="inline-flex h-3 w-8 -skew-x-[25deg] overflow-hidden rounded-sm mx-3 align-middle">
      <div className="h-full w-1/2 bg-blue-600" />
      <div className="h-full w-1/2 bg-red-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black pb-24 md:pb-20">
      <header className="sticky top-0 z-40 bg-black border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-5 cursor-pointer" onClick={() => navigateTo('main')}>
            <img src="https://i.postimg.cc/XYvTyFcM/logo-png.jpg" alt="Logo" className="h-10 md:h-14 w-auto rounded-xl" />
            <div className="flex flex-col">
              <span className="text-white text-lg md:text-2xl font-black italic tracking-tighter uppercase leading-none">MAN'S SPACE</span>
              <span className="text-gray-500 text-[8px] md:text-[9px] font-bold tracking-[0.4em] uppercase mt-1">Barber Street</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsBookingOpen(true)} className="hidden md:flex bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-full font-black text-[10px] transition-all uppercase tracking-widest items-center gap-2">
              Agendar {totalItemsCount > 0 && <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">{totalItemsCount}</span>}
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="text-white flex flex-col gap-1.5 p-2 group">
              <div className="w-8 h-1 bg-white rounded-full"></div>
              <div className="w-8 h-1 bg-white rounded-full"></div>
              <div className="w-8 h-1 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Sidebar */}
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-[110] transition-transform duration-500 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-2xl`}>
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <span className="font-black italic text-black uppercase">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-3xl font-light">&times;</button>
        </div>
        <nav className="flex-1 p-8 space-y-6">
          <button onClick={() => navigateTo('main', 'profissionais')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">PROFISSIONAIS <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
          <button onClick={() => navigateTo('main', 'produtos')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">PRODUTOS <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
          <button onClick={() => navigateTo('main', 'servicos')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">SERVIÇOS <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
          <button onClick={() => navigateTo('cursos')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">CURSOS <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
          <button onClick={() => navigateTo('sobre')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">SOBRE NÓS <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
          <button onClick={() => navigateTo('trabalhe')} className="w-full text-left font-black text-xl text-black hover:text-blue-600 transition-colors uppercase italic tracking-tighter flex items-center justify-between group">TRABALHE CONOSCO <span className="opacity-0 group-hover:opacity-100 transition-all text-sm">➔</span></button>
        </nav>
      </div>

      {currentView === 'main' && (
        <main className="container mx-auto px-6">
          <section id="profissionais" className="mb-24 mt-12 md:mt-20">
            <div className="text-center mb-16 flex items-center justify-center"><TitleDecorator /><h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-black italic">PROFISSIONAIS</h3><TitleDecorator /></div>
            <div className="flex flex-wrap justify-center gap-8">
              {TEAM.map(barber => (
                <button key={barber.id} onClick={() => setSelectedProfessional(barber)} className="w-64 bg-white rounded-[2.5rem] p-8 border border-gray-100 text-center group transition-all hover:shadow-2xl hover:border-black flex flex-col items-center">
                  <div className="w-24 h-24 mb-4 rounded-full overflow-hidden flex items-center justify-center text-xl font-black border border-gray-100 group-hover:border-black transition-all">{barber.image ? <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">{barber.initials}</div>}</div>
                  <div className="flex gap-1 mb-4"><div className="w-6 h-1 bg-blue-600 -skew-x-[25deg] rounded-sm" /><div className="w-6 h-1 bg-red-600 -skew-x-[25deg] rounded-sm" /></div>
                  <h4 className="text-lg font-black text-black leading-tight uppercase tracking-tighter">{barber.name}</h4>
                </button>
              ))}
            </div>
          </section>

          <section id="produtos" className="mb-24">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center justify-center mb-10"><TitleDecorator /><h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-black italic">CATÁLOGO</h3><TitleDecorator /></div>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {['all', 'brand', 'category'].map(opt => (
                  <button key={opt} onClick={() => { setProductFilterMode(opt as any); setShowAllProducts(false); setActiveBrand(null); setActiveCategory('all'); }} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${productFilterMode === opt ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}>
                    {opt === 'all' ? 'Tudo' : opt === 'brand' ? 'Marcas' : 'Tipos'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
              {(showAllProducts ? filteredProducts : filteredProducts.slice(0, 6)).map((product) => {
                const selected = selectedProducts.find(p => p.id === product.id);
                return (
                  <div key={product.id} className="group relative bg-white border border-gray-100 rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 transition-all hover:shadow-2xl flex flex-col">
                    <div className="aspect-square rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-4 bg-gray-50 cursor-pointer" onClick={() => setViewingProduct(product)}><img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /></div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{product.brand}</span>
                      <h4 className="text-[10px] md:text-sm font-black text-black uppercase tracking-tight truncate mb-2">{product.name}</h4>
                      <div className="text-sm md:text-lg font-black text-black italic tracking-tighter bg-gray-50 w-fit px-2 md:px-3 py-1 rounded-full mb-4">R$ {product.price.toFixed(2)}</div>
                      {selected ? (
                        <div className="flex items-center justify-between bg-black text-white rounded-xl p-1 mt-auto">
                          <button onClick={() => updateProductQuantity(product, -1)} className="w-8 h-8 flex items-center justify-center font-black">－</button>
                          <span className="font-black text-[9px]">{selected.quantity} un</span>
                          <button onClick={() => updateProductQuantity(product, 1)} className="w-8 h-8 flex items-center justify-center font-black">＋</button>
                        </div>
                      ) : (
                        <button onClick={() => updateProductQuantity(product, 1)} className="w-full bg-black text-white font-black py-2.5 rounded-xl mt-auto text-[9px] uppercase tracking-widest">＋ Adicionar</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="servicos" className="mb-24">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="flex items-center justify-center mb-10"><TitleDecorator /><h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-black italic">SERVIÇOS</h3><TitleDecorator /></div>
              <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
                {(['all', 'corte', 'barba', 'estetica'] as const).map(tab => (
                  <button key={tab} onClick={() => { setActiveServiceTab(tab); setShowAllServices(false); }} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeServiceTab === tab ? 'bg-black border-black text-white' : 'bg-transparent border-gray-100 text-gray-400'}`}>
                    {tab === 'all' ? 'Ver Todos' : tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {(showAllServices ? filteredServices : filteredServices.slice(0, 4)).map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div key={service.id} onClick={() => toggleService(service)} className={`group relative bg-black border ${isSelected ? 'border-white' : 'border-white/10'} rounded-2xl md:rounded-3xl p-6 flex items-center justify-between hover:scale-[1.01] transition-all cursor-pointer overflow-hidden`}>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm md:text-base font-black uppercase text-white tracking-tight">{service.name}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase w-fit bg-white/5 px-2 py-0.5 rounded">{service.time}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl md:text-3xl font-black text-white italic tracking-tighter leading-none">R$ {service.price.toFixed(0)}</div>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}>{isSelected ? '✓' : '＋'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="avaliar" className="mb-24 overflow-hidden">
            <div className="text-center mb-12 flex items-center justify-center"><TitleDecorator /><h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-black italic">AVALIAÇÕES</h3><TitleDecorator /></div>
            <div className="relative max-w-4xl mx-auto min-h-[18rem] flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-inner overflow-hidden">
               <div className={`transition-all duration-500 flex flex-col items-center text-center max-w-3xl ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {allReviews[currentReviewIndex] && (
                  <>
                    <div className="flex gap-1 mb-4">{[...Array(allReviews[currentReviewIndex].stars)].map((_, i) => <span key={i} className="text-[#D4AF37] text-xl">★</span>)}</div>
                    <p className="text-lg md:text-xl font-bold italic text-black mb-8 leading-relaxed">"{allReviews[currentReviewIndex].comment}"</p>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">— {allReviews[currentReviewIndex].name}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="bg-gray-50 rounded-[3rem] p-8 md:p-16 border border-gray-100 grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <h3 className="text-4xl font-black mb-8 text-black tracking-tighter uppercase italic">Onde Estamos</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="text-2xl">📍</div>
                  <div>
                    <div className="font-black text-black text-sm uppercase tracking-widest mb-1">Unidade Jatobá</div>
                    <p className="text-gray-500 text-xs leading-relaxed">Av. Djalma Vieira Cristo 1397, BH/MG</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="text-2xl">🕒</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] text-gray-400 font-bold uppercase">
                    <span>Segunda</span> <span className="text-black">10:00 - 17:00</span>
                    <span>Ter - Sex</span> <span className="text-black">09:00 - 19:00</span>
                    <span>Sábado</span> <span className="text-black">09:00 - 17:00</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-[2.5rem] overflow-hidden h-72 shadow-xl bg-black">
              {ALL_GALLERY_IMAGES.map((src, index) => (
                <img key={src} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-80 z-10' : 'opacity-0 z-0'}`} alt="Ambiente" />
              ))}
            </div>
          </section>
        </main>
      )}

      {currentView === 'cursos' && (
        <main className="container mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center mb-6"><TitleDecorator /><h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-black">BARBER ACADEMY</h2><TitleDecorator /></div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs">Formando os melhores barbeiros da região</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { title: "INICIANTE PRO", duration: "3 Meses", desc: "Do zero ao profissional. Aprenda fundamentos, atendimento e cortes comerciais.", price: "R$ 1.200" },
              { title: "APERFEIÇOAMENTO", duration: "1 Mês", desc: "Domine o Fade, Visagismo e finalizações avançadas para elevar seu ticket médio.", price: "R$ 850" },
              { title: "WORKSHOP FREESTYLE", duration: "1 Dia", desc: "Imersão em desenhos e artes no cabelo com técnicas de pigmentação.", price: "R$ 350" }
            ].map((curso, i) => (
              <div key={i} className="bg-white border border-gray-100 p-10 rounded-[3rem] hover:shadow-2xl transition-all flex flex-col group">
                <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-4">{curso.duration}</span>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">{curso.title}</h3>
                <p className="text-gray-500 text-sm mb-10 italic">"{curso.desc}"</p>
                <div className="mt-auto">
                  <div className="text-3xl font-black text-black mb-8 italic">A partir de {curso.price}</div>
                  <button onClick={() => window.open(`https://wa.me/5531992820181?text=Olá! Tenho interesse no curso ${curso.title}`, '_blank')} className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-600 transition-colors">QUERO ME INSCREVER</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {currentView === 'sobre' && (
        <main className="container mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-20 text-center">
              <TitleDecorator />
              <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-black">NOSSA ESSÊNCIA</h2>
              <TitleDecorator />
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-center mb-40">
              <div className="lg:col-span-7 space-y-10 order-2 lg:order-1">
                <div className="inline-flex gap-2">
                  <div className="px-5 py-1.5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-sm">TRADIÇÃO</div>
                  <div className="px-5 py-1.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-sm">EXCELÊNCIA</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-0 bottom-0 w-1.5 bg-red-600 rounded-full opacity-30" />
                  <p className="text-3xl md:text-5xl font-black italic text-black leading-[1.1] tracking-tighter">
                    Man’s Space Barberstreet é um espaço dedicado à valorização do seu estilo, unindo técnica, experiência e atendimento de excelência.
                  </p>
                </div>
                <p className="text-gray-500 text-xl md:text-2xl leading-relaxed font-medium italic border-l-4 border-gray-100 pl-8">
                  Trabalhamos com profissionais qualificados e foco total na personalização de cada serviço, respeitando a identidade e o perfil de cada cliente. Aqui, tradição e modernidade se encontram para oferecer cortes, barbas e experiências com alto padrão de qualidade, conforto e profissionalismo.
                </p>
                <div className="flex items-center gap-6 pt-6">
                   <div className="flex -space-x-4">
                      {TEAM.slice(0, 3).map((b, i) => (
                        <div key={i} className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-lg bg-black">
                          {b.image ? <img src={b.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-black">{b.initials}</div>}
                        </div>
                      ))}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time de Elite</span>
                      <span className="text-sm font-black italic uppercase">Profissionais Especialistas</span>
                   </div>
                </div>
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="relative">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full -z-10 animate-pulse" />
                   <div className="rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] h-[600px] border-[12px] border-white">
                      <img src={ALL_GALLERY_IMAGES[2]} className="w-full h-full object-cover" alt="Ambiente Man's Space" />
                   </div>
                   <div className="absolute -bottom-12 -left-12 bg-black text-white p-10 rounded-[3rem] shadow-2xl flex flex-col gap-1 max-w-[220px]">
                      <span className="text-5xl font-black italic tracking-tighter">5.0</span>
                      <div className="flex gap-1 text-gold">★★★★★</div>
                      <span className="text-[9px] font-black uppercase tracking-widest mt-2 leading-tight">Média de satisfação dos nossos clientes no Google</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mb-20">
               <span className="text-gray-400 font-black text-[11px] uppercase tracking-[0.6em] mb-4">Galeria Barber Street</span>
               <h3 className="text-4xl font-black italic uppercase tracking-tighter">ESTILO EM CADA DETALHE</h3>
               <div className="flex gap-2 mt-4">
                  <div className="w-12 h-1 bg-blue-600 rounded-full" />
                  <div className="w-12 h-1 bg-red-600 rounded-full" />
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {ALL_GALLERY_IMAGES.map((img, i) => (
                <div 
                  key={i} 
                  className={`group relative rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer bg-gray-100 ${
                    i % 5 === 0 ? 'md:col-span-2 md:row-span-2 h-[450px] md:h-full' : 'h-48 md:h-72'
                  }`}
                >
                   <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Man's Space ${i}`} />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {currentView === 'trabalhe' && (
        <main className="container mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6"><TitleDecorator /><h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-black">FAÇA PARTE</h2><TitleDecorator /></div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-16 italic">Evolua sua carreira na barbearia que mais cresce na região</p>

            <div className="bg-white border border-gray-100 p-8 md:p-14 rounded-[4rem] shadow-2xl text-left relative overflow-hidden">
              <div className="absolute -top-10 -right-10 p-8 opacity-5 pointer-events-none rotate-12">
                 <img src="https://i.postimg.cc/XYvTyFcM/logo-png.jpg" alt="Watermark" className="w-64" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-4">NOME COMPLETO</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-5 focus:outline-none focus:border-black transition-all" placeholder="Como podemos te chamar?" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-4">INSTAGRAM (PORTFÓLIO)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-5 focus:outline-none focus:border-black transition-all" placeholder="@seu.perfil" />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-4">CONTE-NOS SOBRE VOCÊ</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-[2.5rem] px-8 py-6 focus:outline-none focus:border-black transition-all h-48 resize-none text-sm leading-relaxed" 
                    placeholder="Quais suas especialidades? Conte um pouco da sua trajetória na barbearia e por que deseja trabalhar conosco."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-4">ANOS DE EXPERIÊNCIA</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-5 focus:outline-none focus:border-black transition-all" placeholder="Tempo de mercado" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-4">BAIRRO / CIDADE</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-5 focus:outline-none focus:border-black transition-all" placeholder="Onde você mora?" />
                </div>
              </div>
              
              <button onClick={() => alert('Sua candidatura foi enviada! Analisaremos seu perfil e entraremos em contato em breve.')} className="w-full bg-black text-white font-black py-6 rounded-3xl text-[12px] uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-4 group">
                ENVIAR MEU PERFIL <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Modal de Avaliação */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Sua Opinião</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-300 text-3xl font-light">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sua Nota</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} className={`text-3xl transition-transform active:scale-90 ${star <= reviewRating ? 'text-[#D4AF37]' : 'text-gray-200'}`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Comentário</span>
                <textarea 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Sua experiência..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm h-32 focus:outline-none focus:border-black transition-all"
                />
              </div>
              <button onClick={handleReviewSubmit} className="w-full bg-black text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all">Enviar Avaliação ➔</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bar */}
      {totalItemsCount > 0 && currentView === 'main' && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black p-4 md:hidden border-t border-white/10 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
            <span className="text-white font-black italic text-sm uppercase tracking-tighter">{totalItemsCount} ITENS</span>
            <span className="text-blue-600 font-black text-[10px] uppercase">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button onClick={() => setIsBookingOpen(true)} className="bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">FINALIZAR ➔</button>
        </div>
      )}

      <footer className="mt-32 border-t border-gray-100 pt-24 pb-24 text-center">
        <div className="container mx-auto px-6 flex flex-col items-center">
          <div className="flex flex-col gap-1.5 mb-10"><div className="w-12 h-1.5 bg-blue-600 rounded-full"></div><div className="w-12 h-1.5 bg-red-600 rounded-full"></div><div className="w-12 h-1.5 bg-blue-600 rounded-full"></div></div>
          <div className="flex flex-col items-center gap-8 mb-12"><div className="flex items-center gap-8 bg-gray-50 px-10 py-8 rounded-[2.5rem] border border-gray-100 hover:shadow-2xl transition-all group"><img src="https://i.postimg.cc/XYvTyFcM/logo-png.jpg" alt="Logo" className="h-20 shadow-xl" /><div className="text-4xl md:text-5xl font-black italic tracking-tighter text-black uppercase leading-none text-left">Man's <br/> Space</div></div></div>
          <div className="flex justify-center gap-10 mb-20 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            <a href="https://www.instagram.com/mans_spacebs/" target="_blank" className="hover:text-black">Instagram</a>
            <a href="https://api.whatsapp.com/send/?phone=5531992820181" target="_blank" className="hover:text-black">WhatsApp</a>
          </div>
          <div className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.5em]">Man's Space Barber Street © 2022 • Alexandre Tech</div>
        </div>
      </footer>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        initialServices={selectedServices} 
        initialProducts={selectedProducts} 
        onClearSelection={() => { setSelectedServices([]); setSelectedProducts([]); }} 
      />
      <ProfessionalModal professional={selectedProfessional} onClose={() => setSelectedProfessional(null)} onBook={() => setIsBookingOpen(true)} />
      <ProductModal product={viewingProduct} onClose={() => setViewingProduct(null)} onAddToCart={(p, q) => handleAddFromModal(p, q)} />
      <AssistantChat />
    </div>
  );
};

export default App;
