import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import DocenteDashboard from './pages/DocenteDashboard';
import EstudianteDashboard from './pages/EstudianteDashboard';
import Login from './pages/Login';

const ROLE_ROUTES = {
  docente: '/docente',
  estudiante: '/estudiante',
  admin: '/admin',
};

function LoadingScreen() {
  return (
    <main className="app-shell">
      <p className="app-shell__status">Cargando sesion...</p>
    </main>
  );
}

function AdminPlaceholder() {
  return (
    <main className="app-shell">
      <p className="app-shell__status">Panel admin en preparacion.</p>
    </main>
  );
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to={ROLE_ROUTES[user.rol] ?? '/login'} replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <nav className="app-navbar" aria-label="Navegacion principal">
        <div className="app-navbar__brand">
          <span className="app-navbar__mark">UA</span>
          <span>Unisca Attendance</span>
        </div>
        <div className="app-navbar__actions">
          <span className="app-navbar__role">{user?.rol}</span>
          <button className="app-navbar__logout" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </nav>
      {children}
    </>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return <Navigate to={ROLE_ROUTES[user?.rol] ?? '/login'} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/docente"
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <DocenteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estudiante"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <EstudianteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
