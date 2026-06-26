import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Award, MapPin, Clock, ExternalLink, ShieldCheck, X, Sun, Moon, Monitor } from 'lucide-react';
import { getCards, saveCards, getMenu, getSettings } from '../utils/db';
import type { LoyaltyCard, MenuItem, RestaurantSettings } from '../types';
import confetti from 'canvas-confetti';
import { sanitizeUrl } from '../utils/security';

interface RestaurantHomeProps {
  onNavigateToCms: () => void;
}

// Custom Premium SVG Sushi Icons for visual menu cards
const SushiIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-12 h-12" }) => {
  switch (type) {
    case 'crab':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="6 3" />
          <path d="M40 45 C42 42, 45 40, 50 40 C55 40, 58 42, 60 45" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <rect x="42" y="47" width="16" height="12" rx="3" fill="#f43f5e" />
          <rect x="46" y="59" width="8" height="6" fill="#f8fafc" />
        </svg>
      );
    case 'tuna':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <circle cx="50" cy="50" r="28" fill="#e11d48" opacity="0.8" />
          <path d="M36 50 C40 40, 60 40, 64 50 C60 60, 40 60, 36 50 Z" fill="#f8fafc" opacity="0.9" />
          <circle cx="50" cy="50" r="8" fill="#c21820" />
        </svg>
      );
    case 'salmon':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <rect x="32" y="32" width="36" height="36" rx="8" fill="#f97316" />
          <path d="M38 38 L62 62 M38 50 L50 62 M50 38 L62 50" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx="50" cy="50" r="12" fill="#1c1917" />
        </svg>
      );
    case 'cheese':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <rect x="30" y="30" width="40" height="40" rx="10" fill="#eab308" />
          <circle cx="42" cy="42" r="5" fill="#1c1917" />
          <circle cx="58" cy="45" r="3" fill="#1c1917" />
          <circle cx="50" cy="58" r="6" fill="#1c1917" />
        </svg>
      );
    case 'bulgogi':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <path d="M30 45 C30 65, 70 65, 70 45 Z" fill="#78350f" />
          <path d="M25 45 H75" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
          <rect x="42" y="30" width="16" height="15" rx="2" fill="#d97706" />
        </svg>
      );
    case 'combo':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#d97706" strokeWidth="2" />
          <circle cx="38" cy="42" r="14" fill="#c21820" />
          <circle cx="62" cy="42" r="14" fill="#f97316" />
          <rect x="40" y="58" width="20" height="18" rx="4" fill="#eab308" />
        </svg>
      );
    case 'tempura':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <path d="M30 65 Q 45 35 70 30 Q 75 40 50 70 Z" fill="#d97706" stroke="#f59e0b" strokeWidth="2" />
          <path d="M70 30 L80 20 M68 32 L75 25" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#1c1917" stroke="#c21820" strokeWidth="2" />
          <circle cx="50" cy="50" r="15" fill="#c21820" />
        </svg>
      );
  }
};

export const RestaurantHome: React.FC<RestaurantHomeProps> = ({ onNavigateToCms }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: 'Tori Sushi',
    phone: '01805748464',
    address: 'Road 11, Banani, Dhaka, Bangladesh',
    hours: 'Tuesday - Sunday: 12:00 PM - 10:30 PM (Monday Closed)',
    bannerText: '✨ Order 9 times, get your 10th Sushi Roll FREE! Ask for your loyalty token in-store! ✨',
    stampRewardLimit: 10,
    heroTitle: 'Crafting Art on a Bamboo Mat',
    heroSubtitle: 'At Tori Sushi, every roll represents a balance of traditions and modern culinary fusion. Fresh ingredients, exquisite flavors, and premium presentation await you.',
    aboutTitle: 'The Tori Sushi Story',
    aboutText: 'Tori Sushi brings the finest Japanese culinary experience to Dhaka, Bangladesh. We believe that sushi is more than just food—it is an art form. Our chefs combine time-honored traditional techniques with bold modern fusions to create memorable dining moments. From crunchy prawn tempuras to fresh salmon cuts, each plate is crafted with utmost dedication to quality, flavor, and elegance.',
    facebookUrl: 'https://www.facebook.com/tori.sushi.bd',
    instagramUrl: 'https://www.instagram.com/tori.sushi.bd'
  });

  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const [searchedCard, setSearchedCard] = useState<LoyaltyCard | null>(null);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Form states for new registration
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('tori_sushi_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      const [loadedMenu, loadedSettings] = await Promise.all([
        getMenu(),
        getSettings()
      ]);
      setMenu(loadedMenu);
      setSettings(loadedSettings);
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('tori_sushi_theme', theme);
    const root = window.document.body;
    
    const applyTheme = (resolvedTheme: 'light' | 'dark') => {
      if (resolvedTheme === 'light') {
        root.classList.add('light-theme');
      } else {
        root.classList.remove('light-theme');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      applyTheme(mediaQuery.matches ? 'light' : 'dark');
      
      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'light' : 'dark');
      };
      
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    
    if (!searchToken.trim()) {
      setSearchError('Please enter a loyalty token number.');
      setSearchedCard(null);
      setHasSearched(false);
      return;
    }

    const cards = await getCards();
    const tokenUpper = searchToken.trim().toUpperCase();
    const foundCard = cards.find(c => c.token.toUpperCase() === tokenUpper);

    if (foundCard) {
      setSearchedCard(foundCard);
      setHasSearched(true);
      if (foundCard.status === 'approved') {
        // Trigger a nice little confetti burst when they see their approved active card
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#c21820', '#d97706', '#f8fafc']
        });
      }
    } else {
      setSearchError('Loyalty token not found. Please contact the restaurant manager.');
      setSearchedCard(null);
      setHasSearched(true);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerPhone) {
      setSearchError('Name and Phone number are required.');
      return;
    }

    if (!searchedCard) return;

    const cards = await getCards();
    const updatedCards = cards.map(c => {
      if (c.token === searchedCard.token) {
        return {
          ...c,
          status: 'pending' as const,
          customerName: registerName,
          customerPhone: registerPhone,
          customerEmail: registerEmail,
          registeredAt: new Date().toISOString()
        };
      }
      return c;
    });

    await saveCards(updatedCards);
    
    // Update local searched card state
    const newlyPendingCard = updatedCards.find(c => c.token === searchedCard.token)!;
    setSearchedCard(newlyPendingCard);
    
    // Reset form fields
    setRegisterName('');
    setRegisterPhone('');
    setRegisterEmail('');
  };

  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = activeCategory === 'All'
    ? menu
    : menu.filter(item => item.category === activeCategory);

  // Render the stamp grid slots (always size of limit, default 10)
  const renderStampSlots = (card: LoyaltyCard) => {
    const slots = [];
    const limit = settings.stampRewardLimit;
    const completedCycles = Math.floor(card.orderCount / limit);
    const currentCycleStamps = card.orderCount % limit;
    
    // If the card is fully stamped at limit (e.g. exactly 10) and not reset yet, show all 10 active
    const activeStampsToShow = (card.orderCount > 0 && currentCycleStamps === 0 && completedCycles > 0)
      ? limit
      : currentCycleStamps;

    for (let i = 1; i <= limit; i++) {
      const isStamped = i <= activeStampsToShow;
      const isLast = i === limit;
      
      let slotClass = "stamp-slot";
      if (isStamped) {
        slotClass += " active-stamp";
      } else {
        slotClass += " empty-gate";
      }
      if (isLast) {
        slotClass += " last-gift";
      }

      slots.push(
        <div key={i} className={slotClass} title={isStamped ? `Stamp ${i} active` : `Stamp slot ${i}`}>
          {isLast && !isStamped && <span style={{ zIndex: 10, fontSize: '0.85rem' }}>🍣</span>}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement Banner */}
      {settings.bannerText && (
        <div style={{ background: 'linear-gradient(90deg, #c21820 0%, #7f1d1d 50%, #d97706 100%)' }} className="py-2 px-4 text-center text-sm font-semibold text-white">
          {settings.bannerText}
        </div>
      )}

      <header>
        <div className="nav-container">
          <a href="#" className="logo-link">
            {sanitizeUrl(settings.logoUrl) ? (
              <img src={sanitizeUrl(settings.logoUrl)} alt="Tori Sushi Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }} />
            ) : (
              <>
                <div className="logo-icon-container">
                  <span style={{ fontSize: '1.25rem' }}>⛩️</span>
                </div>
                <h1 className="logo-text">TORI<span>sushi</span></h1>
              </>
            )}
          </a>
          <div className="flex items-center gap-4">
            <div className="theme-switch-container">
              <button 
                onClick={() => setTheme('light')} 
                className={`theme-switch-btn ${theme === 'light' ? 'active' : ''}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`theme-switch-btn ${theme === 'dark' ? 'active' : ''}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`theme-switch-btn ${theme === 'system' ? 'active' : ''}`}
                title="System Theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <a href="#menu" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Menu</a>
            <a href="#about" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>About Us</a>
            <button 
              onClick={() => setIsLoyaltyModalOpen(true)} 
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Loyalty Card
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero Section */}
        <section 
          className="text-center py-20 max-w-5xl mx-auto animate-slideup rounded-3xl overflow-hidden relative"
          style={
            sanitizeUrl(settings.heroImageUrl) 
              ? { 
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${sanitizeUrl(settings.heroImageUrl)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-glass)',
                  paddingLeft: '2rem',
                  paddingRight: '2rem'
                }
              : {
                  paddingLeft: '2rem',
                  paddingRight: '2rem'
                }
          }
        >
          <div className="max-w-3xl mx-auto relative z-10">
            <span className="text-xs tracking-[0.2em] uppercase font-bold text-gold mb-3 block">Premium Japanese Dining</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 font-display leading-tight text-white">
              {settings.heroTitle || 'Crafting Art on a Bamboo Mat'}
            </h2>
            <p className="text-text-secondary text-base md:text-lg mb-8 leading-relaxed">
              {settings.heroSubtitle || 'At Tori Sushi, every roll represents a balance of traditions and modern culinary fusion. Fresh ingredients, exquisite flavors, and premium presentation await you.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#menu" className="btn-primary">View Full Menu</a>
              <button onClick={() => setIsLoyaltyModalOpen(true)} className="btn-secondary">Check Loyalty Card</button>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 border-t border-border">
          <div className="grid-2">
            <div className="relative animate-slideup">
              {sanitizeUrl(settings.aboutImageUrl) ? (
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-glass)' }}>
                  <img 
                    src={sanitizeUrl(settings.aboutImageUrl)} 
                    alt="About Tori Sushi" 
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '380px', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}></div>
                </div>
              ) : (
                <div className="about-decor-card">
                  <div className="about-decor-gradient"></div>
                  <div className="about-decor-circle"></div>
                  <div className="about-decor-badge">
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>⛩️</span>
                    <h4 className="font-display text-xl font-bold tracking-wider text-white">TORI SUSHI</h4>
                    <div style={{ width: '3rem', height: '2px', backgroundColor: 'var(--color-tori-red)', margin: '0.75rem auto' }}></div>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', margin: 0 }}>DHAKA, BANGLADESH</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="animate-slideup">
              <span className="text-xs tracking-[0.2em] uppercase font-bold text-gold mb-3 block">Our Heritage</span>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 font-display leading-tight text-white">
                {settings.aboutTitle || 'The Tori Sushi Story'}
              </h3>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-6 whitespace-pre-line">
                {settings.aboutText || 'Tori Sushi brings the finest Japanese flavors to Dhaka. Our chefs craft each dish with precision and passion.'}
              </p>
              <div className="flex gap-8 border-t border-border/60 pt-6">
                <div>
                  <h5 className="text-white font-bold text-2xl font-display">100%</h5>
                  <p className="text-xs text-text-muted mt-1">Fresh Ingredients</p>
                </div>
                <div>
                  <h5 className="text-white font-bold text-2xl font-display">Premium</h5>
                  <p className="text-xs text-text-muted mt-1">Authentic Taste</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Section */}
        <section id="menu" className="py-16 border-t border-border">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs tracking-[0.2em] uppercase font-bold text-tori-red mb-2 block">Our Kitchen</span>
            <h3 className="text-4xl font-bold font-display">Tori Sushi Menu</h3>
            <p className="text-text-secondary text-sm mt-3">
              Browse through our authentic selections. From crunchy prawn tempura fillings to melting fresh salmon slices.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="filter-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="menu-grid">
            {filteredMenu.map(item => (
              <div key={item.id} className="menu-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {sanitizeUrl(item.imageUrl) ? (
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
                    <img 
                      src={sanitizeUrl(item.imageUrl)} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      className="hover-scale-img"
                    />
                  </div>
                ) : null}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div className="menu-card-header">
                    <h4 className="menu-item-title">{item.title}</h4>
                    <span className="menu-item-price">{item.price} Tk</span>
                  </div>
                  <p className="menu-item-desc" style={{ flexGrow: 1 }}>{item.description}</p>
                  <div className="menu-card-footer" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <span className="menu-item-category">{item.category}</span>
                    <div className="sushi-icon-badge">
                      {item.imageUrl ? (
                        <span style={{ fontSize: '1rem' }}>🍣</span>
                      ) : (
                        <SushiIcon type={item.imageType} className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b0b0d] border-t border-border py-12 text-sm text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid-3 mb-8">
            <div>
              {sanitizeUrl(settings.logoUrl) ? (
                <img src={sanitizeUrl(settings.logoUrl)} alt="Tori Sushi Logo" className="mb-3" style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block' }} />
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <div className="logo-icon-container" style={{ width: '28px', height: '28px', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.65rem' }}>⛩️</span>
                  </div>
                  <span className="font-bold text-white font-display text-lg tracking-wider">TORI SUSHI</span>
                </div>
              )}
              <p className="text-xs leading-relaxed max-w-xs">
                Handcrafted premium sushi delivered straight to your door or served in the heart of Dhaka.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-3 text-xs tracking-[0.1em] uppercase">Location & Contact</h5>
              <div className="flex flex-col gap-2 text-xs">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-tori-red" /> {settings.address}
                </p>
                <p className="flex items-center gap-2 text-white">
                  <Phone className="w-4 h-4 text-gold animate-pulse" /> Phone: {settings.phone}
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-3 text-xs tracking-[0.1em] uppercase">Opening Hours</h5>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-gold" />
                <p>{settings.hours}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} Tori Sushi Bangladesh. All rights reserved. <span className="text-text-muted">| Made by Obscura IT</span></p>
            <div className="flex gap-4">
              {sanitizeUrl(settings.facebookUrl) && (
                <a
                  href={sanitizeUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  Facebook Page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {sanitizeUrl(settings.instagramUrl) && (
                <>
                  <span className="text-border/60">|</span>
                  <a
                    href={sanitizeUrl(settings.instagramUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1"
                  >
                    Instagram <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
              <span className="text-border/60">|</span>
              <button
                onClick={onNavigateToCms}
                className="hover:text-tori-red font-semibold cursor-pointer bg-transparent border-none text-xs"
              >
                Staff Admin CMS
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Loyalty Stamp Card Modal */}
      {isLoyaltyModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content max-w-lg w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                {sanitizeUrl(settings.logoUrl) ? (
                  <img src={sanitizeUrl(settings.logoUrl)} alt="Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '1.25rem' }}>⛩️</span>
                )}
                <h3 className="text-xl font-bold font-display text-white">Tori Loyalty Card</h3>
              </div>
              <button 
                onClick={() => {
                  setIsLoyaltyModalOpen(false);
                  setSearchToken('');
                  setSearchedCard(null);
                  setSearchError('');
                  setHasSearched(false);
                }} 
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                Enter your physical loyalty card token number below to verify your card status, view your details, and count your order stamps.
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter Token (e.g. TORI-777)"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Verify Card
                </button>
              </form>

              {searchError && (
                <div className="text-ginger text-sm font-semibold mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ginger"></span>
                  {searchError}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                {hasSearched && searchedCard ? (
                  <div className="w-full">
                    {/* Status Gating */}
                    {searchedCard.status === 'new' && (
                      <div className="glass-card animate-slideup" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-3 mb-4 text-gold">
                          <Award className="w-6 h-6" />
                          <h4 className="font-bold text-lg font-display">Register Your Token</h4>
                        </div>
                        <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                          This token <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">{searchedCard.token}</code> represents your first order at Tori Sushi. Provide your details below to register.
                        </p>

                        <form onSubmit={handleRegisterSubmit}>
                          <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                placeholder="John Doe"
                                className="form-input text-sm"
                                style={{ paddingLeft: '2.5rem' }}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                                <Phone className="h-4 w-4" />
                              </span>
                              <input
                                type="tel"
                                required
                                value={registerPhone}
                                onChange={(e) => setRegisterPhone(e.target.value)}
                                placeholder="01712XXXXXX"
                                className="form-input text-sm"
                                style={{ paddingLeft: '2.5rem' }}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Email Address (Optional)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                                <Mail className="h-4 w-4" />
                              </span>
                              <input
                                type="email"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="form-input text-sm"
                                style={{ paddingLeft: '2.5rem' }}
                              />
                            </div>
                          </div>

                          <button type="submit" className="btn-primary w-full justify-center">
                            Register Loyalty Card
                          </button>
                        </form>
                      </div>
                    )}

                    {searchedCard.status === 'pending' && (
                      <div className="glass-card text-center animate-slideup" style={{ padding: '2rem' }}>
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-gold" />
                        </div>
                        <h4 className="font-bold text-xl mb-2 font-display text-gold">Awaiting Approval</h4>
                        <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                          Hey <strong>{searchedCard.customerName}</strong>, your registration for token <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">{searchedCard.token}</code> has been received.
                        </p>
                        <div className="bg-black/30 border border-border rounded-lg p-3 text-xs text-text-muted mb-4">
                          Status: Pending Owner Verification
                        </div>
                        <p className="text-xs text-text-muted">
                          Our management team will approve your membership soon. Once approved, you can start tracking stamps for your orders!
                        </p>
                      </div>
                    )}

                    {searchedCard.status === 'approved' && (
                      <div className="loyalty-card-wrapper animate-slideup w-full">
                        <div className="loyalty-card-visual w-full">
                          <div className="loyalty-card-header">
                            <div>
                              <div className="loyalty-card-title">TORI SUSHI</div>
                              <div className="loyalty-card-sub">Loyalty Card</div>
                            </div>
                            {sanitizeUrl(settings.logoUrl) ? (
                              <img src={sanitizeUrl(settings.logoUrl)} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block', borderRadius: '4px' }} />
                            ) : (
                              <div className="logo-icon-container" style={{ width: '32px', height: '32px', border: '1px solid white' }}>
                                <span style={{ fontSize: '0.8rem' }}>⛩️</span>
                              </div>
                            )}
                          </div>

                          {/* Stamp Grid */}
                          <div className="loyalty-grid">
                            {renderStampSlots(searchedCard)}
                          </div>

                          <div className="loyalty-card-footer">
                            <div className="card-holder-info">
                              <span className="card-holder-name">{searchedCard.customerName}</span>
                              <span className="card-holder-token">Token: {searchedCard.token}</span>
                            </div>
                            <div className="stamp-count-text">
                              {searchedCard.orderCount} Stamps
                            </div>
                          </div>
                        </div>

                        {/* Celebration Banners */}
                        {searchedCard.orderCount > 0 && searchedCard.orderCount % settings.stampRewardLimit === 0 && (
                          <div className="mt-4 p-4 rounded-xl border border-gold bg-amber-500/10 text-center animate-pulse">
                            <p className="text-gold font-bold text-sm flex items-center justify-center gap-1.5">
                              <span>🎉</span> 10th ORDER REACHED! <span>🎉</span>
                            </p>
                            <p className="text-xs text-text-primary mt-1">
                              Present this card to the manager to redeem your FREE Sushi Roll!
                            </p>
                          </div>
                        )}

                        {/* Summary status text */}
                        <div className="mt-4 flex items-center justify-between text-xs text-text-muted px-2">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-wasabi" /> Active Loyalty Card
                          </span>
                          <span>
                            Joined: {new Date(searchedCard.approvedAt || searchedCard.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback Placeholder Visual Card */
                  <div className="loyalty-card-wrapper opacity-35 w-full">
                    <div className="loyalty-card-visual w-full">
                      <div className="loyalty-card-header">
                        <div>
                          <div className="loyalty-card-title">TORI SUSHI</div>
                          <div className="loyalty-card-sub">Loyalty Card</div>
                        </div>
                        {sanitizeUrl(settings.logoUrl) ? (
                          <img src={sanitizeUrl(settings.logoUrl)} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block', borderRadius: '4px' }} />
                        ) : (
                          <div className="logo-icon-container" style={{ width: '32px', height: '32px', border: '1px solid white' }}>
                            <span style={{ fontSize: '0.8rem' }}>⛩️</span>
                          </div>
                        )}
                      </div>
                      <div className="loyalty-grid">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="stamp-slot empty-gate"></div>
                        ))}
                      </div>
                      <div className="loyalty-card-footer">
                        <div className="card-holder-info">
                          <span className="card-holder-name">Enter Token Above</span>
                          <span className="card-holder-token">Token: TORI-XXX</span>
                        </div>
                        <div className="stamp-count-text">
                          0 Stamps
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
