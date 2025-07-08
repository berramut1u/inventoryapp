import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use your api client so it picks up baseURL and CORS
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token);           // saves to context + localStorage
            navigate('/items');
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            alert('Login failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="border p-2 rounded"
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border p-2 rounded"
                required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Login
            </button>
        </form>
    );
}
