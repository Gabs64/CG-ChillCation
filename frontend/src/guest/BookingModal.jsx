import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Mail, Car, ShieldAlert, CreditCard, QrCode, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Download, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

export default function BookingModal({ room, onClose }) {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Guest details form state
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('None');
  const [age, setAge] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking & Payment state
  const [createdBooking, setCreatedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('QR Ph');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Precise night calculation & validation
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime()) || dOut <= dIn) return 0;
    return Math.ceil((dOut - dIn) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const isValidDateRange = nights > 0;
  const totalPrice = room && isValidDateRange ? room.price_per_night * nights : 0;

  // Handle check-in change with smart auto-adjustment
  const handleCheckInChange = (newCheckIn) => {
    setCheckIn(newCheckIn);
    setIsAvailable(false);
    setAvailabilityMessage(null);

    // Auto-advance check-out if check-out is now invalid
    if (newCheckIn && checkOut) {
      const dIn = new Date(newCheckIn);
      const dOut = new Date(checkOut);
      if (dOut <= dIn) {
        const nextDay = new Date(dIn.getTime() + 86400000);
        setCheckOut(nextDay.toISOString().split('T')[0]);
      }
    }
  };

  const handleCheckOutChange = (newCheckOut) => {
    setCheckOut(newCheckOut);
    setIsAvailable(false);
    setAvailabilityMessage(null);
    if (checkIn && new Date(newCheckOut) <= new Date(checkIn)) {
      setFormError('Check-out date must be after check-in date.');
    } else {
      setFormError(null);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setFormError(null);
    setAvailabilityMessage(null);

    if (!isValidDateRange) {
      setFormError('Check-out date must be after check-in date.');
      return;
    }

    setIsCheckingAvailability(true);

    try {
      const res = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, checkIn, checkOut })
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to check availability');
        setIsAvailable(false);
      } else if (data.isAvailable) {
        setIsAvailable(true);
        setAvailabilityMessage('Room is AVAILABLE for selected dates!');
      } else {
        setIsAvailable(false);
        setFormError('Room is NOT AVAILABLE for the selected dates.');
      }
    } catch (err) {
      setFormError('Network error checking room availability.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setFormError(null);

    // BR-004 validation
    if (Number(age) < 18) {
      setFormError('Booking unavailable. Guests must be 18 years old or above.');
      return;
    }

    if (!guestName.trim() || !contactNumber.trim() || !email.trim()) {
      setFormError('Please fill in all required guest information.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          guestName: guestName.trim(),
          guestCount: Number(guestCount),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          vehicle,
          age: Number(age),
          checkIn,
          checkOut
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create booking.');
      } else {
        setCreatedBooking(data.booking);
        setStep(3);
      }
    } catch (err) {
      setFormError('Network error submitting booking application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayAndConfirm = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/bookings/${createdBooking.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          amount: totalPrice
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Payment processing failed.');
      } else {
        setConfirmedBooking(data.booking);
        
        const secureQrPayload = JSON.stringify({
          ref: data.booking.reference_number,
          guest: data.booking.guest_name,
          room: data.booking.room_name,
          paymentRef: data.booking.payment_reference
        });
        const qrUrl = await QRCode.toDataURL(secureQrPayload, { margin: 2, width: 240 });
        setQrCodeDataUrl(qrUrl);

        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setStep(4);
      }
    } catch (err) {
      setFormError('Network error processing payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl my-8 animate-modal-pop border border-white/20">
        
        {/* Top Dedicated Header Bar with Step Counter & Clean Top-Right Close Button */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-lightgray font-bold bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
              STEP {step} OF 4
            </span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full liquid-btn text-white hover:bg-white hover:text-black transition-all flex-shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title */}
        <div className="mb-6">
          <h3 className="text-2xl font-black text-white">
            {step === 1 && `Select Stay Dates (${room.room_name})`}
            {step === 2 && `Guest Details & Verification`}
            {step === 3 && `Payment Authorization`}
            {step === 4 && `Reservation Confirmed!`}
          </h3>
        </div>

        {/* Global Error Notice - High Contrast Monochrome */}
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-white/25 text-white text-xs flex items-start space-x-3 backdrop-blur-md shadow-lg">
            <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider mb-0.5 text-white">Validation Notice</span>
              <span className="text-zinc-300 font-medium">{formError}</span>
            </div>
          </div>
        )}

        {/* STEP 1: DATES & AVAILABILITY */}
        {step === 1 && (
          <form onSubmit={handleCheckAvailability} className="space-y-6">
            <div className="liquid-glass-card p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-2 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-in Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-2 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-out Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                  />
                </div>
              </div>

              {/* Price & Night Calculation Breakdown */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-brand-lightgray">
                <span>Nights: <strong className="text-white">{isValidDateRange ? `${nights} night(s)` : 'Invalid Range'}</strong></span>
                <span>Rate: <strong className="text-white">₱{room.price_per_night.toLocaleString()}</strong></span>
                <span>Total: <strong className="text-white text-base font-black">₱{totalPrice.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Monochrome Availability Message Banner */}
            {availabilityMessage && (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{availabilityMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={isCheckingAvailability || !isValidDateRange}
                className={`liquid-btn px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
                  !isValidDateRange ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isCheckingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>Check Availability</span>
              </button>

              <button
                type="button"
                disabled={!isAvailable || !isValidDateRange}
                onClick={() => setStep(2)}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
                  isAvailable && isValidDateRange
                    ? 'liquid-btn-primary shadow-lg'
                    : 'bg-white/10 text-brand-gray cursor-not-allowed border border-white/5'
                }`}
              >
                <span>Continue to Guest Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: GUEST DETAILS */}
        {step === 2 && (
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Age (18+ Required) *
                </label>
                <div className="relative">
                  <ShieldAlert className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
                  <input
                    type="tel"
                    required
                    placeholder="09171234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
                  <input
                    type="email"
                    required
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Number of Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
                  Vehicle Type *
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
                  >
                    <option value="None" className="bg-black text-white">None</option>
                    <option value="Car" className="bg-black text-white">Car</option>
                    <option value="Motorcycle" className="bg-black text-white">Motorcycle</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="liquid-btn px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="liquid-btn-primary px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PAYMENT GATEWAY SIMULATOR */}
        {step === 3 && createdBooking && (
          <div className="space-y-6">
            <div className="liquid-glass-card p-5 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-brand-lightgray">
                <span>Suite:</span>
                <strong className="text-white font-semibold">{room.room_name} ({room.location})</strong>
              </div>
              <div className="flex justify-between text-brand-lightgray">
                <span>Dates:</span>
                <strong className="text-white">{checkIn} to {checkOut} ({nights} nights)</strong>
              </div>
              <div className="flex justify-between text-brand-lightgray">
                <span>Booking Reference:</span>
                <strong className="text-white font-mono">{createdBooking.referenceNumber}</strong>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                <span className="font-bold text-white">Total Payment Due:</span>
                <span className="font-black text-white text-xl">₱{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR Ph')}
                  className={`p-5 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                    paymentMethod === 'QR Ph'
                      ? 'liquid-btn-primary shadow-lg scale-105'
                      : 'liquid-glass text-white hover:border-white/50'
                  }`}
                >
                  <QrCode className="w-8 h-8" />
                  <span className="font-bold text-xs uppercase tracking-wider">QR Ph</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Dragonpay')}
                  className={`p-5 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                    paymentMethod === 'Dragonpay'
                      ? 'liquid-btn-primary shadow-lg scale-105'
                      : 'liquid-glass text-white hover:border-white/50'
                  }`}
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="font-bold text-xs uppercase tracking-wider">Dragonpay</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="liquid-btn px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Back
              </button>

              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handlePayAndConfirm}
                className="liquid-btn-primary px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2"
              >
                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Authorize & Complete Payment</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMED RESERVATION */}
        {step === 4 && confirmedBooking && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black shadow-2xl mb-2">
              <Sparkles className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-white uppercase tracking-wider">Reservation Confirmed!</h4>
              <p className="text-xs text-brand-lightgray mt-1">
                Confirmation sent to <strong className="text-white">{confirmedBooking.email}</strong>. Operational sync logged.
              </p>
            </div>

            <div className="bg-white text-black p-6 rounded-3xl max-w-sm mx-auto shadow-2xl space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block">CG CHILLCATION DIGITAL PASS</span>
                <span className="text-lg font-black text-black font-mono">{confirmedBooking.reference_number}</span>
              </div>

              {qrCodeDataUrl && (
                <div className="flex justify-center py-2">
                  <img src={qrCodeDataUrl} alt="QR Confirmation Pass" className="w-48 h-48 border border-zinc-200 rounded-2xl p-2 bg-white shadow-md" />
                </div>
              )}

              <div className="text-left text-xs space-y-1 text-zinc-700 bg-zinc-100 p-3 rounded-xl">
                <p><strong>Guest:</strong> {confirmedBooking.guest_name}</p>
                <p><strong>Suite:</strong> {confirmedBooking.room_name} ({confirmedBooking.location})</p>
                <p><strong>Check-in:</strong> {confirmedBooking.check_in}</p>
                <p><strong>Check-out:</strong> {confirmedBooking.check_out}</p>
              </div>

              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`CG_Chillcation_Pass_${confirmedBooking.reference_number}.png`}
                  className="w-full py-3 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Digital Pass</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="liquid-btn px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider"
            >
              Done & Return to Suites
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
