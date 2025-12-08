import React from 'react';
import { jsPDF } from "jspdf";
import { FileText, Download, Code, BookOpen } from 'lucide-react';

const Help: React.FC = () => {

  const generateITSpec = () => {
    const doc = new jsPDF();
    let y = 15;
    const lineHeight = 7;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    const addHeading = (text: string, size = 16) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, y);
      y += lineHeight * 1.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    const addText = (text: string) => {
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, y);
      y += (splitText.length * 5) + 3;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    };

    const addCodeBlock = (text: string) => {
        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(text, contentWidth - 10);
        
        doc.setDrawColor(220);
        doc.setFillColor(245);
        doc.rect(margin, y - 4, contentWidth, (splitText.length * 4) + 8, 'F');
        
        doc.text(splitText, margin + 5, y);
        y += (splitText.length * 4) + 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0);
        if (y > 270) {
            doc.addPage();
            y = 15;
        }
    };

    addHeading("SaadPOS Sim - Technical Change Request & Specification", 20);
    
    addHeading("1. Project Overview");
    addText("This document defines the functional and technical requirements to rebuild 'SaadPOS Sim', a Pharmacy Point of Sale system with advanced coupon management, barcode generation, and line-item reporting. The target system must simulate a real-world environment for testing offers.");

    addHeading("2. Core Logic & Validation Rules");
    addText("The system requires a client-side Calculation Engine that handles the following Logic Gates before applying any discount:");
    
    addHeading("2.1 Coupon Validation Gate", 12);
    addText("- Existence: Code must match active database entry (Case Insensitive).");
    addText("- Redeemed Status: If 'redeemed' flag is TRUE, reject with error 'COUPON WAS REDEEMED'.");
    addText("- Date Validity: Current Date must be >= Start Date AND <= End Date.");
    addText("- Combinability: If transaction has an existing coupon, check 'isCombinable' flag on both.");
    addText("- Item Linking: If 'applicableItemIds' is not empty, cart MUST contain at least one linked item.");
    addText("- Bundle Trigger: If 'requiredItemIds' is not empty, cart MUST contain linked trigger items.");
    
    addHeading("2.2 Discount Algorithms", 12);
    addText("The engine must support the following enum types:");
    addCodeBlock(`enum DiscountType {
  PERCENTAGE = 'PERCENTAGE', // % off linked items
  FIXED_AMOUNT = 'FIXED_AMOUNT', // Fixed $ off subtotal
  BOGO = 'BOGO', // Buy X Get Y Free (Cheapest items free)
  BUNDLE_PERCENTAGE = 'BUNDLE_PERCENTAGE', // Buy Trigger, Get Reward @ % off
  BUNDLE_FIXED = 'BUNDLE_FIXED' // Buy Trigger, Get Reward @ $ off
}`);

    addHeading("3. Data Models (JSON Structure)");
    addText("The database must support these exact schemas to ensure report compatibility.");

    addHeading("3.1 Transaction Snapshot Strategy", 12);
    addText("CRITICAL: When a transaction is saved, the coupon data must be SNAPSHOTTED into the transaction record. Do not reference the coupon table by ID, as the coupon config may change later. The report must read from the transaction snapshot.");
    
    addCodeBlock(`interface Transaction {
  id: string;
  date: ISOString;
  items: CartItem[]; // Copy of items at time of sale
  pharmacistId: string; // Session input
  branchName: string; // Session input
  couponDetails?: {
    code: string;
    description: string;
    vendorName: string; // e.g. "Kimberly-Clark"
    compensationType: string; // e.g. "MANUFACTURER_REIMBURSEMENT"
    discountType: DiscountType;
    value: number;
    applicableItemIds: string[]; // List of SKUs discount applied to
  };
}`);

    addHeading("4. Reporting Requirements");
    addText("The system must generate a 'Line Item Report' CSV. This flattens the parent-child relationship between Invoice and Items.");
    addCodeBlock(`CSV Headers:
Invoice #, Date, Branch, Pharmacist, Coupon Code, Coupon Desc, 
Vendor, Compensation, SKU, Item Name, Qty, Unit Price, 
Gross Amount, Discount Amount (Calculated per item), Net Amount`);
    
    addHeading("5. Barcode & Hardware Specs");
    addText("- Barcode Standard: Code 39 (Alpha-numeric support).");
    addText("- Generator: Client-side SVG/Canvas. No external API dependency.");
    addText("- Requirement: Must include Start/Stop characters (*) and Quiet Zones.");
    addText("- Scannability: Must be readable by standard 1D Laser scanners.");

    doc.save("SaadPOS_IT_Specification.pdf");
  };

  const generateUserManual = () => {
    const doc = new jsPDF();
    let y = 15;
    const lineHeight = 7;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    const addHeading = (text: string, size = 16) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74); // Green color
      doc.text(text, margin, y);
      y += lineHeight * 1.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
    };

    const addText = (text: string) => {
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, y);
      y += (splitText.length * 5) + 3;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    };

    const addStep = (text: string) => {
        doc.text(`• ${text}`, margin + 5, y);
        y += 6;
    };

    addHeading("SaadPOS Sim - User Operation Manual", 22);
    
    addText("Welcome to SaadPOS. This manual guides you through managing inventory, configuring offers, and processing sales.");

    addHeading("1. Inventory Management");
    addText("To add products to the system:");
    addStep("Navigate to the 'Inventory' tab.");
    addStep("Click 'Import CSV'.");
    addStep("Ensure your CSV has headers: sku, name, price, category, stock, brand.");
    addStep("You can also search for items by Brand (e.g., 'Huggies') or SKU.");

    addHeading("2. Creating Coupons & Offers");
    
    addHeading("2.1 Creating a 'Buy 2 Get 1 Free' (BOGO) Deal", 12);
    addStep("Go to 'Coupons'.");
    addStep("Enter a Code (e.g., HUGGIES_BOGO) or click the Shuffle icon.");
    addStep("Set Discount Logic to 'Buy X Get Y Free (BOGO)'.");
    addStep("Enter Buy Qty = 2, Get Free = 1.");
    addStep("Scroll to 'Applicable Items'. Select the 'Huggies' Brand to link all diapers.");
    addStep("Set Vendor Name to 'Kimberly-Clark' (for reporting).");
    addStep("Click 'Create Coupon'.");

    addHeading("2.2 Creating a Bundle (Buy Item A, Get Item B 50% Off)", 12);
    addStep("Set Discount Logic to 'Bundle (Buy A, Get B at % Off)'.");
    addStep("Set Value to 50.");
    addStep("In 'Required Items (Trigger)', select the item the customer MUST buy.");
    addStep("In 'Applicable Items (Reward)', select the item that gets the discount.");
    addStep("Click 'Create Coupon'.");

    addHeading("3. POS Terminal Operation");
    addStep("Enter 'Pharmacist ID' and 'Branch Name' in the top-right Session panel.");
    addStep("Scan items or search by name to add to cart.");
    addStep("Enter the Coupon Code in the bottom box and click 'Apply'.");
    addStep("If the coupon is valid, the discount will appear in Green.");
    addStep("Click 'CASH' or 'CARD' to finish. The coupon is now marked as 'Redeemed' and cannot be used again.");

    addHeading("4. Reports");
    addStep("Go to the 'Reports' tab.");
    addStep("View the detailed line-item table on screen.");
    addStep("Click 'Download CSV Report' to get an Excel-compatible file.");
    addStep("The report includes: Vendor Name, Compensation Type, and Net Amount per item.");

    doc.save("SaadPOS_User_Manual.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Help & Documentation</h1>
        <p className="text-slate-500 mt-2">
            Download technical specifications for IT implementation or user manuals for staff training.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IT Spec Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Code size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">IT Technical Specification</h2>
            <p className="text-slate-600 text-sm mb-6 min-h-[60px]">
                Detailed logic requirements, JSON data models, validation rules, and algorithm definitions for the Development Team.
            </p>
            <button 
                onClick={generateITSpec}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <Download size={20} /> Download Spec PDF
            </button>
        </div>

        {/* User Manual Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">User Operation Manual</h2>
            <p className="text-slate-600 text-sm mb-6 min-h-[60px]">
                Step-by-step guide for Pharmacists and Managers on how to configure complex coupons, operate the POS, and generate reports.
            </p>
            <button 
                onClick={generateUserManual}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
                <Download size={20} /> Download Manual PDF
            </button>
        </div>
      </div>

      <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FileText size={18} /> About this Documentation
        </h3>
        <p className="text-sm text-slate-600">
            These documents are generated dynamically based on the current version (v1.1.0) of the SaadPOS Simulator logic. 
            The IT Specification includes exact TypeScript interfaces used in the source code to ensure 1:1 replication capability.
        </p>
      </div>
    </div>
  );
};

export default Help;