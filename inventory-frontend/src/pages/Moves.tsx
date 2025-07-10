// src/pages/Moves.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface FlatMove {
    id: number;
    name: string;
    action: string;
    performedBy: string;
    timestamp: string;
}

interface GroupedMoves {
    id: number;
    name: string;
    moves: FlatMove[];
}

export default function Moves() {
    const [grouped, setGrouped] = useState<GroupedMoves[]>([]);

    useEffect(() => {
        api.get<FlatMove[]>('/inventory/moves')
            .then(res => {
                // group by id+name
                const map = new Map<number, GroupedMoves>();
                res.data.forEach(move => {
                    if (!map.has(move.id)) {
                        map.set(move.id, { id: move.id, name: move.name, moves: [move] });
                    } else {
                        map.get(move.id)!.moves.push(move);
                    }
                });
                // sort each group's moves by timestamp desc
                const arr = Array.from(map.values()).map(g => ({
                    ...g,
                    moves: g.moves.sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                }));
                setGrouped(arr);
            })
            .catch(() => alert('Failed to load moves'));
    }, []);

    if (grouped.length === 0) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <p className="mb-4">No moves to show.</p>
                <Link to="/items" className="bg-green-600 text-white px-6 py-2 rounded">
                    View Inventory
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventory Moves</h1>
                <Link to="/items" className="bg-green-600 text-white px-6 py-2 rounded">
                    View Inventory
                </Link>
            </div>

            <ul className="space-y-6">
                {grouped.map(item => (
                    <li key={item.id} className="border p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                            {item.moves.map(move => (
                                <li
                                    key={`${move.timestamp}-${move.action}`}
                                    className="text-sm"
                                >
                                    <strong>{move.action}</strong> by <em>{move.performedBy}</em>{' '}
                                    at {new Date(move.timestamp + 'Z').toLocaleTimeString('tr-TR', {
                                        timeZone: 'Europe/Istanbul',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })
}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}
