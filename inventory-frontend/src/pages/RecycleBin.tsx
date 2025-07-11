import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

interface DeletedItem {
    id: number;
    name: string;
    quantity: number;
    type: string;
    addedDate: string;
    reorderThreshold: number;
    selected?: boolean;
}

export default function RecycleBin() {
    const { logout } = useAuth();
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchDeleted();
    }, []);

    const fetchDeleted = async () => {
        const res = await api.get<DeletedItem[]>('/inventory/deleted');
        setItems(res.data.map(i => ({ ...i, selected: false })));
    };

    const toggleSelectAll = () => {
        const newVal = !selectAll;
        setSelectAll(newVal);
        setItems(items.map(i => ({ ...i, selected: newVal })));
    };

    const toggleSelect = (id: number) => {
        setItems(items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
    };

    const restoreSelected = async () => {
        const toRestore = items.filter(i => i.selected);
        await Promise.all(
            toRestore.map(i => api.put(`/inventory/${i.id}/restore`))
        );
        fetchDeleted();
    };

    const deleteSelected = async () => {
        const toDelete = items.filter(i => i.selected);
        await Promise.all(
            toDelete.map(i => api.delete(`/inventory/${i.id}/permanent`))
        );
        fetchDeleted();
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Recycle Bin</h1>
                <div className="space-x-4">
                    <Link to="/items" className="text-blue-600 underline">Back to Items</Link>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                </div>
            </div>

            <div className="flex items-center mb-4">
                <label className="inline-flex items-center">
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="mr-2" />
                    Select All
                </label>
                <button onClick={restoreSelected} className="ml-4 bg-green-600 text-white px-4 py-2 rounded" disabled={!items.some(i => i.selected)}>
                    Restore Selected
                </button>
                <button onClick={deleteSelected} className="ml-2 bg-red-600 text-white px-4 py-2 rounded" disabled={!items.some(i => i.selected)}>
                    Delete Selected
                </button>
            </div>

            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2"></th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Quantity</th>
                        <th className="border p-2">Type</th>
                        <th className="border p-2">Reorder Threshold</th>
                        <th className="border p-2">Added Date</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-100">
                            <td className="border p-2 text-center">
                                <input type="checkbox" checked={item.selected} onChange={() => toggleSelect(item.id)} />
                            </td>
                            <td className="border p-2">{item.name}</td>
                            <td className="border p-2">{item.quantity}</td>
                            <td className="border p-2">{item.type}</td>
                            <td className="border p-2">{item.reorderThreshold}</td>
                            <td className="border p-2">{new Date(item.addedDate + 'Z').toLocaleDateString()}</td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr><td colSpan={6} className="text-center p-4 text-gray-500">Recycle Bin is empty.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}