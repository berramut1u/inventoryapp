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
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token);
            navigate('/items');
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            alert('Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-300 via-blue-200 to-pink-300">

            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-4"
            >
                <h2 className="text-2xl font-semibold text-center text-gray-800">Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-blue-400 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition"
                >
                    Login
                </button>
            </form>
        </div>
    );
}
