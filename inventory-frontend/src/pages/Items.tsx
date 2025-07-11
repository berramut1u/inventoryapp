import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

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
    const [rawItems, setRawItems] = useState<InventoryItem[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', quantity: 1, type: '', reorderThreshold: 0 });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: 0, type: '', reorderThreshold: 0 });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [minQty, setMinQty] = useState<number | ''>('');
    const [maxQty, setMaxQty] = useState<number | ''>('');

    // Move modal state
    const [moveItemId, setMoveItemId] = useState<number | null>(null);
    const [moveAmount, setMoveAmount] = useState<number>(1);
    const [moveDirection, setMoveDirection] = useState<'In' | 'Out'>('In');
    const [moveReason, setMoveReason] = useState('');

    const fetchItems = async () => {
        const res = await api.get<InventoryItem[]>('/inventory');
        setRawItems(res.data);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const types = Array.from(new Set(rawItems.map(i => i.type))).sort();

    const filteredItems = rawItems.filter(i => {
        const term = searchTerm.trim().toLowerCase();
        if (term && !i.name.toLowerCase().includes(term) && !i.type.toLowerCase().includes(term)) return false;
        if (filterType !== 'All' && i.type !== filterType) return false;
        if (minQty !== '' && i.quantity < minQty) return false;
        if (maxQty !== '' && i.quantity > maxQty) return false;
        return true;
    });

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/inventory', addForm);
        setAddForm({ name: '', quantity: 1, type: '', reorderThreshold: 0 });
        setShowAdd(false);
        fetchItems();
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm({ name: item.name, quantity: item.quantity, type: item.type, reorderThreshold: item.reorderThreshold });
    };

    const saveEdit = async (id: number) => {
        await api.put(`/inventory/${id}`, editForm);
        setEditingId(null);
        fetchItems();
    };

    const deleteItem = async (id: number) => {
        await api.delete(`/inventory/${id}`);
        fetchItems();
    };

    const handleMove = async () => {
        if (!moveItemId) return;
        await api.post(`/inventory/${moveItemId}/moves`, {
            amount: moveAmount,
            direction: moveDirection,
            reason: moveReason
        });
        setMoveItemId(null);
        setMoveAmount(1);
        setMoveReason('');
        fetchItems();
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Inventory</h1>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input type="text" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border p-2 rounded col-span-2" />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-2 rounded">
                    <option value="All">All Types</option>
                    {types.map(t => <option key={t}>{t}</option>)}
                </select>
                <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={minQty} onChange={e => setMinQty(e.target.value === '' ? '' : +e.target.value)} className="border p-2 rounded w-full" />
                    <input type="number" placeholder="Max" value={maxQty} onChange={e => setMaxQty(e.target.value === '' ? '' : +e.target.value)} className="border p-2 rounded w-full" />
                </div>
            </div>

            {/* Add Form */}
            {!showAdd ? (
                <div className="flex justify-center mb-6">
                    <button onClick={() => setShowAdd(true)} className="bg-green-600 text-white px-6 py-2 rounded">Add Item</button>
                </div>
            ) : (
                <form onSubmit={addItem} className="flex flex-col gap-2 mb-6">
                    <input type="text" placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="border p-2 rounded" required />
                    <input type="number" placeholder="Quantity" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: +e.target.value }))} className="border p-2 rounded" required min={1} />
                    <input type="text" placeholder="Type" value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} className="border p-2 rounded" required />
                    <input type="number" placeholder="Reorder Threshold" value={addForm.reorderThreshold} onChange={e => setAddForm(f => ({ ...f, reorderThreshold: +e.target.value }))} className="border p-2 rounded" required min={0} />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="border px-4 py-2 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                    </div>
                </form>
            )}

            {/* Item List */}
            <ul className="space-y-2">
                {filteredItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center border p-3 rounded shadow">
                        {editingId === item.id ? (
                            <div className="flex-1 flex gap-2">
                                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="border p-1 rounded flex-1" />
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: +e.target.value }))} className="border p-1 rounded w-20" />
                                <input value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="border p-1 rounded flex-1" />
                            </div>
                        ) : (
                            <div className="flex-1">
                                <strong>{item.name}</strong> – {item.quantity} × {item.type}
                                {item.quantity < item.reorderThreshold && <span className="ml-2 text-red-600 font-bold">LOW STOCK</span>}
                                <br />
                                <small className="text-gray-500">Added: {new Date(item.addedDate + 'Z').toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' })} by {item.addedBy}</small>
                            </div>
                        )}
                        <div className="flex flex-col items-end gap-1">
                            <Link to={`/moves/${item.id}`} className="text-sm text-indigo-600 underline">View Moves</Link>
                            {editingId === item.id ? (
                                <button onClick={() => saveEdit(item.id)} className="text-green-600">Save</button>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(item)} className="text-blue-600">Edit</button>
                                    <button onClick={() => setMoveItemId(item.id)} className="text-yellow-600">Move</button>
                                </>
                            )}
                            <button onClick={() => deleteItem(item.id)} className="text-red-600">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Move Modal */}
            {moveItemId !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg space-y-4 w-full max-w-sm">
                        <h2 className="text-xl font-bold">Move Stock</h2>
                        <select value={moveDirection} onChange={e => setMoveDirection(e.target.value as 'In' | 'Out')} className="border p-2 rounded w-full">
                            <option value="In">Add Stock</option>
                            <option value="Out">Remove Stock</option>
                        </select>
                        <input type="number" min={1} value={moveAmount} onChange={e => setMoveAmount(+e.target.value)} className="border p-2 rounded w-full" />
                        <input type="text" placeholder="Reason (optional)" value={moveReason} onChange={e => setMoveReason(e.target.value)} className="border p-2 rounded w-full" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setMoveItemId(null)} className="border px-4 py-2 rounded">Cancel</button>
                            <button onClick={handleMove} className="bg-blue-600 text-white px-4 py-2 rounded">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
