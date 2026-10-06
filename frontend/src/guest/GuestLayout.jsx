import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestNavbar from './GuestNavbar';
import GuestHome from './GuestHome';
import BookingModal from './BookingModal';
import BookingLookupModal from './BookingLookupModal';
import GuestExperienceModal from './GuestExperienceModal';
import SharedFooter from '../shared/SharedFooter';

export default function GuestLayout({ currentUser }) {
  const navigate = useNavigate();
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans">
      <GuestNavbar
        onOpenBookingsLookup={() => setShowLookupModal(true)}
        onOpenExperienceModal={() => setShowExperienceModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <GuestHome
          onSelectRoom={(room) => navigate(`/suite/${room.id}`)}
          onOpenExperienceModal={() => setShowExperienceModal(true)}
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

      {showExperienceModal && (
        <GuestExperienceModal
          onClose={() => setShowExperienceModal(false)}
        />
      )}
    </div>
  );
}
