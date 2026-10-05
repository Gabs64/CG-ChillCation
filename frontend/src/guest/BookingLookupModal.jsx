import React, { useState } from 'react';
import { X, Search, Calendar, User, Mail, MapPin, Loader2, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function BookingLookupModal({ onClose }) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [qrUrl, setQrUrl] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!referenceNumber.trim() || !email.trim()) return;

    setIsLoading(true);
    setError(null);
    setBooking(null);

    try {
      const res = await fetch(`/api/bookings/lookup?referenceNumber=${encodeURIComponent(referenceNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking not found.');
      } else {
        setBooking(data.booking);

        const securePayload = JSON.stringify({
          ref: data.booking.reference_number,
          guest: data.booking.guest_name,
          room: data.booking.room_name,
          paymentRef: data.booking.payment_reference
        });
        const url = await QRCode.toDataURL(securePayload, { margin: 2, width: 220 });
        setQrUrl(url);
      }
    } catch (err) {
      setError('Network error retrieving booking.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl liquid-glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 animate-modal-pop">
        
        {/* Top Header Bar with Clean Right Close Button */}
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-lightgray block font-bold">
              CG CHILLCATION &bull; RETRIEVAL PORTAL
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">Retrieve Reservation</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full liquid-btn text-white hover:bg-white hover:text-black transition-colors flex-shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleLookup} className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
              Booking Reference Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CGC-20260921-0001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full liquid-input rounded-xl p-3 text-white text-sm font-mono uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full liquid-input rounded-xl p-3 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full liquid-btn-primary py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Find Booking</span>
          </button>
        </form>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-white/20 text-white text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Found Booking Card */}
        {booking && (
          <div className="liquid-glass-card p-6 rounded-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{booking.booking_status}</span>
                </span>
                <h4 className="text-lg font-bold text-white mt-1">{booking.room_name} ({booking.location})</h4>
              </div>
              <span className="text-xs font-mono text-white bg-black/60 px-3 py-1 rounded-lg border border-white/10">
                {booking.reference_number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-brand-lightgray">
              <div>
                <span>Guest Name:</span>
                <p className="text-white font-semibold">{booking.guest_name}</p>
              </div>
              <div>
                <span>Guests / Vehicle:</span>
                <p className="text-white font-semibold">{booking.guest_count} guest(s) / {booking.vehicle}</p>
              </div>
              <div>
                <span>Check-in:</span>
                <p className="text-white font-semibold">{booking.check_in}</p>
              </div>
              <div>
                <span>Check-out:</span>
                <p className="text-white font-semibold">{booking.check_out}</p>
              </div>
            </div>

            {qrUrl && (
              <div className="pt-4 border-t border-white/10 text-center">
                <span className="text-xs text-brand-gray font-mono uppercase block mb-2">Digital Check-in QR Pass</span>
                <img src={qrUrl} alt="QR Pass" className="w-36 h-36 mx-auto border border-white/20 rounded-2xl p-2 bg-white shadow-xl" />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
