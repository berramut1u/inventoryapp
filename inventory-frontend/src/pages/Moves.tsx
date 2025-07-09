// src/pages/Moves.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface AuditEntry {
    action: string;
    timestamp: string;
    performedBy: string;
}

interface ItemMove {
    id: number;
    name: string;
    quantity: number;
    type: string;
    addedDate: string;
    addedBy: string;
    audits: AuditEntry[];
}

export default function Moves() {
    const [moves, setMoves] = useState<ItemMove[]>([]);

    useEffect(() => {
        api.get<FlatMove[]>('/inventory/moves')
            .then(res => {
                // FlatMove = { id,name,quantity,type,addedDate,addedBy, action,timestamp,performedBy }
                const grouped: Record<number, ItemMove> = {};
                res.data.forEach(f => {
                    if (!grouped[f.id]) {
                        grouped[f.id] = {
                            id: f.id,
                            name: f.name,
                            quantity: f.quantity,
                            type: f.type,
                            addedDate: f.addedDate,
                            addedBy: f.addedBy,
                            audits: []
                        };
                    }
                    grouped[f.id].audits.push({
                        action: f.action,
                        timestamp: f.timestamp,
                        performedBy: f.performedBy
                    });
                });
                setMoves(Object.values(grouped));
            })
            .catch(() => alert('Failed to load moves'));
    }, []);


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Inventory Moves</h1>
              <Link
                to="/items"
                className="text-blue-600 underline hover:text-blue-800"
              >
                View Inventory
              </Link>
            </div>
            {moves.map(item => (
                <div key={item.id} className="border p-4 rounded shadow mb-4">
                    <h2 className="text-xl font-semibold">{item.name}</h2>
                    <h3 className="mt-3 font-medium">Audit Trail:</h3>
                    <ul className="list-disc list-inside text-sm">
                        {item.audits.length === 0
                            ? <li>No operations recorded</li>
                            : item.audits.map((a, i) => (
                                <li key={i}>
                                    <em>{a.action}</em> by <strong>{a.performedBy}</strong> at {new Date(a.timestamp).toLocaleString()}
                                </li>
                            ))
                        }
                    </ul>
                </div>
            ))}
        </div>
    );
}
