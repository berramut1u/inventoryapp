import { useEffect, useState } from 'react';
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
        } catch {
            alert('Failed to fetch items');
        }
    };
    
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/inventory', { name, quantity, type });
            setName('');
            setQuantity(1);
            setType('');
            fetchItems();
        } catch {
            alert('Failed to add item');
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
