import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import { Pencil, Trash, ArrowLeftRight } from 'lucide-react';

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
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        quantity: 1,
        type: '',
        reorderThreshold: 0,
    });

    // Edit modal state
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        quantity: 0,
        type: '',
        reorderThreshold: 0,
    });

    // Move modal state
    const [moveItemId, setMoveItemId] = useState<number | null>(null);
    const [moveAmount, setMoveAmount] = useState(1);
    const [moveDirection, setMoveDirection] = useState<'In' | 'Out'>('In');
    const [moveReason, setMoveReason] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [minQty, setMinQty] = useState<number | ''>('');
    const [maxQty, setMaxQty] = useState<number | ''>('');

    // Fetch items
    const fetchItems = async () => {
        const res = await api.get<InventoryItem[]>('/inventory');
        setRawItems(res.data);
    };
    useEffect(() => { fetchItems() }, []);

    // Filters
    const types = Array.from(new Set(rawItems.map(i => i.type))).sort();
    const filteredItems = rawItems.filter(i => {
        const term = searchTerm.trim().toLowerCase();
        if (term && !i.name.toLowerCase().includes(term) && !i.type.toLowerCase().includes(term))
            return false;
        if (filterType !== 'All' && i.type !== filterType) return false;
        if (minQty !== '' && i.quantity < minQty) return false;
        if (maxQty !== '' && i.quantity > maxQty) return false;
        return true;
    });

    // Handlers
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/inventory', addForm);
        setShowAdd(false);
        setAddForm({ name: '', quantity: 1, type: '', reorderThreshold: 0 });
        fetchItems();
    };

    const startEdit = (item: InventoryItem) => {
        setEditingItemId(item.id);
        setEditForm({
            name: item.name,
            quantity: item.quantity,
            type: item.type,
            reorderThreshold: item.reorderThreshold,
        });
    };
    const saveEdit = async () => {
        if (editingItemId === null) return;
        await api.put(`/inventory/${editingItemId}`, editForm);
        setEditingItemId(null);
        fetchItems();
    };

    const deleteItem = async (id: number) => {
        if (!confirm('Delete this item?')) return;
        await api.delete(`/inventory/${id}`);
        fetchItems();
    };

    const handleMove = async () => {
        if (!moveItemId) return;
        await api.post(`/inventory/${moveItemId}/move`, {
            amount: moveAmount,
            direction: moveDirection,
            reason: moveReason,
        });
        setMoveItemId(null);
        setMoveAmount(1);
        setMoveReason('');
        fetchItems();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300">
            {/* Navbar */}
            <header className="flex items-center justify-between bg-white/80 backdrop-blur px-6 py-3 shadow-md">
                <h1 className="text-xl font-bold text-gray-800">Inventory App</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/recycle')}
                        className="px-4 py-2 rounded-md bg-blue-400 text-white hover:bg-blue-500 transition"
                    >
                        Recycle Bin
                    </button>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="px-4 py-2 rounded-md bg-pink-400 text-white hover:bg-pink-500 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Filters & Add */}
            <div className="px-6 py-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text" placeholder="Search"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 flex-1"
                    />
                    <select
                        value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2"
                    >
                        <option value="All">All Types</option>
                        {types.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input
                        type="number" placeholder="Min Qty"
                        value={minQty} onChange={e => setMinQty(e.target.value === '' ? '' : +e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-24"
                    />
                    <input
                        type="number" placeholder="Max Qty"
                        value={maxQty} onChange={e => setMaxQty(e.target.value === '' ? '' : +e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-24"
                    />
                    <button
                        onClick={() => setShowAdd(prev => !prev)}
                        className="bg-purple-400 text-white px-4 py-2 rounded-md hover:bg-purple-500 transition"
                    >
                        {showAdd ? 'Cancel' : 'Add Item'}
                    </button>
                </div>
                {showAdd && (
                    <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <input
                            type="text" placeholder="Name"
                            value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2" required
                        />
                        <input
                            type="number" placeholder="Quantity"
                            value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: +e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2" min={1} required
                        />
                        <input
                            type="text" placeholder="Type"
                            value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2" required
                        />
                        <input
                            type="number" placeholder="Reorder Threshold"
                            value={addForm.reorderThreshold} onChange={e => setAddForm(f => ({ ...f, reorderThreshold: +e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2" min={0} required
                        />
                        <button
                            type="submit"
                            className="md:col-span-4 bg-purple-400 text-white px-4 py-2 rounded-md hover:bg-purple-500 transition"
                        >
                            Save Item
                        </button>
                    </form>
                )}
            </div>

            {/* Cards Grid */}
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        className="relative bg-white rounded-2xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between"
                    >
                        <Link to={`/moves/${item.id}`} className="block flex-1">
                            <div className="font-semibold text-gray-800 text-lg">{item.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                {item.quantity} - {item.type}
                                {item.quantity < item.reorderThreshold && (
                                    <span className="ml-2 text-red-400 font-bold">LOW STOCK</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                Added: {new Date(item.addedDate + 'Z').toLocaleString('tr-TR')} by {item.addedBy}
                            </div>
                        </Link>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => startEdit(item)}
                                className="p-1 rounded-md hover:bg-gray-100"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1 rounded-md hover:bg-gray-100"
                                title="Delete"
                            >
                                <Trash size={16} />
                            </button>
                            <button
                                onClick={() => setMoveItemId(item.id)}
                                className="p-1 rounded-md hover:bg-gray-100"
                                title="Move"
                            >
                                <ArrowLeftRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingItemId !== null && (
                <div className="fixed inset-0 bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300 flex items-center justify-center">

                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Edit Item</h2>
                        <input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <input
                            type="number"
                            value={editForm.quantity}
                            onChange={e => setEditForm(f => ({ ...f, quantity: +e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <input
                            value={editForm.type}
                            onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <input
                            type="number"
                            value={editForm.reorderThreshold}
                            onChange={e => setEditForm(f => ({ ...f, reorderThreshold: +e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingItemId(null)}
                                className="border border-gray-300 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                className="bg-purple-400 text-white px-4 py-2 rounded-md hover:bg-purple-500 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {moveItemId !== null && (
                <div className="fixed inset-0 bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Move Stock</h2>
                        <select
                            value={moveDirection}
                            onChange={e => setMoveDirection(e.target.value as 'In' | 'Out')}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        >
                            <option value="In">Add Stock</option>
                            <option value="Out">Remove Stock</option>
                        </select>
                        <input
                            type="number"
                            min={1}
                            value={moveAmount}
                            onChange={e => setMoveAmount(+e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={moveReason}
                            onChange={e => setMoveReason(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setMoveItemId(null)}
                                className="border border-gray-300 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMove}
                                className="bg-purple-400 text-white px-4 py-2 rounded-md hover:bg-purple-500 transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
