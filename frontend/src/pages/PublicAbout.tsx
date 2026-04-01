import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { activitiesApi } from '../services/api';

/* ==================== GLOBAL STYLES ==================== */
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Bebas+Neue&display=swap');

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .hero-title { 
    font-family: 'Bebas Neue', sans-serif; 
    letter-spacing: 1px;
  }
  .body-font { font-family: 'Roboto', sans-serif; }

  .nav-link {
    transition: color 0.2s ease;
  }
  .nav-link:hover {
    color: #00aaff;
  }
`;

interface MediaItem { _id: string; fileName: string; mimeType: string }
interface Activity {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  isActive: boolean;
  media: MediaItem[];
  createdAt?: string;
}

export default function PublicAboutGDQPAN() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerSlides, setBannerSlides] = useState<Array<{ id: string; image: string | null }>>([
    { id: '1', image: null },
  ]);

  /* Load dữ liệu */
  const load = useCallback(async () => {
    try {
      const res = await activitiesApi.list();
      const data: Activity[] = res.data?.data || [];
      setActivities(data);

      const banner = data.find(a => a.category === 'banner');
      if (banner?.media?.length) {
        setBannerSlides(
          banner.media.map((_, i) => ({
            id: String(i + 1),
            image: activitiesApi.getMediaUrl(banner._id, i),
          }))
        );
      }
    } catch (error) {
      console.error("Load activities failed:", error);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Auto rotate banner */
  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  return (
    <div className="body-font bg-white min-h-screen">
      <style>{globalStyle}</style>

      {/* ==================== HEADER (Logo + Menu) ==================== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-3xl">GD</span>
              </div>
              <div>
                <div className="text-[#003087] text-xs font-bold tracking-widest">ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH</div>
                <div className="text-[#003087] text-xl font-bold leading-none">TRUNG TÂM GIÁO DỤC</div>
                <div className="text-[#00aaff] text-xl font-bold leading-none -mt-1">QUỐC PHÒNG VÀ AN NINH</div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
              <a href="#" className="nav-link flex items-center gap-1">
                <span>🏠</span> TRANG CHỦ
              </a>
              <a href="#" className="nav-link">GIỚI THIỆU <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">TIN TỨC <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">ĐÀO TẠO <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">QUẢN LÝ SV <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">CÔNG KHAI <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">KHÔNG GIAN VR HCM <span className="text-xs">▼</span></a>
              <a href="#" className="nav-link">TRA CỨU C. CHỈ</a>
              <a href="#" className="nav-link text-[#00aaff] font-semibold">KHÔNG GIAN THỰC TẾ ẢO</a>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button className="px-5 py-2 bg-[#003087] text-white text-sm font-medium rounded hover:bg-blue-800 transition">
                ĐĂNG NHẬP
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                🔍
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== HERO BANNER SLIDESHOW ==================== */}
      <section className="relative h-[620px] overflow-hidden">
        {/* Background Slides */}
        {bannerSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {slide.image ? (
              <img 
                src={slide.image} 
                alt={`Banner ${idx + 1}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src="https://via.placeholder.com/1920x700/003087/ffffff?text=Trung+Tâm+GDQPAN+-+Aerial+View" 
                alt="Banner default" 
                className="w-full h-full object-cover" 
              />
            )}
          </div>
        ))}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />

        {/* Main Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6 z-10">
          <div className="max-w-5xl">
            <h1 className="hero-title text-[54px] md:text-[68px] lg:text-[82px] font-black leading-[1.05] tracking-[-1px] drop-shadow-2xl">
              TRUNG TÂM GIÁO DỤC<br />
              QUỐC PHÒNG VÀ AN NINH
            </h1>

            <div className="mt-4 text-2xl md:text-3xl font-medium text-white/95">
              ĐẠI HỌC QUỐC GIA THÀNH PHỐ HỒ CHÍ MINH
            </div>

            {/* VRTOUR Section */}
            <div className="mt-10">
              <div className="inline-block bg-white text-[#003087] font-black text-7xl md:text-8xl px-12 py-3 rounded-2xl tracking-[4px] shadow-2xl">
                VRTOUR
              </div>
            </div>

            <p className="mt-6 text-2xl font-medium text-white/90">
              Không gian thực tế ảo VR Tour
            </p>
          </div>
        </div>

        {/* Left / Right Arrows */}
        {bannerSlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(p => (p - 1 + bannerSlides.length) % bannerSlides.length)}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white w-14 h-14 flex items-center justify-center rounded-full text-4xl transition-all"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentSlide(p => (p + 1) % bannerSlides.length)}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white w-14 h-14 flex items-center justify-center rounded-full text-4xl transition-all"
            >
              ›
            </button>
          </>
        )}

        {/* Slide Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-4 h-4 rounded-full border-2 border-white transition-all ${
                idx === currentSlide 
                  ? 'bg-white scale-110' 
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ==================== TEMPORARY CONTENT (có thể thay bằng nội dung thật sau) ==================== */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">
        <p>Phần nội dung bên dưới (Tin tức, Lễ khai giảng, Lời Bác dạy...) sẽ được thêm sau.</p>
        <p className="mt-4 text-sm">Bạn có thể tiếp tục yêu cầu tôi bổ sung các phần còn lại.</p>
      </div>
    </div>
  );
}