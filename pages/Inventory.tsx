import React, { useContext, useState } from 'react';
import { StoreContext } from '../App';
import { Upload, FileText, Search, Plus, Trash2 } from 'lucide-react';
import { Item } from '../types';

const Inventory: React.FC = () => {
  const { items, setItems, importItemsFromCSV } = useContext(StoreContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importItemsFromCSV(content);
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this item?')) {
        setItems(prev => prev.filter(i => i.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Manage pharmacy products and stock.</p>
        </div>
        
        <div className="flex gap-2">
           <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm">
            <Upload size={18} />
            <span>Import CSV</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search items by name, SKU or Brand..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-semibold text-slate-600 text-sm">SKU</th>
                <th className="p-3 font-semibold text-slate-600 text-sm">Brand</th>
                <th className="p-3 font-semibold text-slate-600 text-sm">Product Name</th>
                <th className="p-3 font-semibold text-slate-600 text-sm">Category</th>
                <th className="p-3 font-semibold text-slate-600 text-sm">Price</th>
                <th className="p-3 font-semibold text-slate-600 text-sm">Stock</th>
                <th className="p-3 font-semibold text-slate-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600 font-mono text-sm">{item.sku}</td>
                    <td className="p-3 text-slate-800 font-medium text-sm">{item.brand || '-'}</td>
                    <td className="p-3 font-medium text-slate-800">{item.name}</td>
                    <td className="p-3 text-slate-600 text-sm">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{item.category}</span>
                    </td>
                    <td className="p-3 text-slate-800 font-medium">${item.price.toFixed(2)}</td>
                    <td className="p-3 text-slate-600 text-sm">
                      <span className={`${item.stock < 20 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No items found. Try importing a CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
        <h3 className="font-semibold mb-1 flex items-center gap-2"><FileText size={16}/> CSV Format Guide</h3>
        <p>Your Excel/CSV file should have a header row with these columns: <code className="bg-white px-1 rounded">sku, name, price, category, stock, brand</code></p>
      </div>
    </div>
  );
};

export default Inventory;