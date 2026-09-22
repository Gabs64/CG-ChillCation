import React, { useState } from 'react';
import GuestNavbar from './GuestNavbar';
import GuestHome from './GuestHome';
import RoomDetailsModal from './RoomDetailsModal';
import BookingModal from './BookingModal';
import BookingLookupModal from './BookingLookupModal';
import SharedFooter from '../shared/SharedFooter';

export default function GuestLayout({ currentUser }) {
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans">
      <GuestNavbar
        onOpenBookingsLookup={() => setShowLookupModal(true)}
        currentUser={currentUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <GuestHome
          onSelectRoom={(room) => setSelectedRoomForDetails(room)}
        />
      </main>

      <SharedFooter />

      {/* Guest Modals */}
      {selectedRoomForDetails && (
        <RoomDetailsModal
          room={selectedRoomForDetails}
          onClose={() => setSelectedRoomForDetails(null)}
          onStartBooking={(room) => setSelectedRoomForBooking(room)}
        />
      )}

      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}

      {showLookupModal && (
        <BookingLookupModal onClose={() => setShowLookupModal(false)} />
      )}
    </div>
  );
}
