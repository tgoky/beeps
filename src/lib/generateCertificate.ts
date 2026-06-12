import { jsPDF } from "jspdf";

// Define strict types so your compiler catches errors
interface CertificateAgreement {
  id: string;
  createdAt: string | Date;
  licenseType: string;
  amountPaid: number | string;
  publishingSplit: number;
  masterSplit: number;
  licensedFileHash: string;
  transactionHash: string;
}

interface CertificateBeat {
  title: string;
}

export function generateLicenseCertificate(
  agreement: CertificateAgreement, 
  beat: CertificateBeat, 
  buyerName: string, 
  producerName: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // 1. Draw a Premium Outer Border
  doc.setDrawColor(16, 185, 129); // Emerald Green
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Outer border
  doc.setLineWidth(0.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24); // Inner fine border
  
  // 2. Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text("BEEPS OFFICIAL LICENSE AGREEMENT", pageWidth / 2, 30, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Document ID: ${agreement.id}`, pageWidth / 2, 38, { align: "center" });
  
  // Header Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, 45, pageWidth - 20, 45);

  // 3. Body Text Preparation
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  
  const date = new Date(agreement.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  // Clean up license string (e.g., "TRACKOUT_LEASE" -> "Trackout Lease")
  const formattedLicense = agreement.licenseType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  const contractText = `This document serves as a legally binding agreement generated on ${date}.

Producer: ${producerName}
Licensee (Buyer): ${buyerName}

Instrumental Title: "${beat.title}"
License Type: ${formattedLicense}
Amount Paid: $${Number(agreement.amountPaid).toFixed(2)}

TERMS OF AGREEMENT:
Upon the execution of this transaction, the Producer grants the Licensee the rights associated with the ${formattedLicense} tier. 

Publishing Split: ${agreement.publishingSplit}% Producer / ${100 - Number(agreement.publishingSplit)}% Licensee
Master Rights: ${agreement.masterSplit}% Licensee

${agreement.licenseType === 'EXCLUSIVE' ? 
"EXCLUSIVE RIGHTS: The Producer hereby transfers 100% of the Master Recording rights to the Licensee. The Producer explicitly agrees not to resell, lease, or distribute this instrumental to any other party. This audio has been algorithmically fingerprinted and securely locked in the Beeps Exclusive Vault." : 
"NON-EXCLUSIVE RIGHTS: The Producer retains the right to lease this instrumental to other parties. The Licensee is granted non-exclusive usage rights as defined by the Beeps marketplace terms."}`;

  // 4. Dynamic Text Wrapping (Prevents overlapping)
  const margin = 20;
  const startY = 55;
  const splitText = doc.splitTextToSize(contractText, pageWidth - (margin * 2));
  
  // Print the body text
  doc.text(splitText, margin, startY);

  // Calculate exactly where the text ended so we can draw the next section below it
  // approx 5 units of height per line of text
  const textHeight = splitText.length * 5.5; 
  const bottomSectionY = startY + textHeight + 20;

  // 5. The "God Tier" Cryptographic Anchor (Dynamically Placed)
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(margin, bottomSectionY, pageWidth - margin, bottomSectionY);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text("CRYPTOGRAPHIC VERIFICATION", margin, bottomSectionY + 10);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("This transaction is mathematically anchored and verified by Beeps audio fingerprinting.", margin, bottomSectionY + 16);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`File Hash (SHA-256):`, margin, bottomSectionY + 26);
  
  doc.setFont("courier", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${agreement.licensedFileHash}`, margin, bottomSectionY + 31);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(`Transaction Anchor Hash:`, margin, bottomSectionY + 41);
  
  doc.setFont("courier", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${agreement.transactionHash}`, margin, bottomSectionY + 46);

  // Digital Signature Stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`SECURED VIA BEEPS.COM • ${date.toUpperCase()}`, pageWidth / 2, pageHeight - 15, { align: "center" });

  // 6. Save the PDF
  const safeTitle = beat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Beeps_License_${safeTitle}.pdf`);
}