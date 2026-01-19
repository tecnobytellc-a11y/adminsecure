import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously,
  signInWithCustomToken, 
  signOut, 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { 
  ShieldCheck, LogOut, Package, Users, Eye, 
  Loader, X, RefreshCw, AlertTriangle, Plus, Trash2, CheckSquare, Square 
} from 'lucide-react';

// --- ESTILOS CSS INTEGRADOS (Para asegurar la interfaz visual) ---
const adminStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600&display=swap');
  
  :root { --bg-dark: #0a0a12; --card-bg: #111827; --primary: #4f46e5; --text-main: #f3f4f6; --text-muted: #9ca3af; }
  body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-dark); color: var(--text-main); }
  .font-orbitron { font-family: 'Orbitron', sans-serif; }
  
  /* Utilidades estilo Tailwind */
  .min-h-screen { min-height: 100vh; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }
  .p-8 { padding: 2rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .gap-8 { gap: 2rem; }
  .w-full { width: 100%; }
  .max-w-7xl { max-width: 80rem; }
  .max-w-md { max-width: 28rem; }
  .max-w-2xl { max-width: 42rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .rounded-2xl { border-radius: 1rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-full { border-radius: 9999px; }
  .border { border-width: 1px; }
  .border-b { border-bottom-width: 1px; }
  .border-indigo-500-30 { border-color: rgba(79, 70, 229, 0.3); }
  .border-gray-700 { border-color: #374151; }
  .bg-gray-900 { background-color: var(--bg-dark); }
  .bg-gray-900-80 { background-color: rgba(17, 24, 39, 0.8); }
  .bg-gray-800 { background-color: #1f2937; }
  .bg-indigo-600 { background-color: var(--primary); }
  .text-white { color: white; }
  .text-gray-400 { color: var(--text-muted); }
  .text-indigo-400 { color: #818cf8; }
  .text-green-400 { color: #4ade80; }
  .text-red-400 { color: #f87171; }
  .font-bold { font-weight: 700; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
  .backdrop-blur { backdrop-filter: blur(8px); }
  .cursor-pointer { cursor: pointer; }
  .hover-bg-indigo-700:hover { background-color: #4338ca; }
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  
  @media (min-width: 768px) {
    .md-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .md-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }

  /* Tabla */
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #374151; }
  td { padding: 1rem; border-bottom: 1px solid #374151; color: #e5e7eb; }
  tr:hover { background-color: rgba(55, 65, 81, 0.5); }
  
  /* Inputs y Selects */
  input, select { background-color: #111827; border: 1px solid #374151; color: white; padding: 0.75rem; border-radius: 0.5rem; width: 100%; box-sizing: border-box; outline: none; }
  input:focus, select:focus { border-color: var(--primary); }

  /* Modal */
  .fixed { position: fixed; }
  .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
  .z-50 { z-index: 50; }
  .z-60 { z-index: 60; }
  .bg-black-80 { background-color: rgba(0, 0, 0, 0.8); }
  .overflow-y-auto { overflow-y: auto; }
  .max-h-90vh { max-height: 90vh; }
  .sticky { position: sticky; }
  .top-0 { top: 0; }
`;

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDYYKRuG39vi35a5CTxwoCQ7iPvvppakjU",
    authDomain: "tecnobyte-59f74.firebaseapp.com",
    projectId: "tecnobyte-59f74",
    storageBucket: "tecnobyte-59f74.firebasestorage.app",
    messagingSenderId: "312636053858",
    appId: "1:312636053858:web:03eff6f29188bcd08f743b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID COMPARTIDO
const appId = 'tecnobyte_store_v2'; 

const ORDER_STATUSES = [
  "PENDIENTE POR ENTREGAR", "CANCELADO", "ENTREGADO", 
  "COMPLETADO", "FACTURADO", "EN DISPUTA", 
  "REEMBOLSADO", "PROCESANDO AUTOMÁTICAMENTE"
];

const MASTER_USER = "Jesxs.Ve-3J7";
const MASTER_PASS = "TnE@3109";

// --- LOGIN COMPONENT ---
const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let isValid = false;
    let permissions = { manage_admins: true, manage_orders: true, manage_web: true }; 

    if (username === MASTER_USER && password === MASTER_PASS) {
        isValid = true;
    } else {
        try {
            // Login anónimo para leer DB de admins
            if (!auth.currentUser) await signInAnonymously(auth);
            
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'secure_admins'), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const adminDoc = querySnapshot.docs[0].data();
                if (adminDoc.password === password) {
                    isValid = true;
                    permissions = adminDoc.permissions || { manage_orders: true };
                }
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión.");
            setIsLoading(false);
            return;
        }
    }

    if (isValid) {
        if (!auth.currentUser) { try { await signInAnonymously(auth); } catch(e) {} }
        onLoginSuccess({ username, permissions });
    } else {
        setError("Credenciales incorrectas.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4 font-sans text-gray-100">
      <style>{adminStyles}</style>
      <div className="w-full max-w-md bg-gray-900-80 p-8 rounded-2xl border border-indigo-500-30 shadow-2xl backdrop-blur">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2 font-orbitron">Panel Administrativo</h2>
        <p className="text-gray-400 text-center text-sm mb-6">Acceso Restringido</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase">Usuario</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-xs text-center p-2 border border-red-400 rounded">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover-bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg flex justify-center items-center cursor-pointer">
            {isLoading ? <Loader className="animate-spin w-5 h-5" /> : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [view, setView] = useState('orders'); 
  const [loading, setLoading] = useState(true);
  
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newPermissions, setNewPermissions] = useState({ manage_orders: true, manage_web: false, manage_admins: false });

  // Cargar Pedidos
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'secure_orders_v2');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cargar Admins
  useEffect(() => {
    if (!user.permissions?.manage_admins && user.username !== MASTER_USER) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'secure_admins');
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setAdminsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'secure_orders_v2', orderId), { status });
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateAdmin = async (e) => {
      e.preventDefault();
      if (user.username !== MASTER_USER && !user.permissions?.manage_admins) {
          alert("Acceso denegado."); return;
      }
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'secure_admins'), {
              username: newAdminUser,
              password: newAdminPass,
              permissions: newPermissions,
              createdBy: user.username,
              createdAt: new Date().toISOString()
          });
          setNewAdminUser(''); setNewAdminPass('');
          alert("Admin registrado.");
      } catch (e) { alert("Error: " + e.message); }
  };

  const handleDeleteAdmin = async (id) => {
      if (user.username !== MASTER_USER && !user.permissions?.manage_admins) return;
      if(window.confirm("¿Eliminar administrador?")) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'secure_admins', id));
      }
  };

  const totalSales = orders.reduce((acc, order) => acc + parseFloat(order.total || 0), 0).toFixed(2);
  const canManageAdmins = user.username === MASTER_USER || user.permissions?.manage_admins;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-gray-100 font-sans">
      <style>{adminStyles}</style>
      
      {/* Header */}
      <header className="bg-gray-900-80 border-b border-gray-700 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-400 w-6 h-6" />
            <h1 className="font-bold text-xl font-orbitron">TecnoByte <span className="text-gray-400 text-sm font-sans">| Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-gray-800 text-indigo-400 px-3 py-1 rounded border border-gray-700 font-mono">{user.username}</span>
            <button onClick={onLogout} className="text-red-400 hover:text-white flex items-center gap-2 text-xs font-bold px-3 py-1 rounded border border-gray-700 cursor-pointer">
                <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setView('orders')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-pointer ${view === 'orders' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            <Package size={18} /> Pedidos
          </button>
          {canManageAdmins && (
            <button onClick={() => setView('admins')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-pointer ${view === 'admins' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                <Users size={18} /> Gestión Admins
            </button>
          )}
        </div>

        {/* Orders View */}
        {view === 'orders' && (
          <>
            <div className="grid grid-cols-1 md-grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900-80 p-6 rounded-xl border border-gray-700"><h3 className="text-gray-400 text-xs uppercase mb-1">Ventas</h3><p className="text-3xl font-bold text-white">${totalSales}</p></div>
                <div className="bg-gray-900-80 p-6 rounded-xl border border-gray-700"><h3 className="text-gray-400 text-xs uppercase mb-1">Órdenes</h3><p className="text-3xl font-bold text-yellow-400">{orders.length}</p></div>
                <div className="bg-gray-900-80 p-6 rounded-xl border border-gray-700"><h3 className="text-gray-400 text-xs uppercase mb-1">Clientes</h3><p className="text-3xl font-bold text-green-400">{new Set(orders.map(o => o.user)).size}</p></div>
            </div>

            <div className="bg-gray-900-80 rounded-xl overflow-hidden border border-gray-700">
                <table>
                    <thead className="bg-gray-800">
                    <tr>
                        <th>ID</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estatus</th><th>Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? <tr><td colSpan="6" className="p-8 text-center"><Loader className="animate-spin mx-auto text-indigo-400"/></td></tr> : orders.map(order => (
                        <tr key={order.id}>
                        <td className="font-mono text-xs text-gray-500">{order.id}</td>
                        <td>{typeof order.user === 'string' ? order.user : 'Guest'}</td>
                        <td className="text-sm text-gray-400 truncate max-w-xs">{Array.isArray(order.items) ? order.items.join(', ') : ''}</td>
                        <td className="font-bold text-green-400">${order.total}</td>
                        <td>
                            <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="cursor-pointer">
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </td>
                        <td><button onClick={() => setSelectedOrder(order)} className="text-indigo-400 bg-gray-800 p-2 rounded cursor-pointer"><Eye size={18} /></button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          </>
        )}

        {/* Admin Management View */}
        {view === 'admins' && canManageAdmins && (
          <div className="grid grid-cols-1 md-grid-cols-2 gap-8">
              <div className="bg-gray-900-80 p-8 rounded-xl border border-gray-700 h-fit">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="text-green-400" /> Nuevo Admin</h3>
                  <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
                      <input type="text" required value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} placeholder="Usuario"/>
                      <input type="password" required value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} placeholder="Contraseña"/>
                      
                      <div className="bg-gray-800 p-4 rounded border border-gray-700 flex flex-col gap-2">
                          <p className="text-xs text-indigo-400 font-bold uppercase">Permisos</p>
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <input type="checkbox" checked={newPermissions.manage_orders} onChange={e => setNewPermissions({...newPermissions, manage_orders: e.target.checked})}/> Gestionar Pedidos
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <input type="checkbox" checked={newPermissions.manage_admins} onChange={e => setNewPermissions({...newPermissions, manage_admins: e.target.checked})}/> Gestionar Admins
                          </label>
                      </div>
                      <button type="submit" className="bg-green-600 hover-bg-green-700 text-white font-bold py-3 rounded-lg cursor-pointer">Registrar</button>
                  </form>
              </div>

              <div className="bg-gray-900-80 p-8 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Users className="text-indigo-400" /> Admins Activos</h3>
                  <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center bg-gray-800 border border-gray-700 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                              <ShieldCheck className="text-indigo-400" size={20}/>
                              <div><p className="text-white font-mono font-bold">{MASTER_USER}</p><p className="text-xs text-indigo-300 uppercase">Super Admin</p></div>
                          </div>
                      </div>
                      {adminsList.map(admin => (
                          <div key={admin.id} className="flex justify-between items-center bg-gray-800 border border-gray-700 p-4 rounded-lg">
                              <div className="flex items-center gap-3">
                                  <Users className="text-gray-400" size={20}/>
                                  <div><p className="text-white font-mono">{admin.username}</p><p className="text-xs text-gray-500 uppercase">Secundario</p></div>
                              </div>
                              {admin.username !== MASTER_USER && (
                                  <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-400 hover-text-white p-2 rounded cursor-pointer"><Trash2 size={18}/></button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black-80 backdrop-blur">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-90vh overflow-y-auto shadow-2xl relative">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900 sticky top-0">
                    <h3 className="text-xl font-bold text-white">Detalles: {selectedOrder.id}</h3>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
                </div>
                <div className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-indigo-400 font-bold text-xs uppercase mb-2">Cliente</h4>
                            <p className="text-white">{typeof selectedOrder.user === 'string' ? selectedOrder.user : 'N/A'}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.fullData?.email}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.fullData?.contactPhone}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-green-400 font-bold text-xs uppercase mb-2">Pago</h4>
                            <p className="text-white uppercase">{String(selectedOrder.paymentMethod)}</p>
                            <p className="text-white font-mono bg-black p-1 rounded text-sm mt-1">{selectedOrder.fullData?.refNumber || 'N/A'}</p>
                        </div>
                    </div>
                    {selectedOrder.fullData?.screenshot && (
                        <div>
                            <h4 className="text-gray-400 text-xs uppercase mb-2 font-bold">Comprobante</h4>
                            <img src={selectedOrder.fullData.screenshot.data} className="w-full rounded border border-gray-700 bg-black" alt="Pago"/>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (user) => {
      setIsAuthenticated(true);
      setCurrentUser(user);
  };

  const handleLogout = async () => {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
  };

  return isAuthenticated 
    ? <Dashboard user={currentUser} onLogout={handleLogout} /> 
    : <Login onLoginSuccess={handleLoginSuccess} />;
}
