import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    type: string;
    addedDate: string;
    addedBy: string;
}

export default function Items() {
    const { logout } = useAuth();

    // rawItems: every row from the backend
    const [rawItems, setRawItems] = useState<InventoryItem[]>([]);

    // add form
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', quantity: 1, type: '' });

    // edit
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: 0, type: '' });

    // 1) fetch raw rows
    const fetchItems = async () => {
        try {
            const res = await api.get<InventoryItem[]>('/inventory');
            setRawItems(res.data);
        } catch {
            alert('Failed to fetch items');
        }
    };

    // 2) add new
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/inventory', addForm);
            setAddForm({ name: '', quantity: 1, type: '' });
            setShowAdd(false);
            fetchItems();
        } catch {
            alert('Failed to add');
        }
    };

    // 3) start editing
    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm({ name: item.name, quantity: item.quantity, type: item.type });
    };

    // 4) save update
    const saveEdit = async (id: number) => {
        try {
            await api.put(`/inventory/${id}`, editForm);
            setEditingId(null);
            fetchItems();
        } catch {
            alert('Failed to update');
        }
    };

    // 5) delete
    const deleteItem = async (id: number) => {
        try {
            await api.delete(`/inventory/${id}`);
            fetchItems();
        } catch {
            alert('Failed to delete');
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // 6) group + sum by name|type
    const grouped = rawItems.reduce((map, item) => {
        const key = `${item.name}|${item.type}`;
        if (!map.has(key)) {
            map.set(key, { ...item }); // copy full item
        } else {
            map.get(key)!.quantity += item.quantity;
        }
        return map;
    }, new Map<string, InventoryItem>());

    const items = Array.from(grouped.values());

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventory Items</h1>
                <div className="space-x-4">
                    <Link to="/moves" className="text-blue-600 underline">View Moves</Link>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
                        Logout
                    </button>
                </div>
            </div>

            {/* Add button / form */}
            <div className="flex justify-center mb-6">
                {!showAdd ? (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded"
                    >
                        Add Item
                    </button>
                ) : (
                    <form onSubmit={addItem} className="flex flex-col gap-2 w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Name"
                            value={addForm.name}
                            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                            required
                            className="border p-2 rounded"
                        />
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={addForm.quantity}
                            onChange={e => setAddForm(f => ({ ...f, quantity: +e.target.value }))}
                            min={1}
                            required
                            className="border p-2 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Type"
                            value={addForm.type}
                            onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                            required
                            className="border p-2 rounded"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => { setShowAdd(false); setAddForm({ name: '', quantity: 1, type: '' }); }}
                                className="px-4 py-2 rounded border"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                                Save
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* grouped list */}
            <ul className="space-y-2">
                {items.map(item => (
                    <li
                        key={`${item.name}|${item.type}`}
                        className="flex justify-between items-center border p-3 rounded shadow"
                    >
                        {editingId === item.id ? (
                            <div className="flex-1 flex gap-2">
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    className="border p-1 rounded flex-1"
                                />
                                <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={e => setEditForm(f => ({ ...f, quantity: +e.target.value }))}
                                    className="border p-1 rounded w-20"
                                />
                                <input
                                    value={editForm.type}
                                    onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                                    className="border p-1 rounded flex-1"
                                />
                            </div>
                        ) : (
                            <div className="flex-1">
                                <strong>{item.name}</strong> – {item.quantity} × {item.type}
                                <br />
                                <small className="text-gray-500">
                                        Added: {new Date(item.addedDate + 'Z').toLocaleTimeString('tr-TR', {
                                            timeZone: 'Europe/Istanbul',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })} by {item.addedBy}
                                </small>
                            </div>
                        )}
                        <div className="flex gap-2">
                            {editingId === item.id ? (
                                <button onClick={() => saveEdit(item.id)} className="text-green-600">
                                    Save
                                </button>
                            ) : (
                                <button onClick={() => startEdit(item)} className="text-blue-600">
                                    Edit
                                </button>
                            )}
                            <button onClick={() => deleteItem(item.id)} className="text-red-600">
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
