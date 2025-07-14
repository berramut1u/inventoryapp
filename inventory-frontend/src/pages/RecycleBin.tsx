// src/pages/RecycleBin.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

interface DeletedItem {
    id: number;
    name: string;
    quantity: number;
    type: string;
    reorderThreshold: number;
    deletedAt: string;
    selected?: boolean;
}

export default function RecycleBin() {
    const { logout } = useAuth();
    const navigate = useNavigate();
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
        await Promise.all(toRestore.map(i => api.put(`/inventory/${i.id}/restore`)));
        fetchDeleted();
    };

    const deleteSelected = async () => {
        const toDelete = items.filter(i => i.selected);
        await Promise.all(toDelete.map(i => api.delete(`/inventory/${i.id}/permanent`)));
        fetchDeleted();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300">
            {/* Navbar */}
            <header className="flex items-center justify-between bg-white/80 backdrop-blur px-6 py-3 shadow-md">
                <h1 className="text-xl font-bold text-gray-800">Recycle Bin</h1>
                <div className="flex gap-3">
                    <Link
                        to="/items"
                        className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                        Back to Items
                    </Link>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="px-4 py-2 rounded-md bg-pink-400 text-white hover:bg-pink-500 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Card Container */}
            <div className="px-6 py-8 flex justify-center">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    {/* Bulk Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-gray-700">Select All</span>
                        </label>
                        <button
                            onClick={restoreSelected}
                            disabled={!items.some(i => i.selected)}
                            className="px-4 py-2 rounded-md bg-purple-400 text-white hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Restore Selected
                        </button>
                        <button
                            onClick={deleteSelected}
                            disabled={!items.some(i => i.selected)}
                            className="px-4 py-2 rounded-md bg-pink-400 text-white hover:bg-pink-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Delete Selected
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 text-left"></th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-center">Reorder Thresh.</th>
                                    <th className="p-3 text-left">Deleted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length > 0 ? items.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => toggleSelect(item.id)}
                                                className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3 text-center">{item.quantity}</td>
                                        <td className="p-3">{item.type}</td>
                                        <td className="p-3 text-center">{item.reorderThreshold}</td>
                                        <td className="p-3">{item.deletedAt
                                            ? new Date(item.deletedAt + 'Z').toLocaleString('tr-TR')
                                            : '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-gray-500">
                                            Recycle Bin is empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
