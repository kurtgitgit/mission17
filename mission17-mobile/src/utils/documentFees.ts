export function getDocumentPaymentNotice(documentType: string, customDocumentType = ''): string {
  const name = (documentType === 'Other' ? customDocumentType : documentType).trim().toLowerCase();
  const fee = name === 'barangay clearance' ? 20 : name === 'business clearance' ? 300 : 0;
  return fee > 0
    ? `Fee: ₱${fee}. Payment at Barangay Hall upon pickup.`
    : 'Free — no payment required.';
}
