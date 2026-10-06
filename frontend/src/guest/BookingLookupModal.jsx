import React, { useState } from 'react';
import { Search, Calendar, User, Phone, Mail, Car, ShieldCheck, MapPin, QrCode, CheckCircle2, AlertCircle, ExternalLink, Loader2, Download } from 'lucide-react';
import QRCode from 'qrcode';
import CustomModal from '../shared/CustomModal';

export default function BookingLookupModal({ onClose, onOpenReviewModal }) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `CG-Chillcation-QR-Pass-${booking?.reference_number || 'booking'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);
    setBooking(null);

    if (!referenceNumber || !email) {
      setError('Please provide both Booking Reference and Email.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/bookings/lookup?referenceNumber=${encodeURIComponent(referenceNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No matching booking found.');
      } else {
        setBooking(data.booking);
        // Generate QR code for check-in
        QRCode.toDataURL(data.booking.reference_number, {
          width: 240,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        }).then(setQrCodeDataUrl).catch(console.error);
      }
    } catch (err) {
      setError('Failed to connect to booking verification system.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      title="Find Your Reservation"
      subtitle="CG Chillcation Guest Desk"
      icon={Search}
      size="2xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            CG Chillcation Reservation Desk
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-all uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-zinc-400 font-mono -mt-1">
          Access your booking itinerary, payment breakdown, and check-in QR code.
        </p>

        {/* Lookup Form */}
        <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Booking Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CGC-20261006-1001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono uppercase"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Guest Email *
            </label>
            <input
              type="email"
              required
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
            />
          </div>

          <div className="sm:col-span-2 pt-1 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="liquid-btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Retrieve Booking</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Booking Found Details Display */}
        {booking && (
          <div className="space-y-5 animate-fade-in">
            {/* Header Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Reference</span>
                  <span className="text-base font-mono font-black text-white">{booking.reference_number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                    booking.booking_status === 'CONFIRMED' || booking.booking_status === 'CHECKED_IN'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {booking.booking_status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                    {booking.check_in_status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Room</span>
                  <span className="font-bold text-white">{booking.room_name} ({booking.location})</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Guest</span>
                  <span className="font-bold text-white">{booking.guest_name}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Check-in</span>
                  <span className="font-bold text-white">{booking.check_in} (2:00 PM)</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Check-out</span>
                  <span className="font-bold text-white">{booking.check_out} (12:00 PM)</span>
                </div>
              </div>
            </div>

            {/* QR Code & Check-in Pass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white text-black text-center flex flex-col items-center justify-between space-y-3 shadow-xl">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-black font-mono block">
                    Check-in Pass QR
                  </span>
                  <span className="text-[10px] text-zinc-600 block">
                    Present to staff at reception upon arrival
                  </span>
                </div>
                {qrCodeDataUrl ? (
                  <div className="bg-white p-1 rounded-xl border border-zinc-200">
                    <img src={qrCodeDataUrl} alt="Check-in QR" className="w-36 h-36 mx-auto" />
                  </div>
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center">
                    <QrCode className="w-8 h-8 animate-pulse text-zinc-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-2 px-3 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md hover:scale-[1.02] transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download QR Pass</span>
                </button>
              </div>

              {/* Financial Breakdown Snapshot */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider block mb-2">
                    Payment Breakdown
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Room Rate ({booking.breakdown?.nights || 1} night):</span>
                      <span className="text-white font-mono">₱{Number(booking.breakdown?.room_subtotal || booking.amount || 0).toLocaleString()}</span>
                    </div>
                    {booking.inclusions && booking.inclusions.length > 0 && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Inclusions ({booking.inclusions.length}):</span>
                        <span className="text-white font-mono">₱{Number(booking.breakdown?.inclusions_subtotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-400">
                      <span>Refundable Security Deposit:</span>
                      <span className="text-emerald-400 font-mono">₱{Number(booking.securityDeposit?.amount || 1000).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-white">
                      <span>Total Amount:</span>
                      <span className="font-mono">₱{Number(booking.breakdown?.total_amount || booking.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400 pt-1">
                      <span>Payment Method:</span>
                      <span className="text-white font-mono">{booking.payment_method || 'QR Ph'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Deposit Status:</span>
                      <span className="text-amber-400 font-mono font-bold uppercase">{booking.securityDeposit?.payment_status || 'PENDING'}</span>
                    </div>
                  </div>
                </div>

                {booking.google_maps_url && (
                  <a
                    href={booking.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Get Directions on Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
