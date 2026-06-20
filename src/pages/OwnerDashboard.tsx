import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, PlusCircle, LogOut, ArrowLeft, Plus, Edit2, Trash2, 
  Settings as SettingsIcon, ShieldCheck, KeyRound, Save, RefreshCw, X, AlertTriangle 
} from 'lucide-react';
import { 
  getCards, saveCards, getMenu, saveMenu, getSettings, saveSettings, 
  verifyAdminPassword, changeAdminPassword, LoyaltyCard, MenuItem, RestaurantSettings 
} from '../utils/db';
import confetti from 'canvas-confetti';

interface OwnerDashboardProps {
  onBackToHome: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBackToHome }) => {
  // Authentication states
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // CMS active tab
  const [activeTab, setActiveTab] = useState<'cards' | 'menu' | 'settings' | 'security'>('cards');

  // Database states
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: '',
    phone: '',
    address: '',
    hours: '',
    bannerText: '',
    stampRewardLimit: 10
  });

  // Card filter states
  const [cardFilter, setCardFilter] = useState<'all' | 'pending' | 'approved' | 'new'>('all');
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Modal / Form states for Menu Editing
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuFormTitle, setMenuFormTitle] = useState('');
  const [menuFormDesc, setMenuFormDesc] = useState('');
  const [menuFormPrice, setMenuFormPrice] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState('Maki Rolls');
  const [menuFormImageType, setMenuFormImageType] = useState<MenuItem['imageType']>('crab');

  // Settings form states
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsHours, setSettingsHours] = useState('');
  const [settingsBannerText, setSettingsBannerText] = useState('');
  const [settingsStampLimit, setSettingsStampLimit] = useState(10);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = () => {
    const loadedCards = getCards();
    const loadedMenu = getMenu();
    const loadedSettings = getSettings();

    setCards(loadedCards);
    setMenu(loadedMenu);
    setSettings(loadedSettings);

    // Seed settings forms
    setSettingsName(loadedSettings.name);
    setSettingsPhone(loadedSettings.phone);
    setSettingsAddress(loadedSettings.address);
    setSettingsHours(loadedSettings.hours);
    setSettingsBannerText(loadedSettings.bannerText);
    setSettingsStampLimit(loadedSettings.stampRewardLimit);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifying(true);

    try {
      const isValid = await verifyAdminPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError('Invalid password. Please check your credentials.');
      }
    } catch (err) {
      setLoginError('An authentication error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('cards');
  };

  // --- LOYALTY CARD ACTIONS ---
  
  // Approve pending signup
  const handleApproveCard = (token: string) => {
    const updated = cards.map(c => {
      if (c.token === token) {
        return {
          ...c,
          status: 'approved' as const,
          approvedAt: new Date().toISOString()
        };
      }
      return c;
    });
    saveCards(updated);
    setCards(updated);
    
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#84cc16', '#ffffff']
    });
  };

  // Add one stamp mark
  const handleAddStamp = (token: string) => {
    const updated = cards.map(c => {
      if (c.token === token && c.status === 'approved') {
        const nextCount = c.orderCount + 1;
        
        // Celebrate card completion!
        if (nextCount % settings.stampRewardLimit === 0) {
          confetti({
            particleCount: 150,
            spread: 80,
            colors: ['#d97706', '#c21820', '#f8fafc']
          });
        }

        return {
          ...c,
          orderCount: nextCount
        };
      }
      return c;
    });
    saveCards(updated);
    setCards(updated);
  };

  // Decrement/Remove one stamp mark (for correction)
  const handleRemoveStamp = (token: string) => {
    const updated = cards.map(c => {
      if (c.token === token && c.orderCount > 0) {
        return {
          ...c,
          orderCount: c.orderCount - 1
        };
      }
      return c;
    });
    saveCards(updated);
    setCards(updated);
  };

  // Generate new loyalty token
  const handleGenerateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomCode = '';
    
    // Create random 4-character suffix
    for (let i = 0; i < 4; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const newToken = `TORI-${randomCode}`;
    
    // Check if token already exists
    if (cards.some(c => c.token === newToken)) {
      handleGenerateToken(); // Retry
      return;
    }

    const newCard: LoyaltyCard = {
      token: newToken,
      status: 'new',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      orderCount: 1, // Starts with 1 order
      createdAt: new Date().toISOString()
    };

    const updated = [newCard, ...cards];
    saveCards(updated);
    setCards(updated);
  };

  // Delete Card
  const handleDeleteCard = (token: string) => {
    if (window.confirm(`Are you sure you want to delete card ${token}?`)) {
      const updated = cards.filter(c => c.token !== token);
      saveCards(updated);
      setCards(updated);
    }
  };

  // --- MENU ITEM ACTIONS ---

  const handleOpenMenuModal = (item: MenuItem | null = null) => {
    setEditingMenuItem(item);
    if (item) {
      setMenuFormTitle(item.title);
      setMenuFormDesc(item.description);
      setMenuFormPrice(item.price.toString());
      setMenuFormCategory(item.category);
      setMenuFormImageType(item.imageType);
    } else {
      setMenuFormTitle('');
      setMenuFormDesc('');
      setMenuFormPrice('');
      setMenuFormCategory('Maki Rolls');
      setMenuFormImageType('crab');
    }
    setIsMenuModalOpen(true);
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormTitle || !menuFormPrice) return;

    const parsedPrice = parseFloat(menuFormPrice);
    if (isNaN(parsedPrice)) {
      alert('Price must be a valid number.');
      return;
    }

    let updatedMenu: MenuItem[];

    if (editingMenuItem) {
      // Edit existing
      updatedMenu = menu.map(m => {
        if (m.id === editingMenuItem.id) {
          return {
            ...m,
            title: menuFormTitle,
            description: menuFormDesc,
            price: parsedPrice,
            category: menuFormCategory,
            imageType: menuFormImageType
          };
        }
        return m;
      });
    } else {
      // Add new
      const newItem: MenuItem = {
        id: 'm_' + Date.now(),
        title: menuFormTitle,
        description: menuFormDesc,
        price: parsedPrice,
        category: menuFormCategory,
        imageType: menuFormImageType
      };
      updatedMenu = [...menu, newItem];
    }

    saveMenu(updatedMenu);
    setMenu(updatedMenu);
    setIsMenuModalOpen(false);
    setEditingMenuItem(null);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      const updated = menu.filter(m => m.id !== id);
      saveMenu(updated);
      setMenu(updated);
    }
  };

  // --- SETTINGS ACTIONS ---

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: RestaurantSettings = {
      name: settingsName,
      phone: settingsPhone,
      address: settingsAddress,
      hours: settingsHours,
      bannerText: settingsBannerText,
      stampRewardLimit: settingsStampLimit
    };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
    alert('Restaurant details updated successfully!');
  };

  // --- SECURITY ACTIONS ---

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage('');
    setSecurityError('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New password confirmation does not match.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    const success = await changeAdminPassword(oldPassword, newPassword);
    if (success) {
      setSecurityMessage('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setSecurityError('Old password was incorrect.');
    }
  };

  // Filter Cards list
  const filteredCards = cards.filter(c => {
    // 1. Status Filter
    if (cardFilter !== 'all' && c.status !== cardFilter) {
      return false;
    }
    // 2. Search query filter (checks name, phone, email, token)
    if (cardSearchQuery.trim()) {
      const q = cardSearchQuery.toLowerCase().trim();
      return (
        c.token.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate statistics
  const statPending = cards.filter(c => c.status === 'pending').length;
  const statApproved = cards.filter(c => c.status === 'approved').length;
  const statTotalStamps = cards.reduce((acc, c) => acc + c.orderCount, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass-card animate-slideup" style={{ padding: '2.5rem' }}>
          <div className="text-center mb-8">
            <div className="logo-icon-container mx-auto mb-4" style={{ width: '56px', height: '56px' }}>
              <span style={{ fontSize: '1.75rem' }}>⛩️</span>
            </div>
            <h2 className="text-3xl font-extrabold font-display">Tori Staff Login</h2>
            <p className="text-text-secondary text-xs mt-2">
              Authenticating to the Owner CMS dashboard
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Admin Access Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password (default: admin123)"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {loginError && (
              <div className="text-ginger text-xs font-semibold mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isVerifying}
              className="btn-primary w-full justify-center"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          <button 
            onClick={onBackToHome} 
            className="btn-secondary w-full justify-center mt-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="logo-icon-container" style={{ width: '36px', height: '36px' }}>
              <span style={{ fontSize: '1rem' }}>⛩️</span>
            </div>
            <h1 className="logo-text text-xl">TORI<span>cms</span></h1>
            <span className="badge badge-approved text-[10px] py-0.5 px-2">Manager Access</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onBackToHome} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <ArrowLeft className="w-4 h-4" /> Public Website
            </button>
            <button onClick={handleLogout} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: '#dc2626' }}>
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main CMS Layout */}
      <div className="cms-layout flex-grow">
        {/* Sidebar */}
        <aside className="cms-sidebar">
          <button 
            onClick={() => setActiveTab('cards')} 
            className={`cms-sidebar-btn ${activeTab === 'cards' ? 'active' : ''}`}
          >
            <Users className="w-5 h-5" /> Loyalty Cards
          </button>
          <button 
            onClick={() => setActiveTab('menu')} 
            className={`cms-sidebar-btn ${activeTab === 'menu' ? 'active' : ''}`}
          >
            <PlusCircle className="w-5 h-5" /> Edit Sushi Menu
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`cms-sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <SettingsIcon className="w-5 h-5" /> Store Details
          </button>
          <button 
            onClick={() => setActiveTab('security')} 
            className={`cms-sidebar-btn ${activeTab === 'security' ? 'active' : ''}`}
          >
            <ShieldCheck className="w-5 h-5" /> Admin Security
          </button>
          
          <div className="mt-auto p-3 bg-black/20 border border-border/60 rounded-xl text-center text-[10px] text-text-muted">
            <p>Database: Local Storage</p>
            <p className="mt-1">Tori Sushi CMS v1.0</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="cms-content">
          {activeTab === 'cards' && (
            <div className="animate-slideup">
              <div className="cms-section-title">
                <div>
                  <h2 className="text-2xl font-bold font-display">Client Loyalty Tokens</h2>
                  <p className="text-xs text-text-secondary mt-1">Manage physical cards, approve registrations, and add stamp marks</p>
                </div>
                <button onClick={handleGenerateToken} className="btn-primary gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Generate loyalty token
                </button>
              </div>

              {/* Stats Widgets */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper bg-amber-500/10 border border-amber-500/20 text-gold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-value">{statPending}</div>
                    <div className="stat-label">Pending Approval</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper bg-green-500/10 border border-green-500/20 text-wasabi">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-value">{statApproved}</div>
                    <div className="stat-label">Approved Members</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper bg-red-500/10 border border-red-500/20 text-tori-red">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="stat-value">{statTotalStamps}</div>
                    <div className="stat-label">Total Stamps Awarded</div>
                  </div>
                </div>
              </div>

              {/* List Gating and Filters */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'approved', 'new'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setCardFilter(f)}
                      className={`filter-tab py-1.5 px-3.5 text-xs ${cardFilter === f ? 'active' : ''}`}
                    >
                      {f === 'all' && 'All Cards'}
                      {f === 'pending' && 'Pending Approvals'}
                      {f === 'approved' && 'Approved Cards'}
                      {f === 'new' && 'Printed Unregistered'}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, phone, token..."
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    className="form-input text-xs"
                    style={{ padding: '0.5rem 0.75rem' }}
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="premium-table-container">
                {filteredCards.length > 0 ? (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Token Code</th>
                        <th>Status</th>
                        <th>Client Details</th>
                        <th>Stamps</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map(card => (
                        <tr key={card.token}>
                          <td>
                            <code className="text-white font-mono bg-black/40 px-2 py-1 rounded text-sm border border-border">
                              {card.token}
                            </code>
                          </td>
                          <td>
                            <span className={`badge badge-${card.status}`}>
                              {card.status}
                            </span>
                          </td>
                          <td>
                            {card.customerName ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-text-primary">{card.customerName}</span>
                                <span className="text-xs text-text-secondary">{card.customerPhone}</span>
                                {card.customerEmail && <span className="text-[10px] text-text-muted">{card.customerEmail}</span>}
                              </div>
                            ) : (
                              <span className="text-text-muted italic text-xs">Unregistered physical card</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gold">{card.orderCount}</span>
                              <span className="text-xs text-text-muted">stamps</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              {card.status === 'pending' && (
                                <button 
                                  onClick={() => handleApproveCard(card.token)}
                                  className="btn-primary py-1 px-3 text-xs"
                                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: 'none' }}
                                >
                                  Approve Card
                                </button>
                              )}
                              {card.status === 'approved' && (
                                <>
                                  <button 
                                    onClick={() => handleAddStamp(card.token)}
                                    className="btn-primary py-1 px-2.5 text-xs gap-1"
                                    style={{ boxShadow: 'none' }}
                                  >
                                    + Mark
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveStamp(card.token)}
                                    className="btn-secondary py-1 px-2 text-xs"
                                    disabled={card.orderCount === 0}
                                  >
                                    - Mark
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleDeleteCard(card.token)}
                                className="btn-secondary py-1 px-2 text-xs hover:text-ginger hover:border-ginger/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-text-muted text-sm italic">
                    No loyalty tokens found matching your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="animate-slideup">
              <div className="cms-section-title">
                <div>
                  <h2 className="text-2xl font-bold font-display">Tori Sushi Menu Setup</h2>
                  <p className="text-xs text-text-secondary mt-1">Configure categories, prices, details, and vector icons</p>
                </div>
                <button onClick={() => handleOpenMenuModal(null)} className="btn-primary gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Sushi Item
                </button>
              </div>

              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Sushi Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Vector Icon style</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map(item => (
                      <tr key={item.id}>
                        <td style={{ maxWidth: '300px' }}>
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{item.title}</span>
                            <span className="text-xs text-text-secondary mt-1 leading-normal">{item.description}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs bg-black/40 border border-border px-2.5 py-1 rounded-full text-text-secondary font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-gold">{item.price} Tk</span>
                        </td>
                        <td>
                          <code className="text-xs text-text-muted bg-black/20 p-1 rounded font-mono">
                            {item.imageType}
                          </code>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenMenuModal(item)}
                              className="btn-secondary p-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gold" />
                            </button>
                            <button 
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="btn-secondary p-1.5 hover:text-ginger"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-ginger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slideup max-w-2xl">
              <div className="cms-section-title">
                <div>
                  <h2 className="text-2xl font-bold font-display">Store Customization</h2>
                  <p className="text-xs text-text-secondary mt-1">Manage public landing page contact details and loyalty banners</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettingsSubmit} className="glass-card" style={{ padding: '2rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Hotline</label>
                    <input
                      type="text"
                      required
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input
                    type="text"
                    required
                    value={settingsAddress}
                    onChange={(e) => setSettingsAddress(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Hours</label>
                  <input
                    type="text"
                    required
                    value={settingsHours}
                    onChange={(e) => setSettingsHours(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Header Announcement Notice</label>
                  <textarea
                    rows={2}
                    value={settingsBannerText}
                    onChange={(e) => setSettingsBannerText(e.target.value)}
                    className="form-input py-2"
                    placeholder="Leave empty to hide announcement banner"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Loyalty Card Max stamps limit</label>
                  <input
                    type="number"
                    min={5}
                    max={20}
                    required
                    value={settingsStampLimit}
                    onChange={(e) => setSettingsStampLimit(parseInt(e.target.value) || 10)}
                    className="form-input"
                  />
                  <span className="text-[10px] text-text-muted mt-1 block">Default: 10 stamp cycles. Changing this scales the virtual cards.</span>
                </div>

                <button type="submit" className="btn-primary mt-4 gap-2">
                  <Save className="w-4 h-4" /> Save Store Settings
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-slideup max-w-md">
              <div className="cms-section-title">
                <div>
                  <h2 className="text-2xl font-bold font-display">Credential Integrity</h2>
                  <p className="text-xs text-text-secondary mt-1">Configure custom manager access passwords securely</p>
                </div>
              </div>

              <form onSubmit={handlePasswordUpdate} className="glass-card" style={{ padding: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype new password"
                    className="form-input"
                  />
                </div>

                {securityError && (
                  <div className="text-ginger text-xs font-semibold mb-4 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-ginger rounded-full"></span>
                    {securityError}
                  </div>
                )}

                {securityMessage && (
                  <div className="text-wasabi text-xs font-semibold mb-4 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-wasabi rounded-full"></span>
                    {securityMessage}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center gap-2">
                  <KeyRound className="w-4 h-4" /> Update Access Password
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Menu Modal */}
      {isMenuModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold font-display text-white">
                {editingMenuItem ? 'Edit Sushi Item' : 'New Sushi Item'}
              </h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="modal-close">
                <X />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit}>
              <div className="form-group">
                <label className="form-label">Item Title</label>
                <input
                  type="text"
                  required
                  value={menuFormTitle}
                  onChange={(e) => setMenuFormTitle(e.target.value)}
                  placeholder="e.g. Volcano Crab Roll"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Ingredients</label>
                <textarea
                  rows={3}
                  value={menuFormDesc}
                  onChange={(e) => setMenuFormDesc(e.target.value)}
                  placeholder="Describe ingredients..."
                  className="form-input py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Price (Tk)</label>
                  <input
                    type="text"
                    required
                    value={menuFormPrice}
                    onChange={(e) => setMenuFormPrice(e.target.value)}
                    placeholder="e.g. 1090"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(e.target.value)}
                    className="form-input"
                    style={{ background: '#1c1917' }}
                  >
                    <option value="Maki Rolls">Maki Rolls</option>
                    <option value="Combos">Combos</option>
                    <option value="Add-ons">Add-ons</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vector Illustration Theme</label>
                <select
                  value={menuFormImageType}
                  onChange={(e) => setMenuFormImageType(e.target.value as MenuItem['imageType'])}
                  className="form-input"
                  style={{ background: '#1c1917' }}
                >
                  <option value="crab">Crab Highlight</option>
                  <option value="tuna">Tuna Highlight</option>
                  <option value="salmon">Salmon Highlight</option>
                  <option value="cheese">Cheese Highlight</option>
                  <option value="bulgogi">Bulgogi Highlight</option>
                  <option value="combo">Combo Platter Highlight</option>
                  <option value="tempura">Crispy Tempura Highlight</option>
                  <option value="nigiri">Hand Pressed Nigiri</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex-grow justify-center">
                  {editingMenuItem ? 'Update Menu Item' : 'Create Menu Item'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsMenuModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
