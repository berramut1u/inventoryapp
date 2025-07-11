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

    // all items from backend
    const [rawItems, setRawItems] = useState<InventoryItem[]>([]);

    // add form
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', quantity: 1, type: '', reorderThreshold: 0 });

    // edit form
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: 0, type: '', reorderThreshold: 0 });

    // filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [minQty, setMinQty] = useState<number | ''>('');
    const [maxQty, setMaxQty] = useState<number | ''>('');

    // fetch items
    const fetchItems = async () => {
        try {
            const res = await api.get<InventoryItem[]>('/inventory');
            setRawItems(res.data);
        } catch {
            alert('Failed to fetch items');
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // build list of distinct types
    const types = Array.from(new Set(rawItems.map(i => i.type))).sort();

    // apply search + type + quantity filters
    const filteredItems = rawItems.filter(i => {
        const term = searchTerm.trim().toLowerCase();
        // search name OR type
        if (term && !(
            i.name.toLowerCase().includes(term) ||
            i.type.toLowerCase().includes(term)
        )) {
            return false;
        }
        // filter by type selection
        if (filterType !== 'All' && i.type !== filterType) {
            return false;
        }
        // filter by min Qty
        if (minQty !== '' && i.quantity < minQty) {
            return false;
        }
        // filter by max Qty
        if (maxQty !== '' && i.quantity > maxQty) {
            return false;
        }
        return true;
    });

    // add new item
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/inventory', addForm);
            setAddForm({ name: '', quantity: 1, type: '', reorderThreshold: 0 });
            setShowAdd(false);
            fetchItems();
        } catch {
            alert('Failed to add');
        }
    };

    // start editing
    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm({ name: item.name, quantity: item.quantity, type: item.type, reorderThreshold: item.reorderThreshold });
    };

    // save edit
    const saveEdit = async (id: number) => {
        try {
            await api.put(`/inventory/${id}`, editForm);
            setEditingId(null);
            fetchItems();
        } catch {
            alert('Failed to update');
        }
    };

    // delete item
    const deleteItem = async (id: number) => {
        try {
            await api.delete(`/inventory/${id}`);
            fetchItems();
        } catch {
            alert('Failed to delete');
        }
    };

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

            {/* search + filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name or type"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border p-2 rounded col-span-1 md:col-span-2"
                />

                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="All">All Types</option>
                    {types.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <div className="flex space-x-2">
                    <input
                        type="number"
                        placeholder="Min Qty"
                        value={minQty}
                        onChange={e => setMinQty(e.target.value === '' ? '' : +e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                    <input
                        type="number"
                        placeholder="Max Qty"
                        value={maxQty}
                        onChange={e => setMaxQty(e.target.value === '' ? '' : +e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
            </div>

            {/* add button / form */}
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
                        <input
                            type="number"
                            placeholder="Reorder threshold"
                            value={addForm.reorderThreshold ?? ''}
                            onChange={e => setAddForm(f => ({
                                ...f,
                                reorderThreshold: +e.target.value
                            }))}
                            min={0}
                            required
                            className="border p-2 rounded"
                        />

                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                    onClick={() => { setShowAdd(false); setAddForm({ name: '', quantity: 1, type: '', reorderThreshold: 0 }); }}
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

            {/* filtered list */}
            <ul className="space-y-2">
                {filteredItems.map(item => (
                    <li
                        key={item.id}
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
                            <Link
                                to={`/moves/${item.id}`}
                                className="flex-1 hover:bg-gray-100 p-2 rounded"
                            >
                                <strong>{item.name}</strong> &#8211; {item.quantity} x {item.type}
                                    {item.quantity < item.reorderThreshold && (
                                        <>
                                        { ' '}
                                    <span className="ml-2 text-red-600 font-bold">
                                         LOW STOCK
                                            </span>
                                        </>
                                )}

                                <br />
                                <small className="text-gray-500">
                                    Added: {new Date(item.addedDate + 'Z').toLocaleTimeString('tr-TR', {
                                        timeZone: 'Europe/Istanbul',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })} by {item.addedBy}
                                </small>
                            </Link>
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
                {filteredItems.length === 0 && (
                    <li className="text-center text-gray-500">No items match your filters.</li>
                )}
            </ul>
        </div>
    );
}
