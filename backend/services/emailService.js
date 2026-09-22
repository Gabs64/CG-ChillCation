/**
 * Mock Email Confirmation Service
 */
export const sendBookingConfirmationEmail = async ({ email, guestName, referenceNumber, roomName, checkIn, checkOut }) => {
  console.log(`[EMAIL DISPATCH] Confirmation email queued for ${email}`);
  console.log(`[EMAIL DISPATCH] Ref: ${referenceNumber} | Suite: ${roomName} | Dates: ${checkIn} to ${checkOut}`);

  return Promise.resolve({
    sent: true,
    recipient: email,
    referenceNumber,
    dispatchedAt: new Date().toISOString()
  });
};
