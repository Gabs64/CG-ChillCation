import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, Mail, Car, ShieldCheck, CreditCard, QrCode, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Loader2, Download, Sparkles, Plus, Minus, FileText, Check, ShieldAlert } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import CustomModal from '../shared/CustomModal';

export default function BookingModal({ room, onClose }) {
  // 6-Step Booking Flow as defined by FSD v2.0 Section 56
  // Step 1: Dates & Availability
  // Step 2: Select Inclusions
  // Step 3: Guest Details Form
  // Step 4: Rules & Policies Acknowledgement
  // Step 5: Payment Page & Breakdown (Reference Number)
  // Step 6: Booking Confirmation & QR Code
  const [step, setStep] = useState(1);

  // Step 1: Dates
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);

  // Step 2: Inclusions
  const [availableInclusions, setAvailableInclusions] = useState([]);
  const [selectedInclusions, setSelectedInclusions] = useState({}); // { [id]: quantity }
  const [isLoadingInclusions, setIsLoadingInclusions] = useState(false);

  // Step 3: Guest Details Form
  const [guestName, setGuestName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('None');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [age, setAge] = useState('');

  // Step 4: Policies
  const [policies, setPolicies] = useState([]);
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);

  // Step 5: Payment & Breakdown
  const [securityDepositAmount, setSecurityDepositAmount] = useState(1000);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('QR Ph');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Step 6: Confirmation
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [checkinQrUrl, setCheckinQrUrl] = useState('');
  const [experienceQrUrl, setExperienceQrUrl] = useState('');

  // General State
  const [formError, setFormError] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Initialize Dates & Settings
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);

    // Load available payment methods from room
    if (room && room.payment_methods && room.payment_methods.length > 0) {
      setAvailablePaymentMethods(room.payment_methods);
      setSelectedPaymentMethod(room.payment_methods[0]);
    } else {
      setAvailablePaymentMethods(['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
      setSelectedPaymentMethod('QR Ph');
    }

    // Fetch Inclusions and Policies in background
    fetchInclusions();
    fetchPolicies();
  }, [room]);

  const fetchInclusions = async () => {
    setIsLoadingInclusions(true);
    try {
      const res = await fetch('/api/inclusions');
      const data = await res.json();
      if (data.inclusions) {
        setAvailableInclusions(data.inclusions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingInclusions(false);
    }
  };

  const fetchPolicies = async () => {
    setIsLoadingPolicies(true);
    try {
      const res = await fetch('/api/policies');
      const data = await res.json();
      if (data.policies) {
        setPolicies(data.policies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  // Calculations
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime()) || dOut <= dIn) return 0;
    return Math.ceil((dOut - dIn) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const roomRate = Number(room?.price_per_night || 2500);
  const roomSubtotal = roomRate * (nights > 0 ? nights : 1);

  // Calculate Inclusions subtotal
  const inclusionsSubtotal = Object.entries(selectedInclusions).reduce((sum, [incId, qty]) => {
    const inc = availableInclusions.find((i) => i.id === Number(incId));
    return sum + (inc ? inc.price * qty : 0);
  }, 0);

  const totalAmount = roomSubtotal + inclusionsSubtotal + securityDepositAmount;
  const downPayment = Math.round(totalAmount * 0.5);
  const remainingBalance = totalAmount - downPayment;

  // Handlers for Inclusions
  const handleToggleInclusion = (incId) => {
    setSelectedInclusions((prev) => {
      const copy = { ...prev };
      if (copy[incId]) {
        delete copy[incId];
      } else {
        copy[incId] = 1;
      }
      return copy;
    });
  };

  const handleUpdateInclusionQty = (incId, delta) => {
    setSelectedInclusions((prev) => {
      const current = prev[incId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[incId];
        return copy;
      }
      return { ...prev, [incId]: next };
    });
  };

  // Availability Check
  const handleCheckAvailability = async () => {
    setFormError(null);
    setAvailabilityMessage(null);

    if (nights <= 0) {
      setFormError('Check-out date must be at least 1 day after check-in date.');
      return false;
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
        return false;
      } else if (data.isAvailable) {
        setIsAvailable(true);
        setAvailabilityMessage('Room is AVAILABLE for selected dates!');
        return true;
      } else {
        setIsAvailable(false);
        setFormError('Selected room is NOT AVAILABLE for these dates. Please choose another date range.');
        return false;
      }
    } catch (err) {
      setFormError('Network error checking room availability.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleProceedFromStep1 = async () => {
    const isAvail = await handleCheckAvailability();
    if (isAvail) {
      setStep(2);
    }
  };

  // Step 3 Validation -> Proceed to Step 4
  const handleProceedFromStep3 = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!guestName || !contactNumber || !email || age === '') {
      setFormError('Please fill in all required guest information fields.');
      return;
    }

    if (Number(age) < 18) {
      setFormError('Booking unavailable. The primary guest must be 18 years old or above.');
      return;
    }

    setStep(4);
  };

  // Step 4 Validation -> Create Booking in Database -> Proceed to Step 5 (Payment)
  const handleProceedToPayment = async () => {
    if (!policyAcknowledged) {
      setFormError('You must acknowledge and accept the Rules and Policies to proceed to payment.');
      return;
    }

    setFormError(null);
    setIsSubmittingBooking(true);

    try {
      const selectedInclusionsList = Object.entries(selectedInclusions).map(([id, quantity]) => ({
        id: Number(id),
        quantity
      }));

      const finalVehicle = vehicle === 'None' ? 'None' : `${vehicle} ${vehiclePlate ? `(${vehiclePlate})` : ''}`;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          guestName,
          guestCount: Number(guestCount),
          contactNumber,
          email,
          vehicle: finalVehicle,
          age: Number(age),
          checkIn,
          checkOut,
          selectedInclusions: selectedInclusionsList,
          policyAcknowledged: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to initialize booking.');
      } else {
        setCreatedBooking(data.booking);
        setStep(5);
      }
    } catch (err) {
      setFormError('Network error initializing booking record.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Step 5: Process Payment & Reference Number Confirmation
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!paymentReferenceNumber || paymentReferenceNumber.trim().length < 4) {
      setFormError('Please enter a valid Payment Reference Number (from your receipt / screenshot).');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const bookingId = createdBooking?.id;
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
          paymentReference: paymentReferenceNumber.trim(),
          amount: downPayment
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Payment confirmation failed.');
      } else {
        setConfirmedBooking(data.booking);

        // Generate dynamic check-in QR Code
        const checkinQr = await QRCode.toDataURL(data.booking.reference_number, {
          width: 260,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setCheckinQrUrl(checkinQr);

        // Generate Guest Experience QR Code (Section 9)
        const expQr = await QRCode.toDataURL(`${window.location.origin}/#guest-experiences-section`, {
          width: 260,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setExperienceQrUrl(expQr);

        // Celebrate success
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        setStep(6);
      }
    } catch (err) {
      setFormError('Network error processing payment confirmation.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      size="3xl"
      customHeader={
        <div>
          <div className="flex items-center justify-between mb-2 pr-8">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block">
                Booking Step {step} of 6
              </span>
              <h2 className="text-xl font-black text-white">
                {step === 1 && 'Select Dates & Availability'}
                {step === 2 && 'Custom Inclusions & Add-ons'}
                {step === 3 && 'Primary Guest Information'}
                {step === 4 && 'Rules & House Policies'}
                {step === 5 && 'Payment & Financial Breakdown'}
                {step === 6 && 'Booking Confirmed!'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/15">
              {room?.room_name} &bull; {room?.location}
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-white shadow-sm shadow-white/50'
                    : s < step
                    ? 'bg-emerald-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      }
    >
      {/* Form Error Banner */}
      {formError && (
        <div className="p-3.5 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-1">

          {/* ================= STEP 1: DATES & AVAILABILITY ================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Check-in Date (From 2:00 PM)
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      setIsAvailable(false);
                      setAvailabilityMessage(null);
                    }}
                    className="w-full h-12 px-4 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Check-out Date (Until 12:00 PM)
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      setIsAvailable(false);
                      setAvailabilityMessage(null);
                    }}
                    className="w-full h-12 px-4 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Total Guests (Max standard 2 adults + children)
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests (Standard)</option>
                  <option value={3}>3 Guests (Requires Extra Mattress Inclusion)</option>
                  <option value={4}>4 Guests (Maximum Suite Capacity)</option>
                </select>
              </div>

              {/* Real-time Availability Alert */}
              {availabilityMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{availabilityMessage} ({nights} {nights === 1 ? 'night' : 'nights'} stay)</span>
                </div>
              )}

              {/* Price Estimation */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Room Subtotal</span>
                  <span className="text-xs text-zinc-300">₱{roomRate.toLocaleString()} &times; {nights > 0 ? nights : 1} nights</span>
                </div>
                <span className="text-xl font-black text-white font-mono">₱{roomSubtotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SELECT INCLUSIONS ================= */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300">
                Enhance your stay with optional parking slots, bedding kits, or dining packages configured by the property owner.
              </p>

              {isLoadingInclusions ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                </div>
              ) : availableInclusions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No additional inclusions available for this room.</p>
              ) : (
                <div className="space-y-2.5">
                  {availableInclusions.map((inc) => {
                    const isSelected = Boolean(selectedInclusions[inc.id]);
                    const qty = selectedInclusions[inc.id] || 1;

                    return (
                      <div
                        key={inc.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white/10 border-white/30 shadow-md'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3 cursor-pointer" onClick={() => handleToggleInclusion(inc.id)}>
                          <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-white text-black border-white' : 'border-white/30 bg-black/40'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">{inc.name}</span>
                            <span className="text-xs text-zinc-400 line-clamp-1">{inc.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 self-end sm:self-auto">
                          <span className="text-sm font-black text-white font-mono">
                            ₱{Number(inc.price).toLocaleString()}
                          </span>

                          {isSelected && (
                            <div className="flex items-center space-x-2 bg-black/60 px-2 py-1 rounded-xl border border-white/15">
                              <button
                                type="button"
                                onClick={() => handleUpdateInclusionQty(inc.id, -1)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-bold text-white px-1">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateInclusionQty(inc.id, 1)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inclusions Total Bar */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-mono uppercase tracking-wider">Inclusions Subtotal</span>
                <span className="text-base font-black text-white font-mono">₱{inclusionsSubtotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: GUEST DETAILS FORM ================= */}
          {step === 3 && (
            <form id="step3-form" onSubmit={handleProceedFromStep3} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                    Primary Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                    Age (Must be 18+ to book) *
                  </label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={120}
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                    Contact Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 123 4567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                    Email Address *
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

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
                  >
                    <option value="None">No Vehicle (Commute / Grab)</option>
                    <option value="Car">Car / Sedan / SUV</option>
                    <option value="Motorcycle">Motorcycle / Scooter</option>
                  </select>
                </div>

                {vehicle !== 'None' && (
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Plate Number / Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="ABC 1234 / Vios"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono uppercase"
                    />
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ================= STEP 4: RULES & POLICIES (FSD v2.0 Section 15, 16) ================= */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-300">
                Please review the house rules and reservation policies configured for CG Chillcation before continuing to payment.
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto p-4 rounded-2xl bg-black/40 border border-white/10 no-scrollbar">
                {isLoadingPolicies ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
                ) : policies.length === 0 ? (
                  <p className="text-xs text-zinc-400">Standard property policies apply.</p>
                ) : (
                  policies.map((pol) => (
                    <div key={pol.id} className="pb-3 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{pol.title}</h4>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed pl-5 font-sans">
                        {pol.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Mandatory Policy Acknowledgement Checkbox (Section 15) */}
              <label className="flex items-start space-x-3 p-4 rounded-2xl bg-white/5 border border-white/15 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={policyAcknowledged}
                  onChange={(e) => setPolicyAcknowledged(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-black bg-black border-white/30 focus:ring-0 focus:outline-none"
                />
                <span className="text-xs text-zinc-200 font-bold leading-relaxed">
                  I have read, understood, and agree to the Rules and Policies of CG Chillcation. I acknowledge that failure to comply may result in forfeiture of the security deposit.
                </span>
              </label>
            </div>
          )}

          {/* ================= STEP 5: PAYMENT PAGE & BREAKDOWN (FSD v2.0 Section 10, 11, 12, 22, 30) ================= */}
          {step === 5 && (
            <div className="space-y-6">
              
              {/* Detailed Financial Breakdown Table (Section 12, 43) */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/15 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                    Payment Breakdown Snapshot
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Ref: {createdBooking?.referenceNumber || 'Pending'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Room Row */}
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-white block">{room?.room_name} ({room?.location})</span>
                      <span className="text-zinc-400 font-mono">₱{roomRate.toLocaleString()} &times; {nights} {nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <span className="font-mono font-bold text-white">₱{roomSubtotal.toLocaleString()}</span>
                  </div>

                  {/* Inclusions Line Items */}
                  {Object.entries(selectedInclusions).map(([id, qty]) => {
                    const inc = availableInclusions.find((i) => i.id === Number(id));
                    if (!inc) return null;
                    return (
                      <div key={id} className="flex justify-between text-zinc-300">
                        <span>{inc.name} ({qty}x)</span>
                        <span className="font-mono">₱{(inc.price * qty).toLocaleString()}</span>
                      </div>
                    );
                  })}

                  {/* Refundable Security Deposit Row (Section 30) */}
                  <div className="flex justify-between text-emerald-400 pt-1">
                    <div className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Refundable Security Deposit</span>
                    </div>
                    <span className="font-mono font-bold">₱{securityDepositAmount.toLocaleString()}</span>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-3 border-t border-white/10 flex justify-between font-black text-sm text-white">
                    <span>Total Reservation Amount</span>
                    <span className="text-base font-mono">₱{totalAmount.toLocaleString()}</span>
                  </div>

                  {/* Down Payment Required (50%) & Balance */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono block">Required Down Payment</span>
                      <span className="text-base font-black text-emerald-400 font-mono">₱{downPayment.toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono block">Balance at Check-in</span>
                      <span className="text-base font-black text-white font-mono">₱{remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room-Specific Payment Methods (Section 22) */}
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                  Select Room Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availablePaymentMethods.map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        selectedPaymentMethod === pm
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-black/40 text-zinc-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Reference Number Input (Section 11) */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white block">
                  Payment Reference Number *
                </label>
                <p className="text-[11px] text-zinc-400">
                  Please complete the payment of ₱{downPayment.toLocaleString()} via {selectedPaymentMethod} and input your transaction confirmation code.
                </p>
                <input
                  type="text"
                  required
                  placeholder="e.g. QRPH-882194 or GCASH-991240"
                  value={paymentReferenceNumber}
                  onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-black/80 border border-white/20 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/50 font-mono tracking-wider uppercase"
                />
              </div>

            </div>
          )}

          {/* ================= STEP 6: CONFIRMATION & QR CODES (Section 9, 34, 56) ================= */}
          {step === 6 && (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Your Stay is Confirmed!</h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Booking Reference: <span className="text-white font-bold">{confirmedBooking?.reference_number}</span>
                </p>
              </div>

              {/* QR Passes Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {/* 1. Check-in Pass QR */}
                <div className="p-4 bg-white rounded-2xl text-black space-y-2 shadow-2xl">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider block text-black">
                    Check-in QR Pass
                  </span>
                  {checkinQrUrl && (
                    <img src={checkinQrUrl} alt="Checkin QR" className="w-40 h-40 mx-auto" />
                  )}
                  <span className="text-[10px] text-zinc-700 font-bold block">
                    Scan upon arrival at reception
                  </span>
                </div>

                {/* 2. Guest Experience Submission QR (Section 9) */}
                <div className="p-4 bg-zinc-900 border border-white/20 rounded-2xl text-white space-y-2 shadow-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-black uppercase tracking-wider block text-amber-400">
                      Guest Experience QR
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Scan anytime during or after your stay to leave a verified review.
                    </p>
                  </div>
                  {experienceQrUrl && (
                    <img src={experienceQrUrl} alt="Experience QR" className="w-32 h-32 mx-auto rounded-lg bg-white p-1" />
                  )}
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    CG Chillcation Review Portal
                  </span>
                </div>
              </div>

              {/* Confirmation Details Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xl mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Primary Guest:</span>
                  <span className="text-white font-bold">{confirmedBooking?.guest_name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Suite & Location:</span>
                  <span className="text-white font-bold">{confirmedBooking?.room_name} ({confirmedBooking?.location})</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Dates:</span>
                  <span className="text-white font-mono">{confirmedBooking?.check_in} &rarr; {confirmedBooking?.check_out}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Down Payment Paid:</span>
                  <span className="text-emerald-400 font-mono font-bold">₱{Number(confirmedBooking?.amount || downPayment).toLocaleString()} ({selectedPaymentMethod})</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Security Deposit:</span>
                  <span className="text-amber-400 font-mono font-bold">₱1,000 (Refundable upon checkout)</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Controls Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleProceedFromStep1}
              disabled={isCheckingAvailability}
              className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              {isCheckingAvailability ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Select Inclusions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>Guest Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="submit"
              form="step3-form"
              className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>House Policies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!policyAcknowledged || isSubmittingBooking}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                policyAcknowledged
                  ? 'liquid-btn-primary shadow-lg'
                  : 'bg-white/10 text-zinc-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isSubmittingBooking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Payment...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Reference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Payment Reference</span>
                </>
              )}
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={onClose}
              className="liquid-btn-primary px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Done & Close
            </button>
          )}
        </div>
    </CustomModal>
  );
}
