import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './auth/AuthContext';
import Login from './pages/Login';
import Items from './pages/Items';
import Moves from './pages/Moves';
import RecycleBin from './pages/RecycleBin';


function PrivateRoute({ children }: { children: JSX.Element }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/items"
                        element={<PrivateRoute><Items /></PrivateRoute>}
                    />
                    <Route path="/recycle" element={<RecycleBin />} />

                    <Route path="/moves/:id" element={<Moves />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

<h1 className="text-3xl font-bold text-red-500">Tailwind Test</h1>
