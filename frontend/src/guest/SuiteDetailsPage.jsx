import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Maximize2, Users, BedDouble, Sparkles, Heart, Share2, 
  ArrowLeft, CheckCircle2, ShieldCheck, Clock, ExternalLink, 
  MessageCircle, Calendar, ChevronLeft, ChevronRight, Images, 
  Star, Wifi, Tv, Wind, Coffee, Bath, Flame, Award, AlertCircle, Loader2
} from 'lucide-react';
import GuestNavbar from './GuestNavbar';
import PhotoGalleryModal from './PhotoGalleryModal';
import BookingModal from './BookingModal';
import BookingLookupModal from './BookingLookupModal';
import WishlistModal from './WishlistModal';
import GuestExperienceModal from './GuestExperienceModal';
import SharedFooter from '../shared/SharedFooter';

const WISHLIST_KEY = 'cg_chillcation_wishlist_v2';

export default function SuiteDetailsPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery & UI States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGalleryLightbox, setShowGalleryLightbox] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Wishlist State
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const isWishlisted = room ? wishlist.some((r) => r.id === room.id) : false;

  const handleToggleWishlist = () => {
    if (!room) return;
    setWishlist((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) {
        return prev.filter((r) => r.id !== room.id);
      } else {
        return [...prev, room];
      }
    });
  };

  // Fetch Room Details
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([
      fetch(`/api/rooms/${id}`).then((r) => (r.ok ? r.json() : Promise.reject('Suite not found'))),
      fetch('/api/rooms').then((r) => (r.ok ? r.json() : { rooms: [] })).catch(() => ({ rooms: [] })),
      fetch('/api/public/experiences').then((r) => (r.ok ? r.json() : { experiences: [] })).catch(() => ({ experiences: [] }))
    ])
      .then(([roomData, allRoomsData, expData]) => {
        if (roomData.success && roomData.room) {
          setRoom(roomData.room);
        } else {
          setError('Suite details could not be found.');
        }
        if (allRoomsData.rooms) {
          setAllRooms(allRoomsData.rooms.filter((r) => String(r.id) !== String(id)));
        }
        if (expData.experiences) {
          setExperiences(expData.experiences);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Suite could not be loaded or may have been deactivated.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  // Handle Share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: room ? `${room.room_name} | CG Chillcation` : 'CG Chillcation Suite',
          text: `Check out ${room?.room_name || 'this luxury stay'} at CG Chillcation!`,
          url
        });
      } catch (e) {
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col">
        <GuestNavbar
          onOpenBookingsLookup={() => setShowLookupModal(true)}
          onOpenWishlist={() => setShowWishlistModal(true)}
          wishlistCount={wishlist.length}
          onOpenExperienceModal={() => setShowExperienceModal(true)}
        />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">
            Loading Suite Sanctuary...
          </p>
        </div>
        <SharedFooter />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col">
        <GuestNavbar
          onOpenBookingsLookup={() => setShowLookupModal(true)}
          onOpenWishlist={() => setShowWishlistModal(true)}
          wishlistCount={wishlist.length}
          onOpenExperienceModal={() => setShowExperienceModal(true)}
        />
        <div className="flex-1 max-w-lg mx-auto px-4 flex flex-col items-center justify-center text-center space-y-6 py-20">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Suite Unavailable</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {error || 'This suite is currently not available in our public catalog.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Available Suites</span>
          </button>
        </div>
        <SharedFooter />
      </div>
    );
  }

  const images = room.images && room.images.length > 0
    ? room.images
    : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'];

  const googleMapsUrl = room.google_maps_url || (
    room.location === 'Antipolo'
      ? 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation'
      : 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation'
  );

  const handleOpenMessenger = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const draftMessage = `Hello CG Chillcation! I am interested in viewing / booking:\n\nSuite: ${room.room_name}\nLocation: ${room.location}\nRate: ₱${Number(room.price_per_night).toLocaleString()}/night\nTarget Dates: ${today} to ${tomorrow}\n\nCould you assist me with checking availability and inclusions?`;
    const encodedText = encodeURIComponent(draftMessage);
    const messengerUrl = `https://m.me/cgchillcation?text=${encodedText}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <GuestNavbar
        onOpenBookingsLookup={() => setShowLookupModal(true)}
        onOpenWishlist={() => setShowWishlistModal(true)}
        wishlistCount={wishlist.length}
        onOpenExperienceModal={() => setShowExperienceModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* ================= BREADCRUMBS & TOP BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <Link to="/" className="hover:text-white flex items-center space-x-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Suites</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-500">{room.location}</span>
            <span>/</span>
            <span className="text-white font-bold truncate max-w-[200px]">{room.room_name}</span>
          </div>

          {/* Quick Actions: Share, Wishlist */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="h-9 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center space-x-1.5 transition-all"
              title="Share Suite"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copySuccess ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                isWishlisted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>
        </div>

        {/* ================= HERO PHOTO GALLERY SHOWCASE ================= */}
        <div className="space-y-3">
          <div className="relative w-full h-[340px] sm:h-[460px] md:h-[540px] rounded-3xl overflow-hidden bg-zinc-950 border border-white/15 shadow-2xl group">
            {/* Main Showcase Image */}
            <img
              src={images[selectedImageIndex]}
              alt={`${room.room_name} - Photo ${selectedImageIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-700 ease-out"
              onClick={() => setShowGalleryLightbox(true)}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-[#09090b]/40 pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg">
                <MapPin className="w-3.5 h-3.5" />
                <span>{room.location}, Rizal</span>
              </span>

              {room.is_featured && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-300 text-black uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-amber-400/20">
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Signature Suite</span>
                </span>
              )}

              <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border backdrop-blur-md flex items-center space-x-1.5 ${
                room.status === 'AVAILABLE' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-white/10 text-zinc-300 border-white/20'
              }`}>
                {room.status === 'AVAILABLE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <span>{room.status}</span>
              </span>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Gallery Launcher Pill Button */}
            <button
              onClick={() => setShowGalleryLightbox(true)}
              className="absolute bottom-4 right-4 liquid-glass text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 hover:bg-white hover:text-black transition-all flex items-center space-x-2 shadow-2xl backdrop-blur-md hover:scale-105"
            >
              <Images className="w-4 h-4" />
              <span>View All Photos ({images.length})</span>
            </button>

            {/* Photo Counter Pill */}
            <div className="absolute bottom-4 left-4 text-[11px] font-mono font-bold text-zinc-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
              Photo {selectedImageIndex + 1} of {images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative flex-shrink-0 w-20 sm:w-28 h-16 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-white scale-105 ring-2 ring-white/30 shadow-lg'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= 2-COLUMN MAIN CONTENT & BOOKING SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: DETAILS & AMENITIES (2 Cols) ================= */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Title & Subtitle */}
            <div className="space-y-2 pb-6 border-b border-white/10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                {room.room_name}
              </h1>
              <p className="text-sm font-mono text-zinc-400 tracking-wider uppercase flex items-center space-x-2">
                <span>CG Chillcation Sanctuary</span>
                <span>&bull;</span>
                <span className="text-white">{room.location}, Philippines</span>
              </p>
            </div>

            {/* Quick Specs Highlight Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-1">
                <Users className="w-5 h-5 text-white/80" />
                <span className="text-[10px] uppercase font-mono text-zinc-400">Capacity</span>
                <span className="text-sm font-bold text-white">2 - 4 Guests</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-1">
                <BedDouble className="w-5 h-5 text-white/80" />
                <span className="text-[10px] uppercase font-mono text-zinc-400">Bed Setup</span>
                <span className="text-sm font-bold text-white">King Luxury Bed</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-1">
                <Maximize2 className="w-5 h-5 text-white/80" />
                <span className="text-[10px] uppercase font-mono text-zinc-400">Suite Size</span>
                <span className="text-sm font-bold text-white">35 sqm Studio</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-1">
                <Clock className="w-5 h-5 text-white/80" />
                <span className="text-[10px] uppercase font-mono text-zinc-400">Check-in / Out</span>
                <span className="text-sm font-bold text-white">2 PM / 12 PM</span>
              </div>
            </div>

            {/* Comprehensive Suite Narrative */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                About This Luxury Suite
              </h2>
              <div className="p-6 rounded-3xl liquid-glass border border-white/10 space-y-4">
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                  {room.description || 'Experience minimalist luxury and tranquility at CG Chillcation. Designed for couples, staycationers, and solo travelers seeking high aesthetic comfort, ambient lighting, and modern conveniences.'}
                </p>
                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs font-mono text-zinc-400">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Instant QR Pass Check-in</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Self Keyless Digital Lock</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cleaned & Sanitized Daily</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorized Inclusions & Amenities Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  Included Amenities & Perks
                </h2>
                <span className="text-xs font-mono text-zinc-400 uppercase">Complimentary Inclusions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Entertainment & Media */}
                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2.5 text-white">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <Tv className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm">Entertainment & Atmosphere</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>55-inch 4K Smart TV with Netflix & YouTube</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Smart Ambient Mood Lighting System</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>High-Speed 100+ Mbps Fiber Wi-Fi</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Curated Board & Card Games</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Bedroom & Comfort */}
                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2.5 text-white">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <Wind className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm">Master Bedroom Comfort</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>King Size Luxury Orthopedic Mattress</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>100% Egyptian Cotton Luxury Bed Linens</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Full Blackout Privacy Curtains</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Whisper-Quiet Inverter Air Conditioning</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Bathroom & Spa */}
                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2.5 text-white">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <Bath className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm">Private Spa Ensuite</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Instant Hot & Cold Rain Shower</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Modern Ceramic Bidet Spray</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Fresh Hotel-Grade Plush Towels</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Hairdryer & Complimentary Toiletries</span>
                    </li>
                  </ul>
                </div>

                {/* 4. Kitchenette & Convenience */}
                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2.5 text-white">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm">Kitchenette & Dining</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Mini Refrigerator & Beverage Chiller</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Microwave Oven & Electric Kettle</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Complete Plates, Cutlery & Wine Glasses</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Dining Counter with Designer Stools</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Location & Surroundings Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Location & Surroundings
              </h2>
              <div className="p-6 rounded-3xl liquid-glass border border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {room.location}, Rizal, Philippines
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {room.location === 'Antipolo'
                        ? 'Located along the breezy scenic ridge of Antipolo, close to iconic overlook cafés, Cloud 9, Pinto Art Museum, and hilltop dining.'
                        : 'Strategically located in Cainta hub, with seamless access to Ortigas Avenue, commercial centers, grocery stores, and staycation hubs.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/15 text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    <span>Open Pin on Google Maps</span>
                  </a>

                  <button
                    onClick={handleOpenMessenger}
                    className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold flex items-center space-x-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span>Ask Concierge for Directions</span>
                  </button>
                </div>
              </div>
            </div>

            {/* House Rules & Stay Policies */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                House Rules & Stay Policies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-white block">🚭 No Smoking Inside</span>
                  <span className="text-zinc-400 leading-relaxed">Smoking and vaping are strictly prohibited inside the suite to keep fresh air quality.</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-white block">🔇 Quiet Hours</span>
                  <span className="text-zinc-400 leading-relaxed">10:00 PM – 8:00 AM to maintain a relaxing atmosphere for all guests.</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-white block">🎫 Instant QR Check-in</span>
                  <span className="text-zinc-400 leading-relaxed">Present your digital booking voucher pass upon arrival for immediate contactless verification.</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-white block">💵 Security Deposit</span>
                  <span className="text-zinc-400 leading-relaxed">₱1,000 incidental security deposit required upon check-in, 100% refundable upon room clearance.</span>
                </div>
              </div>
            </div>

            {/* Real Guest Reviews for this location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Guest Reviews</span>
                </h2>
                <button
                  onClick={() => setShowExperienceModal(true)}
                  className="text-xs text-zinc-300 hover:text-white font-mono uppercase underline"
                >
                  Write a Review
                </button>
              </div>

              {experiences.length === 0 ? (
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center text-xs text-zinc-400">
                  Be the first to leave a review for this sanctuary!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.slice(0, 4).map((exp) => (
                    <div key={exp.id} className="p-5 rounded-3xl liquid-glass border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                            {exp.guest_name ? exp.guest_name[0].toUpperCase() : 'G'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-none">{exp.guest_name || 'Verified Guest'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{exp.stay_date || 'Recent Stay'}</span>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: exp.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed italic">
                        "{exp.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: STICKY BOOKING CARD (1 Col) ================= */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
            
            <div className="p-6 sm:p-8 rounded-3xl liquid-glass-card border border-white/20 shadow-2xl space-y-6">
              
              {/* Rate & Unit Price */}
              <div className="space-y-1 pb-4 border-b border-white/10">
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block">
                  Nightly Sanctuary Rate
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    ₱{Number(room.price_per_night).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/ night</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1 pt-1">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>No hidden booking or platform fees</span>
                </p>
              </div>

              {/* Quick Summary Specs */}
              <div className="space-y-2 text-xs text-zinc-300 bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Location</span>
                  <span className="font-bold text-white">{room.location}, Rizal</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Refundable Deposit</span>
                  <span className="font-mono text-white">₱1,000 upon arrival</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Check-in</span>
                  <span className="text-white font-mono">2:00 PM onwards</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Check-out</span>
                  <span className="text-white font-mono">12:00 PM</span>
                </div>
              </div>

              {/* Primary Actions: Book Suite Now & Inquire on Messenger */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full liquid-btn-primary py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book This Suite Now</span>
                </button>

                <button
                  onClick={handleOpenMessenger}
                  className="w-full py-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span>Inquire via Messenger</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-white/10 space-y-2.5 text-[11px] text-zinc-400">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Instant QR Code Voucher Pass Generated</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Direct Host Reservation Guarantee</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ================= MORE AVAILABLE SUITES CAROUSEL/GRID ================= */}
        {allRooms.length > 0 && (
          <div className="pt-12 space-y-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block">
                  More Options
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Explore Other Available Suites
                </h2>
              </div>
              <Link
                to="/"
                className="text-xs font-bold uppercase text-white hover:text-zinc-300 flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRooms.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/suite/${r.id}`)}
                  className="cursor-pointer group rounded-3xl overflow-hidden liquid-glass border border-white/10 hover:border-white/30 transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                    <img
                      src={r.images && r.images[0] ? r.images[0] : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'}
                      alt={r.room_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {r.location}
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-zinc-200">
                        {r.room_name}
                      </h3>
                      <span className="text-xs text-zinc-400 font-mono">
                        ₱{Number(r.price_per_night).toLocaleString()} / night
                      </span>
                    </div>
                    <span className="p-2 rounded-xl bg-white/10 text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <SharedFooter />

      {/* Lightbox Photo Gallery Modal */}
      {showGalleryLightbox && (
        <PhotoGalleryModal
          images={images}
          initialIndex={selectedImageIndex}
          roomName={room.room_name}
          onClose={() => setShowGalleryLightbox(false)}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          room={room}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* Lookup Modal */}
      {showLookupModal && (
        <BookingLookupModal
          onClose={() => setShowLookupModal(false)}
          onOpenReviewModal={() => {
            setShowLookupModal(false);
            setShowExperienceModal(true);
          }}
        />
      )}

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <WishlistModal
          wishlist={wishlist}
          onRemove={(roomId) => setWishlist((prev) => prev.filter((r) => r.id !== roomId))}
          onSelectRoom={(r) => {
            setShowWishlistModal(false);
            navigate(`/suite/${r.id}`);
          }}
          onClose={() => setShowWishlistModal(false)}
        />
      )}

      {/* Experience / Review Modal */}
      {showExperienceModal && (
        <GuestExperienceModal
          onClose={() => setShowExperienceModal(false)}
          onExperienceSubmitted={() => {
            fetch('/api/public/experiences')
              .then((r) => r.json())
              .then((d) => {
                if (d.experiences) setExperiences(d.experiences);
              })
              .catch(() => {});
          }}
        />
      )}

    </div>
  );
}
