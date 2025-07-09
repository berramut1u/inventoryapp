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
}

export default function Items() {
    const { logout } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [type, setType] = useState('');

    const fetchItems = async () => {
        try {
            const res = await api.get('/inventory');
            setItems(res.data);
        } catch (err: any) {
            console.error('FETCH ERROR', err.response || err);
            alert('Failed to fetch items');
        }
    };

    
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1) Attempt to POST
        try {
            const res = await api.post('/inventory', {
                name: name.trim(),
                quantity: quantity,
                type: type.trim(),
            });
            // Optionally, you can inspect res.status (should be 201)
        } catch (err: any) {
            console.error('AddItem error:', err.response?.data || err.message);
            return alert(
                err.response?.data?.error
                    ? `Add failed: ${err.response.data.error}`
                    : 'Failed to add item'
            );
        }

        // 2) Clear form & reload list
        setName('');
        setQuantity(1);
        setType('');
        try {
            await fetchItems();
        } catch {
            console.warn('Item added but failed to reload list');
        }
    };


    const deleteItem = async (id: number) => {
        try {
            await api.delete(`/inventory/${id}`);
            fetchItems();
        } catch {
            alert('Failed to delete item');
        }
    }; 

    useEffect(() => {
        fetchItems();
    }, []);

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventory Items</h1>
                <Link
                    to="/moves"
                    className="text-blue-600 underline hover:text-blue-800"
                >
                    View Moves
                </Link>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                >
                    Logout
                </button>
            </div>

            <form onSubmit={addItem} className="flex flex-col gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Item name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border p-2 rounded"
                />
                <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="border p-2 rounded"
                />
                <input
                    type="text"
                    placeholder="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="border p-2 rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add Item
                </button>
            </form>

            <ul className="space-y-2">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="flex justify-between items-center border p-3 rounded shadow"
                    >
                        <div>
                            <strong>{item.name}</strong> – {item.quantity} × {item.type}
                            <br />
                            <small className="text-gray-500">
                                Added: {new Date(item.addedDate).toLocaleDateString()}
                            </small>
                        </div>
                        <button
                            onClick={() => deleteItem(item.id)}
                            className="text-sm text-white bg-red-400 px-3 py-1 rounded"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
