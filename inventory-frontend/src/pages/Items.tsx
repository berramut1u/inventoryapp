// src/pages/Items.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import { Pencil, Trash, ArrowLeftRight, PlusCircle } from 'lucide-react';

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    reorderThreshold: number;
    type: string;
    addedDate: string;
    addedBy: string;
}

export default function Items() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [rawItems, setRawItems] = useState<InventoryItem[]>([]);

    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [showEditId, setShowEditId] = useState<number | null>(null);
    const [showMoveId, setShowMoveId] = useState<number | null>(null);

    // Forms
    const [addForm, setAddForm] = useState({ name: '', quantity: 1, type: '', reorderThreshold: 0 });
    const [editForm, setEditForm] = useState(addForm);
    const [moveForm, setMoveForm] = useState({ amount: 1, direction: 'In', reason: '' });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [minQty, setMinQty] = useState<number | ''>('');
    const [maxQty, setMaxQty] = useState<number | ''>('');

    useEffect(() => { fetchItems(); }, []);
    const fetchItems = async () => {
        const res = await api.get<InventoryItem[]>('/inventory');
        setRawItems(res.data);
    };

    const types = Array.from(new Set(rawItems.map(i => i.type))).sort();
    const filteredItems = rawItems.filter(i => {
        const term = searchTerm.toLowerCase();
        if (term && !i.name.toLowerCase().includes(term) && !i.type.toLowerCase().includes(term)) return false;
        if (filterType !== 'All' && i.type !== filterType) return false;
        if (minQty !== '' && i.quantity < minQty) return false;
        if (maxQty !== '' && i.quantity > maxQty) return false;
        return true;
    });

    // CRUD handlers
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault(); await api.post('/inventory', addForm); setShowAdd(false); setAddForm({ name: '', quantity: 1, type: '', reorderThreshold: 0 }); fetchItems();
    };
    const openEdit = (item: InventoryItem) => { setShowEditId(item.id); setEditForm({ name: item.name, quantity: item.quantity, type: item.type, reorderThreshold: item.reorderThreshold }); };
    const handleSave = async () => { if (!showEditId) return; await api.put(`/inventory/${showEditId}`, editForm); setShowEditId(null); fetchItems(); };
    const handleDelete = async (id: number) => { if (!confirm('Delete?')) return; await api.delete(`/inventory/${id}`); fetchItems(); };
    const openMove = (item: InventoryItem) => { setShowMoveId(item.id); setMoveForm({ amount: 1, direction: 'In', reason: '' }); };
    const handleMove = async () => { if (!showMoveId) return; await api.post(`/inventory/${showMoveId}/move`, moveForm); setShowMoveId(null); fetchItems(); };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300">
            {/* Navbar */}
            <header className="flex items-center justify-between bg-white/80 backdrop-blur px-6 py-3 shadow-md">
                <h1 className="text-xl font-bold text-gray-800">Inventory App</h1>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/recycle')} className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white">Recycle Bin</button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2 rounded-md bg-pink-400 hover:bg-pink-500 text-white">Logout</button>
                </div>
            </header>

            {/* Controls */}
            <div className="px-6 py-4 flex flex-wrap gap-4 items-center">
                <input type="text" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border rounded-md px-3 py-2 flex-1" />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-md px-3 py-2">
                    <option>All</option>{types.map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="Min" value={minQty} onChange={e => setMinQty(e.target.value === '' ? '' : +e.target.value)} className="border rounded-md px-3 py-2 w-24" />
                <input type="number" placeholder="Max" value={maxQty} onChange={e => setMaxQty(e.target.value === '' ? '' : +e.target.value)} className="border rounded-md px-3 py-2 w-24" />
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md">
                    <PlusCircle size={16} /> Add Item
                </button>
            </div>

            {/* Items Grid */}
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between">
                        <Link to={`/moves/${item.id}`} className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.quantity} - {item.type}<br />Added: {new Date(item.addedDate + 'Z').toLocaleString('tr-TR')}</p>
                        </Link>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => openEdit(item)} title="Edit" className="p-1 rounded hover:bg-gray-100"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(item.id)} title="Delete" className="p-1 rounded hover:bg-gray-100"><Trash size={16} /></button>
                            <button onClick={() => openMove(item)} title="Move" className="p-1 rounded hover:bg-gray-100"><ArrowLeftRight size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Item</h2>
                        <form onSubmit={handleAdd} className="space-y-3">
                            <input required placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" />
                            <input required type="number" min={1} placeholder="Quantity" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: +e.target.value }))} className="w-full border rounded px-3 py-2" />
                            <input required placeholder="Type" value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded px-3 py-2" />
                            <input required type="number" min={0} placeholder="Reorder Threshold" value={addForm.reorderThreshold} onChange={e => setAddForm(f => ({ ...f, reorderThreshold: +e.target.value }))} className="w-full border rounded px-3 py-2" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditId && (
                <div className="fixed inset-0 bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Edit Item</h2>
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" />
                        <input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: +e.target.value }))} className="w-full border rounded px-3 py-2" />
                        <input value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded px-3 py-2" />
                        <input type="number" value={editForm.reorderThreshold} onChange={e => setEditForm(f => ({ ...f, reorderThreshold: +e.target.value }))} className="w-full border rounded px-3 py-2" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowEditId(null)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {showMoveId && (
                <div className="fixed inset-0 bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Move Stock</h2>
                        <select value={moveForm.direction} onChange={e => setMoveForm(f => ({ ...f, direction: e.target.value as 'In' | 'Out' }))} className="w-full border rounded px-3 py-2">
                            <option value="In">Add</option>
                            <option value="Out">Remove</option>
                        </select>
                        <input type="number" min={1} value={moveForm.amount} onChange={e => setMoveForm(f => ({ ...f, amount: +e.target.value }))} placeholder="Amount" className="w-full border rounded px-3 py-2" />
                        <input placeholder="Reason" value={moveForm.reason} onChange={e => setMoveForm(f => ({ ...f, reason: e.target.value }))} className="w-full border rounded px-3 py-2" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowMoveId(null)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleMove} className="px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}