function whatsappConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

function formatMessage(booking, payment) {
  return [
    `Hello ${booking.customerName},`,
    "",
    "Your vehicle booking has been successfully confirmed!",
    "",
    "BOOKING DETAILS",
    `Booking ID: ${booking.bookingReference}`,
    `Customer Name: ${booking.customerName}`,
    `Phone Number: ${booking.customerPhone}`,
    `Vehicle: ${booking.vehicleName}`,
    `Pickup Hub: ${booking.pickupLocation}`,
    `Pickup Date: ${booking.pickupDateTime.toISOString().slice(0, 10)}`,
    `Pickup Time: ${booking.pickupDateTime.toISOString().slice(11, 16)}`,
    `Return Date: ${booking.returnDateTime.toISOString().slice(0, 10)}`,
    `Return Time: ${booking.returnDateTime.toISOString().slice(11, 16)}`,
    "",
    "PAYMENT DETAILS",
    `Total Booking Amount: ₹${booking.totalAmount}`,
    `Advance Paid: ₹${payment.amount}`,
    `Remaining Balance: ₹${booking.remainingAmount}`,
    `Payment Status: ${booking.paymentStatus}`,
    "",
    "Thank you for choosing our service!",
    "We look forward to serving you.",
  ].join("\n");
}

async function sendWhatsAppConfirmation(booking, payment) {
  const config = whatsappConfig();
  if (!config) return { status: "not_configured", error: "WhatsApp credentials are not configured." };

  const recipient = booking.customerPhone.replace(/\D/g, "");
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [{
            type: "body",
            parameters: [
              booking.customerName,
              booking.bookingReference,
              booking.vehicleName,
              booking.pickupLocation,
              booking.pickupDateTime.toISOString().slice(0, 10),
              booking.returnDateTime.toISOString().slice(0, 10),
              String(booking.totalAmount),
              String(payment.amount),
              String(booking.remainingAmount),
              booking.paymentStatus,
            ].map((text) => ({ type: "text", text: String(text) })),
          }],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: formatMessage(booking, payment) },
      };

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(config.phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || "WhatsApp API request failed.");
  }
  return { status: "sent", messageId: body?.messages?.[0]?.id || "" };
}

export { sendWhatsAppConfirmation };
