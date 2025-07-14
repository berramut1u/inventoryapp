import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

interface Move {
    id: number;
    action: string;
    performedBy: string;
    timestamp: string;
}

export default function Moves() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [itemName, setItemName] = useState('');
    const [itemType, setItemType] = useState('');
    const [moves, setMoves] = useState<Move[]>([]);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await api.get<{
                    item: { id: number; name: string; type: string };
                    moves: Move[];
                }>(`/inventory/${id}/moves`);
                setItemName(res.data.item.name);
                setItemType(res.data.item.type);
                setMoves(res.data.moves);
            } catch {
                alert('Failed to load item moves');
                navigate('/items');
            }
        })();
    }, [id, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300">
            {/* Top Navbar */}
            <header className="flex items-center justify-between bg-white/80 backdrop-blur px-6 py-3 shadow-md">
                <h1 className="text-xl font-bold text-gray-800">Inventory App</h1>
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
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Moves for: {itemName} <span className="text-gray-500">({itemType})</span>
                    </h2>

                    {/* Moves List */}
                    {moves.length > 0 ? (
                        <ul className="space-y-4">
                            {moves.map(m => (
                                <li
                                    key={m.id}
                                    className="bg-gray-50 rounded-xl shadow p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <strong className="text-gray-800">{m.action}</strong>
                                        <span className="text-xs text-gray-500">
                                            {new Date(m.timestamp + 'Z').toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Performed by: <span className="font-medium">{m.performedBy}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-gray-500">
                            No moves recorded for this item.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
