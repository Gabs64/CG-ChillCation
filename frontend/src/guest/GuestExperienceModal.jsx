import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle2, QrCode, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import QRCode from 'qrcode';
import CustomModal from '../shared/CustomModal';

export default function GuestExperienceModal({ onClose, prefillRoom = '', prefillName = '' }) {
  const [tab, setTab] = useState('submit'); // 'submit' or 'qr'
  const [guestName, setGuestName] = useState(prefillName);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [roomName, setRoomName] = useState(prefillRoom);
  const [stayDate, setStayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Generate QR Code directing to public guest experience submission page (Section 9)
  useEffect(() => {
    const experiencePageUrl = `${window.location.origin}/#guest-experiences-section`;
    QRCode.toDataURL(experiencePageUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(setQrCodeDataUrl).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName || !reviewText) {
      setErrorMessage('Please fill in your name and feedback message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/guest-experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          rating,
          reviewText,
          roomName: roomName || 'CG Chillcation Suite',
          stayDate,
          photoUrl: photoUrl || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit experience.');
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      setErrorMessage('Network error submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      title="Guest Experiences"
      subtitle="Share Your Staycation Story"
      icon={Star}
      size="xl"
      customHeader={
        <div className="flex items-center space-x-2 pr-8">
          <button
            onClick={() => setTab('submit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              tab === 'submit' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Leave a Review
          </button>
          <button
            onClick={() => setTab('qr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
              tab === 'qr' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Submission QR Code</span>
          </button>
        </div>
      }
    >
      {tab === 'qr' ? (
        /* QR Code Showcase (Section 9) */
        <div className="text-center py-4 space-y-4">
          <h3 className="text-lg font-black text-white">Guest Experience QR Code</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Scan this QR code with any mobile camera to directly open the CG Chillcation Guest Experience submission portal.
          </p>

          <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl border border-white/40">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Experience QR" className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-black">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              Safe & Private &bull; No sensitive booking data exposed
            </span>
          </div>
        </div>
      ) : isSubmitted ? (
        /* Submission Success State */
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Thank You for Your Feedback!</h3>
          <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
            Your Guest Experience has been received and submitted for Owner review. Approved stories will appear on our homepage.
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm mx-auto space-y-2 text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono block">Review Summary</span>
            <p className="text-xs font-bold text-white">{guestName} ({roomName})</p>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-300 italic">"{reviewText}"</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
            <a
              href="https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rate on Google Maps</span>
            </a>
            <button
              onClick={onClose}
              className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-white">Share Your Staycation Experience</h2>
            <p className="text-xs text-zinc-400">
              Help fellow travelers by sharing your honest feedback about your stay with CG Chillcation.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Star Rating Selector */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
              Overall Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                        : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono text-zinc-300 ml-2">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Guest Name & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Room / Suite
              </label>
              <input
                type="text"
                placeholder="e.g. Room 01 Antipolo"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Stay Date & Optional Photo URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Stay Date
              </label>
              <input
                type="date"
                value={stayDate}
                onChange={(e) => setStayDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Review Text Message */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Your Review & Message *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell us what you enjoyed most about your suite, check-in, cleanliness, or location..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              Status will be set to PENDING for Owner review
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="liquid-btn-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Experience</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </CustomModal>
  );
}
