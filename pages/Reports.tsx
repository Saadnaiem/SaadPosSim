import React, { useContext, useMemo } from 'react';
import { StoreContext } from '../App';
import { FileSpreadsheet, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const Reports: React.FC = () => {
  const { transactions } = useContext(StoreContext);

  const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
  const totalDiscounts = transactions.reduce((acc, t) => acc + t.discount, 0);
  const totalTransactions = transactions.length;

  // Flatten transactions into a list of line items with all details calculated
  const reportData = useMemo(() => {
    return transactions.flatMap(t => {
      const details = t.couponDetails;
      const vendorName = details?.vendorName || 'N/A';
      
      let compensationType = details?.compensationType || 'N/A';
      if (details?.compensationType === 'PARTNERSHIP') {
          compensationType = `PARTNERSHIP (${details.partnershipVendorPercent}% V / ${details.partnershipMepPercent}% M)`;
      }

      const couponDescription = details?.description || '-';
      
      let eligibleItemsTotal = 0;
      let eligibleItemIds: string[] = [];
      
      if (t.discount > 0 && details) {
        const applicableIds = details.applicableItemIds || [];
        if (applicableIds.length > 0) {
            eligibleItemIds = applicableIds;
            eligibleItemsTotal = t.items
                .filter(i => applicableIds.includes(i.id))
                .reduce((sum, i) => sum + (i.price * i.quantity), 0);
        } else {
            eligibleItemsTotal = t.subtotal;
        }
      }

      return t.items.map(item => {
        const itemGross = item.price * item.quantity;
        let itemDiscount = 0;

        if (t.discount > 0 && eligibleItemsTotal > 0) {
           const isEligible = eligibleItemIds.length === 0 || eligibleItemIds.includes(item.id);
           if (isEligible) {
             itemDiscount = (itemGross / eligibleItemsTotal) * t.discount;
           }
        }

        const netAmount = itemGross - itemDiscount;

        return {
          invoiceId: t.id,
          date: new Date(t.date).toLocaleString(),
          paymentMethod: t.paymentMethod,
          pharmacistId: t.pharmacistId || 'N/A',
          branchName: t.branchName || 'N/A',
          couponCode: t.couponCode || '-',
          couponDescription: couponDescription,
          vendorName: t.discount > 0 ? vendorName : '-',
          compensationType: t.discount > 0 ? compensationType : '-',
          sku: item.sku,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          grossAmount: itemGross,
          discountAmount: itemDiscount,
          netAmount: netAmount
        };
      });
    }).reverse(); // Most recent first
  }, [transactions]);

  const downloadCSV = () => {
    if (reportData.length === 0) return;

    const headers = [
      'Invoice Number', 
      'Date', 
      'Branch Name',
      'Pharmacist ID',
      'Payment Method', 
      'Coupon Code',
      'Coupon Description',
      'Vendor Name', 
      'Compensation Type', 
      'Item SKU', 
      'Item Name', 
      'Qty', 
      'Unit Price (Original)', 
      'Gross Amount', 
      'Discount Amount', 
      'Net Amount'
    ];

    const rows = reportData.map(row => [
      row.invoiceId,
      row.date,
      row.branchName,
      row.pharmacistId,
      row.paymentMethod,
      row.couponCode,
      row.couponDescription,
      row.vendorName,
      row.compensationType,
      row.sku,
      row.itemName,
      row.quantity.toString(),
      row.unitPrice.toFixed(2),
      row.grossAmount.toFixed(2),
      row.discountAmount.toFixed(2),
      row.netAmount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Reports</h1>
          <p className="text-slate-500">Detailed item-level breakdown of all transactions.</p>
        </div>
        <button 
          onClick={downloadCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={18} />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
               <DollarSign size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
               <h3 className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</h3>
             </div>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-red-50 rounded-lg text-red-600">
               <TrendingUp size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 font-medium">Total Discounts Given</p>
               <h3 className="text-2xl font-bold text-slate-800">${totalDiscounts.toFixed(2)}</h3>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
               <Calendar size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 font-medium">Total Transactions</p>
               <h3 className="text-2xl font-bold text-slate-800">{totalTransactions}</h3>
             </div>
           </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Detailed Line Item Report</h3>
          <span className="text-xs text-slate-500">Showing all items sold</span>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider">
                <th className="p-3 whitespace-nowrap">Invoice #</th>
                <th className="p-3 whitespace-nowrap">Date</th>
                <th className="p-3 whitespace-nowrap">Branch</th>
                <th className="p-3 whitespace-nowrap">Pharmacist</th>
                <th className="p-3 whitespace-nowrap">Coupon Code</th>
                <th className="p-3 whitespace-nowrap">Coupon Desc</th>
                <th className="p-3 whitespace-nowrap">Vendor</th>
                <th className="p-3 whitespace-nowrap">Compensation</th>
                <th className="p-3 whitespace-nowrap">Item Name</th>
                <th className="p-3 text-right whitespace-nowrap">Qty</th>
                <th className="p-3 text-right whitespace-nowrap">Unit Price</th>
                <th className="p-3 text-right whitespace-nowrap">Gross Amt</th>
                <th className="p-3 text-right whitespace-nowrap text-red-600">Discount</th>
                <th className="p-3 text-right whitespace-nowrap font-bold text-slate-800">Net Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.length > 0 ? (
                reportData.map((row, idx) => (
                  <tr key={`${row.invoiceId}-${idx}`} className="hover:bg-indigo-50/30 transition-colors text-sm text-slate-700">
                    <td className="p-3 font-mono text-xs text-slate-500">{row.invoiceId}</td>
                    <td className="p-3 whitespace-nowrap text-xs">{row.date}</td>
                    <td className="p-3 whitespace-nowrap">{row.branchName}</td>
                    <td className="p-3 whitespace-nowrap">{row.pharmacistId}</td>
                    <td className="p-3 font-medium whitespace-nowrap text-indigo-600">{row.couponCode}</td>
                    <td className="p-3 whitespace-nowrap max-w-xs truncate" title={row.couponDescription}>{row.couponDescription}</td>
                    <td className="p-3 whitespace-nowrap">{row.vendorName}</td>
                    <td className="p-3 whitespace-nowrap text-xs">{row.compensationType}</td>
                    <td className="p-3 font-medium max-w-xs truncate" title={row.itemName}>{row.itemName}</td>
                    <td className="p-3 text-right">{row.quantity}</td>
                    <td className="p-3 text-right">${row.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right">${row.grossAmount.toFixed(2)}</td>
                    <td className="p-3 text-right text-red-600">-${row.discountAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">${row.netAmount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="p-12 text-center text-slate-400">
                    No sales data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;