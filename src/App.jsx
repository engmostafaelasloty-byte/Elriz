import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Card, Form, Alert, Badge, Table, Modal, InputGroup, Carousel } from 'react-bootstrap';
import ServiceMap from './components/ServiceMap';

const DEFAULT_SETTINGS = {
  logoType: 'text-icon', // 'text-icon' | 'image'
  logoText: 'الرزق للتكييف والتبريد | فني معتمد',
  logoImage: '', // Base64 encoded logo image
  logoColor: '#0266ff',
  logoSize: 40, // Height in pixels
  logoShape: 'circle', // 'circle' | 'rounded' | 'square'
  logoBorderWidth: 2, // 0 to 10px
  logoBorderColor: '#0266ff', // hex color
  phoneCall: '0507295464',
  phoneHotline: '0507295464',
  phoneWhatsapp: '0507295464',
  email: 'info@alrizq-hvac.com',
  coverageAreas: 'الرياض - العليا - السلمانية - حي الصحافة - الياسمين - النرجس',
  heroImages: [
    '/images/hero_technician.png',
    '/images/condenser_service.png'
  ]
};

const getWhatsappLink = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const cleanPhone = digits.startsWith('0') ? '966' + digits.substring(1) : digits;
  return `https://wa.me/${cleanPhone}`;
};

function App() {
  // --- Navigation & View States ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState('site'); // 'site' or 'admin'
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [navExpanded, setNavExpanded] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const longPressTimer = useRef(null);

  const handleLogoTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowLogoModal(true);
    }, 400);
  };

  const handleLogoTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteLogoImage = async () => {
    const updatedSettings = {
      ...tempSettings,
      logoImage: '',
      logoType: 'text-icon'
    };
    setTempSettings(updatedSettings);
    setSettings(updatedSettings);
    localStorage.setItem('hvac_site_settings', JSON.stringify(updatedSettings));

    try {
      await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
    } catch (err) {
      console.error('Failed to sync deleted logo globally:', err);
    }

    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleNavClick = (sectionId) => {
    setNavExpanded(false);
    if (viewMode !== 'site') {
      setViewMode('site');
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.hash = `#${sectionId}`;
      }
    }, 150);
  };

  // --- Theme State (Dark / Light Mode) ---
  const [theme, setTheme] = useState('light');

  // --- Dynamic Site Settings State ---
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Load data from localStorage/sessionStorage
  useEffect(() => {
    // 1. Load Theme (Dark/Light Mode)
    const savedTheme = localStorage.getItem('hvac_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.body.classList.toggle('dark-theme', initialTheme === 'dark');

    // 2. Load Site Settings globally from /settings.json
    const loadGlobalSettings = async () => {
      try {
        const res = await fetch(`/settings.json?t=${Date.now()}`);
        if (res.ok) {
          const globalData = await res.json();
          if (globalData.heroImages) {
            globalData.heroImages = globalData.heroImages.filter(
              img => !img.includes('refrigeration_service.png')
            );
          }
          setSettings(globalData);
          setTempSettings(globalData);
          localStorage.setItem('hvac_site_settings', JSON.stringify(globalData));
          return;
        }
      } catch (err) {
        console.warn('Could not fetch global settings.json, using local storage fallback', err);
      }

      const savedSettings = localStorage.getItem('hvac_site_settings');
      if (savedSettings) {
        let parsed = JSON.parse(savedSettings);
        if (parsed.heroImages) {
          parsed.heroImages = parsed.heroImages.filter(
            img => !img.includes('refrigeration_service.png')
          );
        }
        setSettings(parsed);
        setTempSettings(parsed);
      } else {
        setSettings(DEFAULT_SETTINGS);
        setTempSettings(DEFAULT_SETTINGS);
      }
    };

    loadGlobalSettings();

    // 3. Load Admin Status
    const savedAdminStatus = sessionStorage.getItem('hvac_isAdmin');
    if (savedAdminStatus === 'true') {
      setIsAdmin(true);
      setViewMode('admin');
    }
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('hvac_theme', newTheme);
  };

  // --- Admin Login Actions ---
  const handleOpenLogin = () => {
    setPasswordInput('');
    setLoginError('');
    setShowPassword(false);
    setShowLoginModal(true);
  };

  // SHA-256 Hash helper for secure admin authentication
  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Encrypted SHA-256 hash for password 'rizk10002000'
  const ADMIN_PASSWORD_HASH = 'b54e412106aaa78f87d1388487a5426928e06ff4033f59f36cc781989b515100';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const inputHash = await hashPassword(passwordInput);
    if (inputHash === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true);
      setViewMode('admin');
      sessionStorage.setItem('hvac_isAdmin', 'true');
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('كلمة المرور غير صحيحة! يرجى المحاولة مرة أخرى.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setViewMode('site');
    sessionStorage.removeItem('hvac_isAdmin');
  };

  // --- Admin Settings Panel Handlers ---
  const handleSettingsFieldChange = (field, value) => {
    setTempSettings({
      ...tempSettings,
      [field]: value
    });
  };

  // Logo base64 file uploader
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({
          ...prev,
          logoImage: reader.result,
          logoType: 'image'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Hero slideshow image slots updates (Up to 5)
  const handleHeroImageChange = (index, value) => {
    const newImages = [...tempSettings.heroImages];
    newImages[index] = value;
    setTempSettings({
      ...tempSettings,
      heroImages: newImages
    });
  };

  const handleHeroImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...tempSettings.heroImages];
        newImages[index] = reader.result;
        setTempSettings(prev => ({
          ...prev,
          heroImages: newImages
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHeroImageSlot = () => {
    if (tempSettings.heroImages.length < 10) {
      setTempSettings({
        ...tempSettings,
        heroImages: [...tempSettings.heroImages, '']
      });
    }
  };

  const handleRemoveHeroImageSlot = (index) => {
    if (tempSettings.heroImages.length > 1) {
      const newImages = tempSettings.heroImages.filter((_, idx) => idx !== index);
      setTempSettings({
        ...tempSettings,
        heroImages: newImages
      });
    } else {
      alert('يجب أن تحتوي الشريحة على صورة واحدة على الأقل!');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const cleanedImages = tempSettings.heroImages.filter(
      img => img && img.trim() !== '' && !img.includes('refrigeration_service.png')
    );
    if (cleanedImages.length === 0) {
      alert('يجب توفير صورة واحدة على الأقل لمعرض البطل (Hero Images).');
      return;
    }

    const updatedSettings = {
      ...tempSettings,
      heroImages: cleanedImages,
      logoImage: tempSettings.logoType === 'text-icon' ? '' : tempSettings.logoImage,
      logoType: tempSettings.logoType === 'text-icon' || !tempSettings.logoImage ? 'text-icon' : 'image'
    };

    setSettings(updatedSettings);
    setTempSettings(updatedSettings);
    localStorage.setItem('hvac_site_settings', JSON.stringify(updatedSettings));

    // Persist globally across system for ALL users and devices
    try {
      await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
    } catch (err) {
      console.error('Failed to sync settings globally:', err);
    }

    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // --- Render custom logo ---
  const renderLogo = (isFooter = false) => {
    const height = isFooter ? Math.min(settings.logoSize, 50) : settings.logoSize;
    if (settings.logoType === 'image' && settings.logoImage && settings.logoImage.trim() !== '') {
      let borderRadius = '0px';
      if ((settings.logoShape || 'circle') === 'circle') borderRadius = '50%';
      if (settings.logoShape === 'rounded') borderRadius = '12px';

      const borderWidth = settings.logoBorderWidth || 0;
      const borderColor = settings.logoBorderColor || '#0266ff';

      return (
        <div 
          className="position-relative d-inline-block cursor-pointer logo-image-wrapper"
          onMouseDown={handleLogoTouchStart}
          onMouseUp={handleLogoTouchEnd}
          onTouchStart={handleLogoTouchStart}
          onTouchEnd={handleLogoTouchEnd}
          onDoubleClick={() => setShowLogoModal(true)}
          title="اضغط ضغطة مطولة أو مرتين لفتح الصورة بالكامل"
        >
          <img 
            src={settings.logoImage} 
            alt="شعار مخصص" 
            style={{ 
              height: `${height}px`,
              width: (settings.logoShape || 'circle') === 'circle' ? `${height}px` : 'auto',
              borderRadius: borderRadius,
              border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
              objectFit: 'cover',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      );
    }

    return (
      <div className="d-flex align-items-center gap-2">
        <div 
          className="d-flex align-items-center justify-content-center text-white rounded-3 p-2" 
          style={{ 
            width: `${Math.max(height, 35)}px`, 
            height: `${Math.max(height, 35)}px`, 
            backgroundColor: settings.logoColor,
            transition: 'all 0.3s ease'
          }}
        >
          <i className="bi bi-snow" style={{ fontSize: `${Math.max(height * 0.45, 12)}px` }}></i>
        </div>
        <span 
          className="fw-bold brand-text" 
          style={{ 
            fontSize: `${Math.max(height * 0.5, 16)}px`, 
            color: isFooter ? '#fff' : settings.logoColor,
            transition: 'all 0.3s ease' 
          }}
        >
          {settings.logoText}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Admin Top Sticky Bar (Shown if Admin is logged in) */}
      {isAdmin && (
        <div className="bg-dark text-white py-2 px-3 sticky-top border-bottom border-secondary d-flex justify-content-between align-items-center" style={{ zIndex: 1060, fontSize: '14px' }}>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="danger">وضع المسؤول</Badge>
            <span>مرحباً بك يا مدير الموقع. أنت حالياً تستعرض <strong>
              {viewMode === 'admin' ? 'لوحة التحكم والإعدادات' : 'الموقع العام للعملاء'}
            </strong></span>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {/* Theme Toggle in Admin Bar */}
            <Button size="sm" variant="outline-light" onClick={toggleTheme} className="d-flex align-items-center justify-content-center p-1 px-2 border-0" title={theme === 'dark' ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}>
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-secondary'}`}></i>
            </Button>
            
            {viewMode !== 'admin' ? (
              <Button size="sm" variant="outline-light" onClick={() => setViewMode('admin')}>
                <i className="bi bi-speedometer2 me-1"></i> لوحة التحكم
              </Button>
            ) : (
              <Button size="sm" variant="outline-light" onClick={() => setViewMode('site')}>
                <i className="bi bi-eye me-1"></i> معاينة الموقع
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-left me-1"></i> خروج
            </Button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      {viewMode !== 'admin' && (
        <Navbar expand="lg" sticky="top" className="glass-navbar py-3" expanded={navExpanded} onToggle={setNavExpanded}>
          <Container>
            <Navbar.Brand href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="d-flex align-items-center gap-2 cursor-pointer">
              {renderLogo()}
            </Navbar.Brand>
            
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            
            <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
              <Nav className="mx-auto">
                <Nav.Link 
                  onClick={() => handleNavClick('home')} 
                  className={`nav-link-custom cursor-pointer ${viewMode === 'site' ? 'active' : ''}`}
                >
                  الرئيسية
                </Nav.Link>
                <Nav.Link 
                  onClick={() => handleNavClick('services')} 
                  className="nav-link-custom cursor-pointer"
                >
                  خدماتنا
                </Nav.Link>
                <Nav.Link 
                  onClick={() => handleNavClick('service-map-section')} 
                  className="nav-link-custom cursor-pointer"
                >
                  <i className="bi bi-geo-alt-fill me-1 text-warning"></i>
                  مناطق الخدمة
                </Nav.Link>
                <Nav.Link 
                  onClick={() => handleNavClick('why-us')} 
                  className="nav-link-custom cursor-pointer"
                >
                  لماذا نحن؟
                </Nav.Link>
                <Nav.Link 
                  onClick={() => handleNavClick('contact')} 
                  className="nav-link-custom cursor-pointer"
                >
                  تواصل معنا
                </Nav.Link>
              </Nav>
              <div className="d-flex gap-2 align-items-center">
                {/* Theme Toggle Button */}
                <Button 
                  variant="link" 
                  onClick={toggleTheme} 
                  className="dark-theme-toggle p-0 fs-5 me-2 border-0 d-flex align-items-center justify-content-center text-decoration-none"
                  title={theme === 'dark' ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
                >
                  <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-secondary'}`}></i>
                </Button>

                <a href={`tel:${settings.phoneCall}`} className="btn btn-cool py-2 px-3 fs-7 d-none d-lg-flex align-items-center gap-2">
                  <i className="bi bi-telephone-outbound-fill"></i>
                  <span>اتصل الآن</span>
                </a>
              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}

      {/* Render Views based on ViewMode */}
      {viewMode === 'admin' ? (
        // ==========================================
        //         ADMIN DASHBOARD & SETTINGS VIEW
        // ==========================================
        <div className="admin-dashboard-container min-vh-100 py-5">
          <Container>
            {/* Dashboard Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3 border-bottom border-light-custom pb-4">
              <div>
                <h1 className="fw-extrabold text-theme mb-1">لوحة التحكم وإعدادات الموقع</h1>
                <p className="text-muted mb-0">تعديل الشعار وأرقام الاتصال وقنوات التواصل وصور الواجهة الرئيسية</p>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" className="btn-outline-custom" onClick={() => setViewMode('site')}>
                  <i className="bi bi-eye me-1"></i> معاينة الموقع العام
                </Button>
                <Button variant="danger" className="py-2 px-3" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-left me-1"></i> تسجيل الخروج
                </Button>
              </div>
            </div>

            {/* SITE CUSTOMIZATION SETTINGS */}
            <div className="text-right">
              {settingsSuccess && (
                <Alert variant="success" className="border-0 shadow-sm mb-4">
                  <i className="bi bi-check-circle-fill me-2"></i> تم حفظ إعدادات وتخصيصات الموقع بنجاح وسوف تظهر مباشرة للمستخدمين!
                </Alert>
              )}

              <Form onSubmit={handleSaveSettings}>
                <Row className="g-4">
                  {/* Part 1: Logo & Colors */}
                  <Col lg={6}>
                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100 admin-table-card">
                      <h5 className="fw-bold text-theme mb-4 border-bottom border-light-custom pb-2">
                        <i className="bi bi-palette2 text-primary me-2"></i> هويّة وشعار الموقع
                      </h5>

                      <Form.Group className="mb-3">
                        <Form.Label className="form-label-custom">نوع الشعار المفضل</Form.Label>
                        <Form.Select 
                          value={tempSettings.logoType} 
                          onChange={(e) => handleSettingsFieldChange('logoType', e.target.value)}
                          className="form-control-custom"
                        >
                          <option value="text-icon">شعار نصي مع أيقونة</option>
                          <option value="image">شعار مخصص (رفع صورة الشعار)</option>
                        </Form.Select>
                      </Form.Group>

                      {tempSettings.logoType === 'text-icon' ? (
                        <>
                          <Form.Group className="mb-3" controlId="logoText">
                            <Form.Label className="form-label-custom">نص الشعار المكتوب</Form.Label>
                            <Form.Control
                              type="text"
                              value={tempSettings.logoText}
                              onChange={(e) => handleSettingsFieldChange('logoText', e.target.value)}
                              className="form-control-custom"
                            />
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="logoColor">
                            <Form.Label className="form-label-custom">لون الشعار المفضل (Color Picker)</Form.Label>
                            <div className="d-flex align-items-center gap-2">
                              <Form.Control
                                  type="color"
                                  value={tempSettings.logoColor || '#0266ff'}
                                  onChange={(e) => handleSettingsFieldChange('logoColor', e.target.value)}
                                  className="form-control-color border-0 rounded"
                                  style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer' }}
                              />
                              <span className="text-muted small">اختر لوناً متناسباً مع هويتك (مثل درجات الأزرق أو الأخضر).</span>
                            </div>
                          </Form.Group>

                          {tempSettings.logoImage && (
                            <div className="mb-3 p-3 bg-light-block rounded-3 border d-flex align-items-center justify-content-between">
                              <span className="small text-muted">توجد صورة شعار سابقة مرفوعة</span>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={handleDeleteLogoImage}
                                className="py-1 px-3 fs-7 rounded-pill fw-bold"
                              >
                                <i className="bi bi-trash3-fill me-1"></i> حذف الصورة وحفظ الشعار النصي
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Form.Label className="form-label-custom mb-0">رفع صورة الشعار المخصص</Form.Label>
                              {tempSettings.logoImage && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={handleDeleteLogoImage}
                                  className="py-1 px-3 fs-7 rounded-pill fw-bold"
                                  title="حذف صورة الشعار والرجوع للشعار النصي"
                                >
                                  <i className="bi bi-trash3-fill me-1"></i> حذف الشعار المرفوع
                                </Button>
                              )}
                            </div>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="form-control-custom text-start"
                            />
                          </Form.Group>

                          {/* Logo Shape (Circle / Rounded / Square) */}
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label-custom">شكل الشعار المرفوع</Form.Label>
                            <div className="d-flex gap-2">
                              <Button
                                type="button"
                                variant={(tempSettings.logoShape || 'circle') === 'circle' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => handleSettingsFieldChange('logoShape', 'circle')}
                                className="flex-fill rounded-pill py-2 d-flex align-items-center justify-content-center gap-1 fw-bold fs-7"
                              >
                                <i className="bi bi-circle-fill"></i>
                                <span>دائري (Circle)</span>
                              </Button>
                              <Button
                                type="button"
                                variant={tempSettings.logoShape === 'rounded' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => handleSettingsFieldChange('logoShape', 'rounded')}
                                className="flex-fill rounded-pill py-2 d-flex align-items-center justify-content-center gap-1 fw-bold fs-7"
                              >
                                <i className="bi bi-square-fill" style={{ borderRadius: '4px' }}></i>
                                <span>حواف دائرية</span>
                              </Button>
                              <Button
                                type="button"
                                variant={tempSettings.logoShape === 'square' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => handleSettingsFieldChange('logoShape', 'square')}
                                className="flex-fill rounded-pill py-2 d-flex align-items-center justify-content-center gap-1 fw-bold fs-7"
                              >
                                <i className="bi bi-square"></i>
                                <span>مربع / أصلي</span>
                              </Button>
                            </div>
                          </Form.Group>

                          {/* Border Width & Border Color */}
                          <Row className="g-2 mb-3">
                            <Col xs={6}>
                              <Form.Group>
                                <Form.Label className="form-label-custom">سمك الإطار (Border)</Form.Label>
                                <Form.Select
                                  value={tempSettings.logoBorderWidth || 0}
                                  onChange={(e) => handleSettingsFieldChange('logoBorderWidth', parseInt(e.target.value))}
                                  className="form-control-custom"
                                >
                                  <option value={0}>بدون إطار (0px)</option>
                                  <option value={1}>إطار خفيف (1px)</option>
                                  <option value={2}>إطار متوسط (2px)</option>
                                  <option value={4}>إطار بارز (4px)</option>
                                  <option value={6}>إطار سميك (6px)</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col xs={6}>
                              <Form.Group>
                                <Form.Label className="form-label-custom">لون الإطار</Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                  <Form.Control
                                    type="color"
                                    value={tempSettings.logoBorderColor || '#0266ff'}
                                    onChange={(e) => handleSettingsFieldChange('logoBorderColor', e.target.value)}
                                    className="form-control-color border-0 rounded"
                                    style={{ width: '100%', height: '38px', padding: '0', cursor: 'pointer' }}
                                  />
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Live Preview with Long Press hint */}
                          {tempSettings.logoImage && (
                            <div className="mt-3 p-3 bg-light-block rounded-4 text-center border position-relative">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="small fw-bold text-theme">معاينة الشعار الحية:</span>
                                <span className="small text-muted" style={{ fontSize: '11px' }}>
                                  <i className="bi bi-info-circle me-1 text-primary"></i>
                                  اضغط ضغطة مطولة لتكبير الصورة
                                </span>
                              </div>
                              <div 
                                className="d-inline-block cursor-pointer p-2 rounded-3"
                                onMouseDown={handleLogoTouchStart}
                                onMouseUp={handleLogoTouchEnd}
                                onTouchStart={handleLogoTouchStart}
                                onTouchEnd={handleLogoTouchEnd}
                                onClick={() => setShowLogoModal(true)}
                                title="اضغط ضغطة مطولة لعرض الصورة بالكامل"
                              >
                                <img 
                                  src={tempSettings.logoImage} 
                                  alt="معاينة الشعار" 
                                  style={{
                                    height: `${tempSettings.logoSize}px`,
                                    width: (tempSettings.logoShape || 'circle') === 'circle' ? `${tempSettings.logoSize}px` : 'auto',
                                    borderRadius: (tempSettings.logoShape || 'circle') === 'circle' ? '50%' : tempSettings.logoShape === 'rounded' ? '12px' : '0px',
                                    border: (tempSettings.logoBorderWidth || 0) > 0 ? `${tempSettings.logoBorderWidth}px solid ${tempSettings.logoBorderColor || '#0266ff'}` : 'none',
                                    objectFit: 'cover',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }} 
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <Form.Group className="mb-3 mt-3">
                        <Form.Label className="form-label-custom">حجم الشعار: {tempSettings.logoSize} بكسل (ارتفاع)</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <Form.Range
                            min={25}
                            max={120}
                            value={tempSettings.logoSize}
                            onChange={(e) => handleSettingsFieldChange('logoSize', parseInt(e.target.value))}
                            className="w-100"
                          />
                          <Badge bg="primary" className="p-2 fs-7">{tempSettings.logoSize}px</Badge>
                        </div>
                      </Form.Group>
                    </Card>
                  </Col>

                  {/* Part 2: Contact Info */}
                  <Col lg={6}>
                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100 admin-table-card">
                      <h5 className="fw-bold text-theme mb-4 border-bottom border-light-custom pb-2">
                        <i className="bi bi-telephone text-primary me-2"></i> بيانات الاتصال والتواصل الاجتماعي
                      </h5>

                      <Form.Group className="mb-3" controlId="phoneCall">
                        <Form.Label className="form-label-custom">رقم زر (اتصل الآن) الهاتفي</Form.Label>
                        <Form.Control
                          type="text"
                          value={tempSettings.phoneCall}
                          onChange={(e) => handleSettingsFieldChange('phoneCall', e.target.value)}
                          placeholder="مثال: 0507295464"
                          className="form-control-custom text-start"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="phoneHotline">
                        <Form.Label className="form-label-custom">رقم الخط الساخن المختصر (أو الجوال الأساسي)</Form.Label>
                        <Form.Control
                          type="text"
                          value={tempSettings.phoneHotline}
                          onChange={(e) => handleSettingsFieldChange('phoneHotline', e.target.value)}
                          placeholder="مثال: 19000 أو 050XXXXXXX"
                          className="form-control-custom text-start"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="phoneWhatsapp">
                        <Form.Label className="form-label-custom">رقم هاتف الواتساب (بدون أصفار أو رمز زائد)</Form.Label>
                        <Form.Control
                          type="text"
                          value={tempSettings.phoneWhatsapp}
                          onChange={(e) => handleSettingsFieldChange('phoneWhatsapp', e.target.value)}
                          placeholder="مثال: 0507295464"
                          className="form-control-custom text-start"
                        />
                        <Form.Text className="text-muted text-muted-custom">
                          يرجى إدخال الرقم كاملاً مع كود الدولة وبدون أصفار البداية (مثل 966) ليتم توليد رابط المحادثة المباشر تلقائياً.
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="email">
                        <Form.Label className="form-label-custom">البريد الإلكتروني للعمل</Form.Label>
                        <Form.Control
                          type="email"
                          value={tempSettings.email}
                          onChange={(e) => handleSettingsFieldChange('email', e.target.value)}
                          placeholder="مثال: info@coolheat-hvac.com"
                          className="form-control-custom text-start"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="coverageAreas">
                        <Form.Label className="form-label-custom fw-bold d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-map-fill me-1 text-primary"></i> خريطة ومناطق تغطية الخدمة
                          </span>
                          <Badge bg="primary" className="fw-normal fs-7">خريطة تفاعلية أونلاين</Badge>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={tempSettings.coverageAreas || ''}
                          onChange={(e) => handleSettingsFieldChange('coverageAreas', e.target.value)}
                          placeholder="مثال: الرياض - العليا - السلمانية - حي الصحافة - الياسمين - النرجس"
                          className="form-control-custom text-start mb-3"
                        />
                        <div className="border rounded-4 overflow-hidden shadow-sm">
                          <ServiceMap phoneWhatsapp={tempSettings.phoneWhatsapp} />
                        </div>
                      </Form.Group>
                    </Card>
                  </Col>

                  {/* Part 3: Hero Carousel Images (Max 10) */}
                  <Col xs={12}>
                    <Card className="border-0 shadow-sm rounded-4 p-4 admin-table-card">
                      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-light-custom pb-2">
                        <h5 className="fw-bold text-theme mb-0">
                          <i className="bi bi-images text-primary me-2"></i> معرض صور البطل الدوار (الحد الأقصى 10 صور)
                        </h5>
                        {tempSettings.heroImages.length < 10 && (
                          <Button size="sm" variant="success" onClick={handleAddHeroImageSlot}>
                            <i className="bi bi-plus-lg me-1"></i> إضافة صورة جديدة
                          </Button>
                        )}
                      </div>

                      <Row className="g-3">
                        {tempSettings.heroImages.map((img, idx) => (
                          <Col md={12} lg={6} key={idx}>
                            <Card className="p-3 bg-light-block border-light-custom rounded-3 h-100">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Badge bg={idx === 0 ? 'primary' : 'secondary'}>
                                  {idx === 0 ? 'الصورة الافتراضية الأولى' : `الصورة رقم ${idx + 1}`}
                                </Badge>
                                {tempSettings.heroImages.length > 1 && (
                                  <Button size="sm" variant="outline-danger" className="py-0 px-2 fs-7" onClick={() => handleRemoveHeroImageSlot(idx)}>
                                    <i className="bi bi-trash"></i> حذف
                                  </Button>
                                )}
                              </div>

                              <Row className="align-items-center gy-3">
                                <Col sm={8}>
                                  <Form.Group className="mb-2">
                                    <Form.Label className="form-label-custom" style={{ fontSize: '12px' }}>رابط الصورة (URL)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={img.startsWith('data:') ? 'تم تحميل ملف محلي (Base64)' : img}
                                      disabled={img.startsWith('data:')}
                                      onChange={(e) => handleHeroImageChange(idx, e.target.value)}
                                      placeholder="انسخ رابط الصورة هنا"
                                      className="form-control-custom text-start"
                                      style={{ fontSize: '13px' }}
                                    />
                                  </Form.Group>
                                  <Form.Group>
                                    <Form.Label className="form-label-custom" style={{ fontSize: '12px' }}>أو ارفع ملف صورة محلي</Form.Label>
                                    <Form.Control
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleHeroImageUpload(idx, e)}
                                      className="form-control-custom text-start"
                                      style={{ fontSize: '13px', padding: '8px' }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col sm={4} className="text-center">
                                  {img ? (
                                    <img 
                                      src={img} 
                                      alt={`شريحة ${idx + 1}`} 
                                      className="img-fluid rounded border border-light-custom" 
                                      style={{ maxHeight: '110px', objectFit: 'cover', width: '100%' }} 
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center text-muted bg-card-body border border-dashed rounded" style={{ height: '110px' }}>
                                      <span className="small">لا توجد صورة</span>
                                    </div>
                                  )}
                                </Col>
                              </Row>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                </Row>

                {/* Form Submission Action Buttons */}
                <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4 mb-5">
                  <Button type="submit" className="btn-cool py-2 px-4 fw-bold">
                    <i className="bi bi-save me-2"></i> حفظ إعدادات وتخصيص الموقع
                  </Button>
                </div>
              </Form>
            </div>
          </Container>
        </div>
      ) : (
        // ==========================================
        //         PUBLIC CUSTOMER LANDING PAGE
        // ==========================================
        <>
          {/* Hero Section */}
          <section id="home" className="hero-section">
            <Container>
              <Row className="align-items-center gy-5">
                <Col lg={6} className="text-center text-lg-start d-flex flex-column align-items-center align-items-lg-start">
                  <div className="hero-badge">
                    <i className="bi bi-patch-check-fill"></i>
                    <span>فني تكييف معتمد بالرياض - خدمة 24 ساعة</span>
                  </div>
                  <h1 className="fw-extrabold display-4 mb-3 lh-sm text-theme text-center text-lg-start">
                    فني تكييف بالرياض <br />
                    صيانة وتصليح مكيفات <span className="text-gradient-cool">سبليت</span> و <span className="text-gradient-warm">مركزي</span>
                  </h1>
                  <p className="lead text-muted mb-4 text-center text-lg-start" style={{ maxWidth: '520px' }}>
                    أفضل فني صيانة، غسيل، تركيب، وشحن فريون المكيفات بالرياض. نغطي كافة أحياء الرياض (العليا - السلمانية - الصحافة - الياسمين - النرجس) بأعلى جودة وضمان معتمد.
                  </p>
                  
                  <div className="d-flex flex-column flex-sm-row gap-3 w-100 justify-content-center justify-content-lg-start">
                    <a href={`tel:${settings.phoneCall}`} className="btn btn-cool">
                      <i className="bi bi-telephone-outbound-fill me-2"></i>
                      اتصل الآن
                    </a>
                    <a href={getWhatsappLink(settings.phoneWhatsapp)} target="_blank" rel="noreferrer" className="btn btn-warm">
                      <i className="bi bi-whatsapp me-2"></i>
                      تواصل عبر واتساب
                    </a>
                  </div>
                  
                  <Row className="mt-5 w-100 text-center text-sm-start gy-3">
                    <Col xs={4}>
                      <h3 className="fw-bold text-primary-blue mb-0">24/7</h3>
                      <span className="text-muted small">دعم طوارئ</span>
                    </Col>
                    <Col xs={4}>
                      <h3 className="fw-bold text-primary-orange mb-0">100%</h3>
                      <span className="text-muted small">ضمان الجودة</span>
                    </Col>
                    <Col xs={4}>
                      <h3 className="fw-bold text-success mb-0">500+</h3>
                      <span className="text-muted small">عميل سعيد</span>
                    </Col>
                  </Row>
                </Col>
                
                <Col lg={6}>
                  <div className="hero-image-wrapper animate-glow-glow p-0">
                    {/* Fallback check: If only 1 image, render img alone without slideshow controls */}
                    {settings.heroImages.length > 1 ? (
                      <Carousel controls={true} indicators={true} interval={3000} pause={false} fade className="hero-carousel">
                        {settings.heroImages.map((imgSrc, idx) => (
                          <Carousel.Item key={idx}>
                            <img 
                              src={imgSrc} 
                              alt={`شريحة المعرض رقم ${idx + 1}`} 
                              className="d-block w-100 object-fit-cover rounded-4" 
                              style={{ height: '480px' }}
                            />
                          </Carousel.Item>
                        ))}
                      </Carousel>
                    ) : (
                      <img 
                        src={settings.heroImages[0] || '/images/hero_technician.png'} 
                        alt="صورة البطل الافتراضية" 
                        className="d-block w-100 object-fit-cover rounded-4" 
                        style={{ height: '480px' }}
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Services Section */}
          <section id="services" className="py-5 bg-white-section">
            <Container className="py-4">
              <div className="text-center">
                <h2 className="section-title text-theme">خدماتنا الاحترافية</h2>
                <p className="section-subtitle">
                  نوفر خدمات متكاملة تغطي كافة متطلبات التبريد والتكييف، من صيانة المكيفات المنزلية البسيطة إلى تركيب الأنظمة المركزية المعقدة.
                </p>
              </div>
              
              <Row className="g-4">
                {/* Service 1 */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-cool">
                      <i className="bi bi-gear-wide-connected"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">صيانة وتصليح الأعطال</h4>
                    <p className="text-muted">
                      تشخيص وحل كافة مشاكل التكييف: تسريب الفريون، أعطال الكومبريسور، مشاكل ضعف التبريد والتوصيلات الكهربائية.
                    </p>
                  </div>
                </Col>

                {/* Service 2 */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-cool">
                      <i className="bi bi-wind"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">تنظيف وغسيل المكيفات</h4>
                    <p className="text-muted">
                      تنظيف عميق للوحدات الداخلية والخارجية بمضخات مياه لزيادة كفاءة التبريد، توفير استهلاك الكهرباء، وتنقية الهواء.
                    </p>
                  </div>
                </Col>

                {/* Service 3 */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-tools">
                      <i className="bi bi-tools"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">تركيب ونقل المكيفات</h4>
                    <p className="text-muted">
                      تركيب مكيفات سبليت ودولابي وجداري جديدة ومستعملة بطرق فنية صحيحة لضمان أقصى أداء مع الحفاظ على جمالية المكان.
                    </p>
                  </div>
                </Col>

                {/* Service 4: Freon Gas Refilling */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-warm">
                      <i className="bi bi-snow2"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">شحن وتعبئة غاز الفريون</h4>
                    <p className="text-muted">
                      فحص تسريبات الغاز وإعادة شحن التكييف بفريون أصلي عالي الجودة (أمريكي/هندي) لاستعادة كفاءة التبريد المثالية للمكيف.
                    </p>
                  </div>
                </Col>

                {/* Service 5 */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-warm">
                      <i className="bi bi-file-earmark-check"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">عقود الصيانة الدورية</h4>
                    <p className="text-muted">
                      باقات صيانة دورية مجدولة للمنازل، الفلل، الشركات، والمحلات التجارية لضمان عمل الأجهزة بكفاءة طوال العام.
                    </p>
                  </div>
                </Col>

                {/* Service 6 */}
                <Col md={6} lg={4}>
                  <div className="custom-card">
                    <div className="icon-box icon-warm">
                      <i className="bi bi-activity"></i>
                    </div>
                    <h4 className="fw-bold text-theme mb-3">تأسيس وتمديد مواسير النحاس</h4>
                    <p className="text-muted">
                      تمديد مواسير النحاس الأمريكية الأصلية بجودة عالية واختبارها بالنيتروجين قبل البدء بأعمال التشطيبات لتفادي أي مشاكل.
                    </p>
                  </div>
                </Col>
              </Row>

              {/* Working Coverage Areas Block */}
              <ServiceMap phoneWhatsapp={settings.phoneWhatsapp} coverageAreasText={settings.coverageAreas} />
            </Container>
          </section>

          {/* Why Choose Us Section */}
          <section id="why-us" className="py-5 bg-light-section">
            <Container className="py-4">
              <Row className="align-items-center gy-5">
                <Col lg={6}>
                  <h2 className="fw-extrabold mb-4 text-theme text-right">لماذا نحن خيارك الأفضل في التبريد والتكييف؟</h2>
                  <p className="text-muted mb-5">
                    نهدف دائماً إلى تقديم خدمة تفوق توقعات العملاء من خلال الالتزام بالاحترافية والأمانة والسرعة. إليك أهم ما يميز خدماتنا:
                  </p>
                  
                  <div className="feature-item">
                    <div className="feature-check">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-theme mb-1">سرعة تلبية الطلب</h5>
                      <p className="text-muted small">نحن نقدر وقتك، لذلك نصل في الموعد المحدد ونوفر خدمة صيانة سريعة للأعطال الطارئة.</p>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-check">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-theme mb-1">ضمان حقيقي معتمد</h5>
                      <p className="text-muted small">نقدم ضماناً مكتوباً على كافة الإصلاحات وقطع الغيار الأصلية التي يتم تركيبها.</p>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-check">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-theme mb-1">دقة وأمانة في التشخيص</h5>
                      <p className="text-muted small">نقوم بتحديد الخلل الفعلي وتوضيح الحلول الممكنة بكل أمانة دون تضخيم للمشكلة أو تكاليف غير مبررة.</p>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-check">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-theme mb-1">أسعار مدروسة ومناسبة</h5>
                      <p className="text-muted small">نقدم أفضل قيمة مقابل جودة العمل، مع تزويد العميل بتكلفة الخدمة قبل البدء بالتصليح.</p>
                    </div>
                  </div>
                </Col>
                
                <Col lg={6} className="d-flex justify-content-center">
                  <div className="p-5 rounded-4 bg-card border border-light-custom shadow-sm w-100" style={{ maxWidth: '480px' }}>
                    <h4 className="fw-bold mb-4 text-center text-primary-blue">إحصائيات الإنجاز لدينا</h4>
                    <div className="d-flex flex-column gap-4">
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light-block">
                        <span className="fw-bold text-theme">عدد المكيفات التي تمت صيانتها</span>
                        <Badge bg="primary" className="p-2 fs-6">+1200 مكيف</Badge>
                      </div>
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light-block">
                        <span className="fw-bold text-theme">نسبة رضا العملاء وتقييماتهم</span>
                        <Badge bg="success" className="p-2 fs-6">99.2%</Badge>
                      </div>
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light-block">
                        <span className="fw-bold text-theme">سنوات الخبرة في السوق</span>
                        <Badge bg="warning" className="p-2 fs-6 text-dark">+5 سنوات</Badge>
                      </div>
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light-block">
                        <span className="fw-bold text-theme">ساعات العمل والخدمة الطارئة</span>
                        <Badge bg="danger" className="p-2 fs-6">24 ساعة / 7 أيام</Badge>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* FAQ Accordion Section for Google SEO & Rich Snippets */}
          <section id="faq" className="py-5 bg-white-section border-top border-light-custom">
            <Container className="py-4">
              <div className="text-center mb-5">
                <Badge bg="primary" className="p-2 mb-2 fs-7 rounded-pill">أسئلة شائعة وإجاباتها</Badge>
                <h2 className="section-title text-theme">الأسئلة الشائعة حول خدمات فني تكييف بالرياض</h2>
                <p className="section-subtitle">
                  كل ما تود معرفته عن خدمات صيانة وشحن وتنظيف المكيفات بالرياض وأسعار وتغطية الخدمات.
                </p>
              </div>
              
              <Row className="justify-content-center">
                <Col lg={10}>
                  <div className="faq-accordion-wrapper">
                    <Card className="faq-item-card border-0 shadow-sm rounded-4 mb-3 p-4 text-right">
                      <h5 className="faq-question fw-bold mb-2">
                        <i className="bi bi-question-circle-fill text-primary me-2"></i>
                        كيف تضمن لي الخدمة كأفضل فني تكييف بالرياض؟
                      </h5>
                      <p className="faq-answer text-muted mb-0 small">
                        نحن نوفر فنيين متخصصين ومجازين مع خبرة تزيد عن 5 سنوات في الرياض، ونقدم ضماناً كتابياً على جميع قطع الغيار المستبدلة وأعمال صيانة المكيفات السبليت والمركزي مع فحص كامل للتكييف قبل مغادرة الموقع.
                      </p>
                    </Card>

                    <Card className="faq-item-card border-0 shadow-sm rounded-4 mb-3 p-4 text-right">
                      <h5 className="faq-question fw-bold mb-2">
                        <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                        ما هي الأحياء والمناطق التي يغطيها فني تكييف بالرياض؟
                      </h5>
                      <p className="faq-answer text-muted mb-0 small">
                        نغطي جميع أحياء مدينة الرياض وشمال وشرق الرياض، مع تواجد سريع في أحياء (العليا، السلمانية، حي الصحافة، الياسمين، النرجس) وسرعة استجابة في غضون دقائق من طلب الخدمة.
                      </p>
                    </Card>

                    <Card className="faq-item-card border-0 shadow-sm rounded-4 mb-3 p-4 text-right">
                      <h5 className="faq-question fw-bold mb-2">
                        <i className="bi bi-clock-fill text-success me-2"></i>
                        هل تتوفر خدمة صيانة مكيفات طارئة 24 ساعة بالرياض؟
                      </h5>
                      <p className="faq-answer text-muted mb-0 small">
                        نعم، نعمل على مدار 24 ساعة يومياً طوال أيام الأسبوع في الرياض لاستقبال بلاغات الطوارئ وأعطال توقف التبريد المفاجئ للمكيفات في الصيف والشتاء.
                      </p>
                    </Card>

                    <Card className="faq-item-card border-0 shadow-sm rounded-4 mb-3 p-4 text-right">
                      <h5 className="faq-question fw-bold mb-2">
                        <i className="bi bi-snow text-info me-2"></i>
                        ما هي أنواع فريون المكيفات المستخدمة وما سعر التعبئة؟
                      </h5>
                      <p className="faq-answer text-muted mb-0 small">
                        نستخدم فريون أصلي عالي الجودة (R410A / R22) مخصص للمكيفات الحديثة بالرياض، ويتم فحص التسريب بالكامل واختبار الضغط قبل التعبئة لضمان استمرار التبريد بأفضل كفاءة وتوفير الكهرباء.
                      </p>
                    </Card>
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Contact Section (Replaces old Booking Form Section) */}
          <section id="contact" className="py-5 bg-light-section text-center border-top border-light-custom">
            <Container className="py-4">
              <div className="text-center mb-5">
                <h2 className="section-title text-theme">تواصل معنا الآن</h2>
                <p className="section-subtitle">
                  نحن هنا لخدمتك ومساعدتك في توفير الحلول المناسبة على مدار الساعة. اتصل بنا أو راسلنا مباشرة.
                </p>
              </div>
              
              <Row className="g-4 justify-content-center">
                {/* Column 1: Call Hotline */}
                <Col md={4}>
                  <Card className="custom-card text-center p-4">
                    <Card.Body className="d-flex flex-column align-items-center">
                      <div className="icon-box icon-cool mb-3">
                        <i className="bi bi-telephone-fill"></i>
                      </div>
                      <h5 className="fw-bold text-theme mb-2">الخط الساخن والاتصال المباشر</h5>
                      <p className="text-muted small mb-3">اضغط على الرقم للتواصل المباشر مع المهندس المختص</p>
                      <a href={`tel:${settings.phoneHotline}`} className="text-primary-blue fw-extrabold text-decoration-none fs-5 d-block">
                        {settings.phoneHotline}
                      </a>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Column 2: WhatsApp Chat */}
                <Col md={4}>
                  <Card className="custom-card text-center p-4">
                    <Card.Body className="d-flex flex-column align-items-center">
                      <div className="icon-box icon-warm mb-3">
                        <i className="bi bi-whatsapp"></i>
                      </div>
                      <h5 className="fw-bold text-theme mb-2">المراسلة المباشرة عبر واتساب</h5>
                      <p className="text-muted small mb-3">ارسل لنا تفاصيل العطل أو الخدمة المطلوبة وسنرد فوراً</p>
                      <a href={getWhatsappLink(settings.phoneWhatsapp)} target="_blank" rel="noreferrer" className="btn btn-warm py-2 px-4 rounded-3 d-inline-flex align-items-center gap-2">
                        <i className="bi bi-whatsapp"></i>
                        <span>ابدأ محادثة واتساب</span>
                      </a>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Column 3: Area Coverage */}
                <Col md={4}>
                  <Card className="custom-card text-center p-4">
                    <Card.Body className="d-flex flex-column align-items-center">
                      <div className="icon-box icon-cool mb-3">
                        <i className="bi bi-map-fill"></i>
                      </div>
                      <h5 className="fw-bold text-theme mb-2">مناطق تغطية خدماتنا</h5>
                      <p className="text-muted small mb-3">خريطة تفاعلية حية تحدد مواقع الفنيين والتغطية المباشرة</p>
                      <span className="fw-bold text-theme fs-6 mb-3">
                        {settings.coverageAreas}
                      </span>
                      <a href="#service-map-section" className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1">
                        <i className="bi bi-geo-alt-fill"></i>
                        <span>عرض الخريطة التفاعلية</span>
                      </a>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Footer Section */}
          <footer className="footer-section">
            <Container>
              <Row className="gy-4 mb-5">
                <Col lg={4} className="text-right">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    {renderLogo(true)}
                  </div>
                  <p className="small mb-4 text-muted" style={{ maxWidth: '300px' }}>
                    شريكك الموثوق لتوفير الحلول المتكاملة في مجال صيانة وتركيب أجهزة التكييف والتبريد بكافة أحياء مدينة الرياض وجدة. خبرة تزيد عن 5 سنوات في خدمتكم.
                  </p>
                  <div>
                    {settings.phoneWhatsapp && <a href={getWhatsappLink(settings.phoneWhatsapp)} target="_blank" rel="noreferrer" className="footer-social-icon"><i className="bi bi-whatsapp"></i></a>}
                  </div>
                </Col>
                
                <Col xs={6} md={3} lg={2} className="offset-md-1 offset-lg-2 text-right">
                  <h6 className="text-white fw-bold mb-3">روابط سريعة</h6>
                  <ul className="list-unstyled">
                    <li><a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="footer-link">الرئيسية</a></li>
                    <li><a href="#services" onClick={(e) => { e.preventDefault(); handleNavClick('services'); }} className="footer-link">خدماتنا</a></li>
                    <li><a href="#service-map-section" onClick={(e) => { e.preventDefault(); handleNavClick('service-map-section'); }} className="footer-link">مناطق الخدمة والتغطية</a></li>
                    <li><a href="#why-us" onClick={(e) => { e.preventDefault(); handleNavClick('why-us'); }} className="footer-link">لماذا نحن؟</a></li>
                    <li><a href="#contact" onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }} className="footer-link">تواصل معنا</a></li>
                  </ul>
                </Col>

                <Col xs={6} md={4} lg={3} className="text-right">
                  <h6 className="text-white fw-bold mb-3">خدماتنا</h6>
                  <ul className="list-unstyled">
                    <li><a href="#services" className="footer-link">صيانة وتصليح الأعطال</a></li>
                    <li><a href="#services" className="footer-link">تنظيف وغسيل المكيفات</a></li>
                    <li><a href="#services" className="footer-link">تركيب ونقل المكيفات</a></li>
                    <li><a href="#services" className="footer-link">شحن وتعبئة غاز الفريون</a></li>
                    <li><a href="#services" className="footer-link">تمديد مواسير النحاس</a></li>
                  </ul>
                </Col>
                
                <Col xs={12} md={4} lg={1} className="text-right d-flex flex-column align-items-md-end justify-content-end">
                  <span 
                    onClick={handleOpenLogin} 
                    className="small text-muted text-decoration-none cursor-pointer admin-login-footer-link"
                    style={{ cursor: 'pointer', fontSize: '11px', transition: 'color 0.2s' }}
                  >
                    <i className="bi bi-lock-fill"></i> دخول الإدارة
                  </span>
                </Col>
              </Row>
              
              <hr className="border-secondary opacity-25 my-4" />
              
              <Row className="align-items-center">
                <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                  <span className="small text-muted">&copy; {new Date().getFullYear()} {settings.logoType === 'text-icon' ? settings.logoText : 'الرزق للتكييف والتبريد | فني معتمد'}. جميع الحقوق محفوظة.</span>
                </Col>
                <Col md={6} className="text-center text-md-end">
                  <span className="small text-muted">
                    تطوير وبرمجة: <span className="text-primary-blue fw-semibold text-gradient-cool">Eng. Mostafa Elasloty</span>
                    <span className="mx-2">|</span>
                    <a href="mailto:engmostafaelasloty@gmail.com" className="text-decoration-none text-muted me-2" title="راسل المطور عبر البريد الإلكتروني">
                      <i className="bi bi-envelope-fill text-primary-blue fs-6"></i>
                    </a>
                    <a href="https://wa.me/201038393867" target="_blank" rel="noreferrer" className="text-decoration-none text-muted" title="تواصل مع المطور عبر واتساب">
                      <i className="bi bi-whatsapp text-success fs-6"></i>
                    </a>
                  </span>
                </Col>
              </Row>
            </Container>
          </footer>
        </>
      )}

      {/* Admin Login Modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered dir="rtl" className="modal-theme">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5 text-dark text-theme">تسجيل دخول مسؤول النظام</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form onSubmit={handleLoginSubmit}>
            <Form.Group className="mb-3" controlId="adminPassword">
              <Form.Label className="form-label-custom">كلمة مرور لوحة التحكم</Form.Label>
              <InputGroup>
                <Form.Control
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="form-control-custom text-start"
                />
                <Button 
                  variant="outline-secondary" 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="d-flex align-items-center justify-content-center px-3"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </Button>
              </InputGroup>
            </Form.Group>
            
            {loginError && (
              <Alert variant="danger" className="py-2 border-0 small mb-3 alert-danger-custom">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {loginError}
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowLoginModal(false)} className="px-4 py-2 bg-secondary border-0 text-white">
                إلغاء
              </Button>
              <Button type="submit" className="btn-cool px-4 py-2">
                دخول الإدارة
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Fullscreen Logo Image Lightbox Modal (Long-Press / Double-Click) */}
      <Modal 
        show={showLogoModal} 
        onHide={() => setShowLogoModal(false)} 
        centered 
        size="lg"
        className="modal-theme"
        dir="rtl"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5 text-dark text-theme">
            <i className="bi bi-arrows-fullscreen text-primary me-2"></i> عرض صورة الشعار الكاملة
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-3">
          {settings.logoImage || tempSettings.logoImage ? (
            <div className="d-flex flex-column align-items-center">
              <div className="p-2 rounded-4 bg-light-block border shadow-sm w-100" style={{ maxHeight: '75vh', overflow: 'auto' }}>
                <img 
                  src={settings.logoImage || tempSettings.logoImage} 
                  alt="الشعار الكامل" 
                  className="img-fluid rounded-3 shadow-sm"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">لا توجد صورة شعار مرفوعة حالياً</p>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default App;
