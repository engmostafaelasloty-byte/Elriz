import React, { useEffect, useRef, useState } from 'react';
import { Card, Badge, Row, Col, Alert } from 'react-bootstrap';

const LOCATIONS = [
  {
    id: 'riyadh',
    name: 'الرياض',
    fullName: 'مدينة الرياض - المركز الرئيسي للتغطية',
    lat: 24.7136,
    lng: 46.6753,
    icon: 'bi-geo-fill',
    badge: 'المقر الرئيسي 24/7',
    desc: 'تغطية متكاملة وفورية لجميع أحياء ومناطق مدينة الرياض على مدار الساعة.',
    estimatedArrival: '15-30 دقيقة'
  },
  {
    id: 'olaya',
    name: 'العليا',
    fullName: 'حي العليا - وسط الرياض',
    lat: 24.6946,
    lng: 46.6853,
    icon: 'bi-building-gear',
    badge: 'خدمة سريعة 24/7',
    desc: 'تغطية كاملة لصيانة وتركيب وتمرير مواسير التكييف السبلت والكونسيلد والمركزية.',
    estimatedArrival: '20-30 دقيقة'
  },
  {
    id: 'sulaimaniyah',
    name: 'السلمانية',
    fullName: 'حي السلمانية - الرياض',
    lat: 24.7061,
    lng: 46.7088,
    icon: 'bi-snow',
    badge: 'فنيين معتمدين',
    desc: 'خدمات الفحص الشامل للغسيل والتعقيم وتعبئة فريون R410A / R22 الأصلي.',
    estimatedArrival: '25-35 دقيقة'
  },
  {
    id: 'sahafa',
    name: 'حي الصحافة',
    fullName: 'حي الصحافة - شمال الرياض',
    lat: 24.7951,
    lng: 46.6433,
    icon: 'bi-shield-check',
    badge: 'أعلى تقييم 5★',
    desc: 'إصلاح أعطال الكومبريسور واللوحات الإلكترونية وغسيل المكيفات بالضغط العالي.',
    estimatedArrival: '20-30 دقيقة'
  },
  {
    id: 'yasmin',
    name: 'الياسمين',
    fullName: 'حي الياسمين - شمال الرياض',
    lat: 24.8188,
    lng: 46.6575,
    icon: 'bi-lightning-charge',
    badge: 'استجابة طارئة',
    desc: 'خدمات فك ونقل وتركيب المكيفات وضمان شامل على الأعمال والأجزاء المستبدلة.',
    estimatedArrival: '15-25 دقيقة'
  },
  {
    id: 'narjis',
    name: 'النرجس',
    fullName: 'حي النرجس - شمال الرياض',
    lat: 24.8385,
    lng: 46.6908,
    icon: 'bi-geo-alt-fill',
    badge: 'تغطية ممتدة',
    desc: 'صيانة دورية وتأسيس مواسير النحاس الأمريكية مع النيتروجين للمشروعات والمنازل.',
    estimatedArrival: '20-30 دقيقة'
  }
];

export default function ServiceMap({ phoneWhatsapp = '966500000000' }) {
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [geoMsg, setGeoMsg] = useState('');

  useEffect(() => {
    // Check if Leaflet (window.L) is loaded
    if (!window.L || !mapRef.current) return;
    if (leafletInstance.current) return; // already initialized

    const L = window.L;

    // Center map around North/Central Riyadh covering all neighborhoods
    const map = L.map(mapRef.current, {
      center: [24.7650, 46.6700],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false, // prevent scroll lock on page scroll
      touchZoom: true,
      dragging: true
    });

    // Modern OpenStreetMap / Carto Tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add translucent coverage zone circle for Riyadh north/center
    L.circle([24.7650, 46.6700], {
      color: '#0284c7',
      fillColor: '#38bdf8',
      fillOpacity: 0.12,
      radius: 13000,
      weight: 2,
      dashArray: '6, 8'
    }).addTo(map);

    // Create markers for each neighborhood
    LOCATIONS.forEach((loc) => {
      const customIcon = L.divIcon({
        className: 'custom-map-pin-wrap',
        html: `
          <div class="map-pin-pulse"></div>
          <div class="map-pin-badge">
            <i class="bi ${loc.icon}"></i>
            <span>${loc.name}</span>
          </div>
        `,
        iconSize: [110, 40],
        iconAnchor: [55, 20],
        popupAnchor: [0, -22]
      });

      const whatsappMsg = encodeURIComponent(`السلام عليكم، أرغب في طلب خدمة صيانة/تركيب تكييف في ${loc.fullName}`);
      const whatsappUrl = `https://wa.me/${phoneWhatsapp}?text=${whatsappMsg}`;

      const popupContent = `
        <div class="map-popup-card" dir="rtl">
          <div class="d-flex align-items-center justify-content-between mb-2 gap-2">
            <h6 class="fw-bold m-0 popup-title"><i class="bi bi-geo-alt-fill me-1"></i>${loc.fullName}</h6>
            <span class="badge bg-success small" style="font-size:0.75rem">${loc.badge}</span>
          </div>
          <p class="small popup-desc mb-2">${loc.desc}</p>
          <div class="d-flex align-items-center gap-2 mb-3 popup-arrival small">
            <i class="bi bi-clock-history text-warning"></i>
            <span>سرعة الوصول المتوقعة: <strong>${loc.estimatedArrival}</strong></span>
          </div>
          <a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm w-100 rounded-3 text-white fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm">
            <i class="bi bi-whatsapp"></i>
            <span>طلب خدمة فوري في ${loc.name}</span>
          </a>
        </div>
      `;

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-leaflet-popup',
        autoPanPadding: [30, 30]
      });

      marker.on('click', () => {
        setSelectedId(loc.id);
      });

      markersRef.current[loc.id] = marker;
    });

    leafletInstance.current = map;

    // Window resize handler to ensure responsive container rendering
    const handleResize = () => {
      if (leafletInstance.current) {
        leafletInstance.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [phoneWhatsapp]);

  const handleSelectLocation = (loc) => {
    setSelectedId(loc.id);
    if (leafletInstance.current && markersRef.current[loc.id]) {
      const map = leafletInstance.current;
      map.flyTo([loc.lat, loc.lng], 13, { duration: 1.2 });
      markersRef.current[loc.id].openPopup();
    }
  };

  const handleResetZoom = () => {
    setSelectedId(null);
    if (leafletInstance.current) {
      leafletInstance.current.flyTo([24.7650, 46.6700], 11, { duration: 1.2 });
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMsg('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setGeoStatus('loading');
    setGeoMsg('جاري تحديد موقعك الجغرافي...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoStatus('success');
        setGeoMsg('تم تحديد موقعك بنجاح! نحن نغطي منطقتك بالكامل في الرياض.');

        if (leafletInstance.current) {
          const map = leafletInstance.current;
          const L = window.L;

          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const userIcon = L.divIcon({
            className: 'user-map-pin-wrap',
            html: `
              <div class="user-pin-pulse"></div>
              <div class="user-pin-badge">
                <i class="bi bi-person-fill"></i>
                <span>موقعك الحالي</span>
              </div>
            `,
            iconSize: [110, 40],
            iconAnchor: [55, 20]
          });

          const marker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
          marker.bindPopup(`
            <div class="map-popup-card p-2 text-center" dir="rtl">
              <strong class="popup-title">أنت هنا!</strong>
              <p class="small popup-desc mb-0">أقرب فريق فني يبعد عنك حوالي 15-20 دقيقة</p>
            </div>
          `, { className: 'custom-leaflet-popup' }).openPopup();

          userMarkerRef.current = marker;
          map.flyTo([latitude, longitude], 13, { duration: 1.2 });
        }
      },
      (err) => {
        setGeoStatus('error');
        setGeoMsg('تعذر تحديد موقعك الحالي. يرجى التأكد من السماح بإذن الموقع.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="service-map-container my-4" id="service-map-section">
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden bg-card">
        {/* Header Bar */}
        <Card.Header className="bg-primary-gradient text-white p-3 p-md-4 border-0">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 text-right">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-geo-alt-fill fs-3 text-warning animate-bounce"></i>
                <h3 className="fw-bold mb-0 text-white fs-4">خريطة نطاق وتغطية الخدمات الحية</h3>
              </div>
              <p className="mb-0 text-white-50 small">
                فرقنا المباشرة تغطي كافة أحياء مدينة الرياض (العليا - السلمانية - الصحافة - الياسمين - النرجس) وضمان أسرع تلبية.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Badge bg="warning" className="text-dark fw-bold px-3 py-2 fs-7 rounded-pill shadow-sm">
                <i className="bi bi-shield-check me-1"></i>
                تغطية شاملة 100%
              </Badge>
            </div>
          </div>
        </Card.Header>

        {/* Map View Box */}
        <Card.Body className="p-0 position-relative">
          <div
            ref={mapRef}
            className="leaflet-map-wrapper"
          />

          {/* Interactive Map Floating Toolbar */}
          <div className="position-absolute top-0 start-0 m-2 m-md-3 z-index-top d-flex flex-column gap-2">
            <button
              onClick={handleResetZoom}
              className="btn btn-light btn-sm shadow border fw-bold d-flex align-items-center gap-1 rounded-3 px-3 py-2 fs-7 map-control-btn"
              title="إعادة ضبط الخريطة للرياض"
            >
              <i className="bi bi-aspect-ratio text-primary"></i>
              <span>النطاق الكامل</span>
            </button>

            <button
              onClick={handleGeolocate}
              className="btn btn-light btn-sm shadow border fw-bold d-flex align-items-center gap-1 rounded-3 px-3 py-2 fs-7 map-control-btn"
              title="تحديد موقعي الفعلي"
            >
              <i className="bi bi-crosshair text-danger"></i>
              <span>موقعي الحالي</span>
            </button>
          </div>

          {/* Live Status Overlay */}
          <div className="position-absolute bottom-0 start-0 m-2 m-md-3 z-index-top d-none d-sm-block">
            <div className="bg-white text-dark p-2 px-3 rounded-3 shadow-sm border small d-flex align-items-center gap-2 map-status-overlay">
              <span className="pulse-dot bg-success"></span>
              <span>تغطية متواصلة 24/7 في كافة الأحياء الموضحة</span>
            </div>
          </div>
        </Card.Body>

        {/* Geolocation Feedback Message */}
        {geoStatus && (
          <div className="px-3 pt-3">
            <Alert
              variant={geoStatus === 'success' ? 'success' : geoStatus === 'error' ? 'danger' : 'info'}
              dismissible
              onClose={() => setGeoStatus(null)}
              className="mb-0 py-2 small border-0 shadow-sm"
            >
              <i className={`bi ${geoStatus === 'loading' ? 'bi-hourglass-split animate-spin' : geoStatus === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {geoMsg}
            </Alert>
          </div>
        )}

        {/* Responsive Neighborhood Selector Pills Slider */}
        <Card.Footer className="bg-light-section p-3 border-top border-light-custom">
          <div className="d-flex align-items-center justify-content-between mb-2 px-1">
            <span className="fw-bold text-theme small d-flex align-items-center gap-1">
              <i className="bi bi-geo-alt text-primary"></i>
              اختر الحي للتركيز الفوري وتفاصيل الوصول:
            </span>
            <Badge bg="secondary" className="fw-normal small">
              {LOCATIONS.length} أحياء
            </Badge>
          </div>
          
          <div className="map-pills-scroll-wrapper d-flex gap-2 overflow-x-auto py-1">
            {LOCATIONS.map((loc) => {
              const isSelected = selectedId === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`btn btn-sm rounded-pill px-3 py-2 transition-all d-flex align-items-center gap-2 flex-shrink-0 ${
                    isSelected
                      ? 'btn-primary shadow-sm text-white fw-bold scale-105'
                      : 'btn-outline-primary bg-white text-theme border-light-custom map-pill-btn'
                  }`}
                >
                  <i className={`bi ${loc.icon}`}></i>
                  <span>{loc.name}</span>
                  <Badge bg={isSelected ? 'light' : 'primary'} className={isSelected ? 'text-primary' : 'text-white'}>
                    {loc.estimatedArrival}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}
