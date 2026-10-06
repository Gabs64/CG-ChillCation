import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestNavbar from './GuestNavbar';
import GuestHome from './GuestHome';
import BookingModal from './BookingModal';
import BookingLookupModal from './BookingLookupModal';
import WishlistModal from './WishlistModal';
import GuestExperienceModal from './GuestExperienceModal';
import SharedFooter from '../shared/SharedFooter';

const WISHLIST_KEY = 'cg_chillcation_wishlist_v2';

export default function GuestLayout({ currentUser }) {
  const navigate = useNavigate();
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
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

  const handleToggleWishlist = (room) => {
    setWishlist((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) {
        return prev.filter((r) => r.id !== room.id);
      } else {
        return [...prev, room];
      }
    });
  };

  const handleRemoveFromWishlist = (roomId) => {
    setWishlist((prev) => prev.filter((r) => r.id !== roomId));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans">
      <GuestNavbar
        onOpenBookingsLookup={() => setShowLookupModal(true)}
        onOpenWishlist={() => setShowWishlistModal(true)}
        wishlistCount={wishlist.length}
        onOpenExperienceModal={() => setShowExperienceModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <GuestHome
          onSelectRoom={(room) => navigate(`/suite/${room.id}`)}
          onOpenExperienceModal={() => setShowExperienceModal(true)}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      </main>

      <SharedFooter />

      {/* Guest Modals */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}

      {showLookupModal && (
        <BookingLookupModal
          onClose={() => setShowLookupModal(false)}
          onOpenReviewModal={() => {
            setShowLookupModal(false);
            setShowExperienceModal(true);
          }}
        />
      )}

      {showWishlistModal && (
        <WishlistModal
          wishlist={wishlist}
          onRemove={handleRemoveFromWishlist}
          onSelectRoom={(room) => {
            setShowWishlistModal(false);
            navigate(`/suite/${room.id}`);
          }}
          onClose={() => setShowWishlistModal(false)}
        />
      )}

      {showExperienceModal && (
        <GuestExperienceModal
          onClose={() => setShowExperienceModal(false)}
        />
      )}
    </div>
  );
}
