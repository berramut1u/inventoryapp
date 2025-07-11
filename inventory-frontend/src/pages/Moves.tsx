import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
            }
        })();
    }, [id]);

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Moves for: {itemName} ({itemType})
                </h1>
                <div className="space-x-4">
                    <Link to="/items" className="text-blue-600 underline">
                        Back to Items
                    </Link>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
                        Logout
                    </button>
                </div>
            </div>

            <ul className="space-y-2">
                {moves.map(m => (
                    <li key={m.id} className="border p-3 rounded shadow">
                        <strong>{m.action}</strong> by {m.performedBy}
                        <br />
                        <small className="text-gray-500">
                            {new Date(m.timestamp + 'Z').toLocaleString()}
                        </small>
                    </li>
                ))}
                {moves.length === 0 && (
                    <li className="text-center text-gray-500">No moves for this item.</li>
                )}
            </ul>
        </div>
    );
}
