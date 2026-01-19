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
  Loader, X, RefreshCw, AlertTriangle, Plus, Trash2 
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
// Usamos la configuración explícita para evitar errores en Vercel
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

// ID COMPARTIDO CON LA TIENDA
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
    let permissions = { manage_admins: true, manage_orders: true, manage_web: true }; // Master permissions

    // 1. Master Check
    if (username === MASTER_USER && password === MASTER_PASS) {
        isValid = true;
    } else {
        // 2. DB Check
        try {
            // Intenta login anónimo primero para leer la DB
            await signInAnonymously(auth);
            
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
            setError("Error de conexión. Intenta de nuevo.");
            setIsLoading(false);
            return;
        }
    }

    if (isValid) {
        if (!auth.currentUser) {
             try { await signInAnonymously(auth); } catch(e) {}
        }
        onLoginSuccess({ username, permissions });
    } else {
        setError("Usuario o contraseña incorrectos.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4 font-sans text-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        ::selection { background-color: #6366f1; color: white; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div className="w-full max-w-md bg-gray-900/80 p-8 rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2 font-orbitron">Panel Administrativo</h2>
        <p className="text-gray-400 text-center text-sm mb-6">Acceso Restringido</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Usuario</label>
            <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Ingresa tu usuario"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Contraseña</label>
            <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-xs text-center bg-red-900/20 p-2 rounded border border-red-900">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors flex justify-center items-center"
          >
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
  
  // Admin Management State
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newPermissions, setNewPermissions] = useState({ manage_orders: true, manage_web: false, manage_admins: false });

  // Load Orders
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'secure_orders_v2');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por fecha descendente en memoria
      ordersData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load Admins (Only if Master or has permission)
  useEffect(() => {
    if (!user.permissions?.manage_admins && user.username !== MASTER_USER) return;
    
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'secure_admins');
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setAdminsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'secure_orders_v2', orderId), { status });
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateAdmin = async (e) => {
      e.preventDefault();
      // SECURITY: Double check on submit
      if (user.username !== MASTER_USER && !user.permissions?.manage_admins) {
          alert("Acceso denegado.");
          return;
      }
      
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'secure_admins'), {
              username: newAdminUser,
              password: newAdminPass,
              permissions: newPermissions,
              createdBy: user.username,
              createdAt: new Date().toISOString()
          });
          setNewAdminUser('');
          setNewAdminPass('');
          alert("Admin registrado exitosamente.");
      } catch (e) {
          alert("Error: " + e.message);
      }
  };

  const handleDeleteAdmin = async (id) => {
      if (user.username !== MASTER_USER && !user.permissions?.manage_admins) return;
      if(window.confirm("¿Eliminar administrador permanentemente?")) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'secure_admins', id));
      }
  };

  const totalSales = orders.reduce((acc, order) => acc + parseFloat(order.total || 0), 0).toFixed(2);
  const isMaster = user.username === MASTER_USER;
  const canManageAdmins = isMaster || user.permissions?.manage_admins;

  // Render Helpers
  const renderUser = (u) => {
      if (typeof u === 'string') return u;
      if (typeof u === 'object' && u !== null) return u.name || 'Unknown';
      return 'Guest';
  };
  const renderItems = (items) => {
      if (typeof items === 'string') return items;
      if (Array.isArray(items)) return items.map(i => i.title || i).join(', ');
      return '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-gray-100 font-sans">
      
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-500 w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight font-orbitron">TecnoByte <span className="text-gray-500 text-sm font-normal font-sans">| Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded border border-indigo-500/20 font-mono">
                {user.username}
            </span>
            <button onClick={onLogout} className="text-red-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold hover:bg-red-900/20 px-3 py-1 rounded">
                <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setView('orders')} 
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${view === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Package size={18} /> Pedidos
          </button>
          
          {/* SECURED TAB: Only visible to Master or Permitted Admins */}
          {canManageAdmins && (
            <button 
                onClick={() => setView('admins')} 
                className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${view === 'admins' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
                <Users size={18} /> Gestión de Admins
            </button>
          )}
        </div>

        {/* --- ORDERS VIEW --- */}
        {view === 'orders' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 backdrop-blur"><h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ventas Totales</h3><p className="text-3xl font-bold text-white font-orbitron">${totalSales}</p></div>
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 backdrop-blur"><h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Órdenes</h3><p className="text-3xl font-bold text-yellow-500 font-orbitron">{orders.length}</p></div>
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 backdrop-blur"><h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Clientes</h3><p className="text-3xl font-bold text-green-500 font-orbitron">{new Set(orders.map(o => o.user)).size}</p></div>
            </div>

            <div className="bg-gray-900/80 rounded-xl overflow-hidden border border-gray-800 overflow-x-auto shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4 border-b border-gray-700">ID</th>
                        <th className="p-4 border-b border-gray-700">Cliente</th>
                        <th className="p-4 border-b border-gray-700">Items</th>
                        <th className="p-4 border-b border-gray-700">Total</th>
                        <th className="p-4 border-b border-gray-700">Estatus</th>
                        <th className="p-4 border-b border-gray-700">Detalles</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {loading ? <tr><td colSpan="6" className="p-8 text-center"><Loader className="animate-spin mx-auto text-indigo-500"/></td></tr> : orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
                        <td className="p-4 font-medium text-white">{renderUser(order.user)}</td>
                        <td className="p-4 text-sm text-gray-300 max-w-xs truncate">{renderItems(order.items)}</td>
                        <td className="p-4 text-green-400 font-bold">${order.total}</td>
                        <td className="p-4">
                            <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="bg-gray-800 border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 focus:border-indigo-500 outline-none">
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </td>
                        <td className="p-4"><button onClick={() => setSelectedOrder(order)} className="text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-900/20 p-2 rounded"><Eye size={18} /></button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {orders.length === 0 && !loading && <div className="p-12 text-center text-gray-500"><Package className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No hay pedidos recientes.</p></div>}
            </div>
          </>
        )}

        {/* --- ADMIN MANAGEMENT VIEW (SECURED) --- */}
        {view === 'admins' && isMaster && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulario */}
              <div className="bg-gray-900/60 p-8 rounded-xl border border-gray-800 backdrop-blur h-fit">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-800">
                      <Plus className="text-green-500" /> Registrar Nuevo Admin
                  </h3>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                      <div>
                          <label className="block text-gray-400 text-xs mb-1 uppercase">Usuario</label>
                          <input type="text" required value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded p-3 text-white focus:border-indigo-500 outline-none" placeholder="Ej: AdminSoporte"/>
                      </div>
                      <div>
                          <label className="block text-gray-400 text-xs mb-1 uppercase">Contraseña</label>
                          <input type="password" required value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded p-3 text-white focus:border-indigo-500 outline-none" placeholder="********"/>
                      </div>
                      
                      <div className="bg-gray-800/50 p-4 rounded border border-gray-700 space-y-3">
                          <p className="text-xs text-indigo-400 font-bold uppercase mb-2">Permisos de Acceso</p>
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <input type="checkbox" checked={newPermissions.manage_orders} onChange={e => setNewPermissions({...newPermissions, manage_orders: e.target.checked})} className="accent-indigo-500 h-4 w-4"/>
                              Gestionar Pedidos (Ver y cambiar estado)
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <input type="checkbox" checked={newPermissions.manage_admins} onChange={e => setNewPermissions({...newPermissions, manage_admins: e.target.checked})} className="accent-indigo-500 h-4 w-4"/>
                              Gestionar Administradores (Crear/Eliminar)
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <input type="checkbox" checked={newPermissions.manage_web} onChange={e => setNewPermissions({...newPermissions, manage_web: e.target.checked})} className="accent-indigo-500 h-4 w-4"/>
                              Gestionar Configuración Web
                          </label>
                      </div>

                      <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
                          Registrar Administrador
                      </button>
                  </form>
              </div>

              {/* Lista */}
              <div className="bg-gray-900/60 p-8 rounded-xl border border-gray-800 backdrop-blur">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-800">
                      <Users className="text-indigo-500" /> Administradores Activos
                  </h3>
                  <div className="space-y-3">
                      {/* Master Admin (Protected) */}
                      <div className="flex justify-between items-center bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                              <div className="bg-indigo-500/20 p-2 rounded-full"><ShieldCheck className="text-indigo-400" size={20}/></div>
                              <div>
                                  <p className="text-white font-mono font-bold">{MASTER_USER}</p>
                                  <p className="text-[10px] text-indigo-300 uppercase tracking-wider">Super Admin (Protegido)</p>
                              </div>
                          </div>
                      </div>

                      {/* Dynamic List */}
                      {adminsList.map(admin => (
                          <div key={admin.id} className="flex justify-between items-center bg-black/40 border border-gray-700 p-4 rounded-lg hover:border-gray-600 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="bg-gray-700/50 p-2 rounded-full"><Users className="text-gray-400" size={20}/></div>
                                  <div>
                                      <p className="text-white font-mono">{admin.username}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {admin.permissions?.manage_orders && <span className="text-[9px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900">PEDIDOS</span>}
                                          {admin.permissions?.manage_admins && <span className="text-[9px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-900">ADMINS</span>}
                                          {admin.permissions?.manage_web && <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">WEB</span>}
                                      </div>
                                  </div>
                              </div>
                              
                              {/* SECURITY CHECK: Cannot delete Master User */}
                              {admin.username !== MASTER_USER && (
                                  <button onClick={() => handleDeleteAdmin(admin.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-900/10 p-2 rounded transition-colors" title="Eliminar Acceso">
                                      <Trash2 size={18}/>
                                  </button>
                              )}
                          </div>
                      ))}
                      
                      {adminsList.length === 0 && <p className="text-gray-500 text-center py-4 text-sm">No hay admins secundarios.</p>}
                  </div>
              </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-800 border border-gray-600 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in relative">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold text-white">Detalles de Orden</h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">ID: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-indigo-400 font-bold text-xs uppercase mb-2">Cliente</h4>
                            <p className="text-white font-medium">{renderUser(selectedOrder.user)}</p>
                            <p className="text-gray-400 text-sm mt-1">{selectedOrder.fullData?.email}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.fullData?.contactPhone}</p>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-green-400 font-bold text-xs uppercase mb-2">Pago</h4>
                            <p className="text-white font-medium uppercase">{selectedOrder.paymentMethod}</p>
                            <p className="text-gray-400 text-xs mt-1 uppercase">Ref:</p>
                            <p className="text-white font-mono bg-black/30 p-1 rounded text-sm">{selectedOrder.fullData?.refNumber || 'N/A'}</p>
                        </div>
                    </div>
                    
                    {/* Capturas */}
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                        {selectedOrder.fullData?.screenshot && (
                            <div>
                                <h4 className="text-gray-400 text-xs uppercase mb-2 font-bold">Comprobante</h4>
                                <img src={selectedOrder.fullData.screenshot.data} className="w-full rounded border border-gray-700 bg-black" alt="Pago"/>
                            </div>
                        )}
                        {selectedOrder.fullData?.exchangeData && (
                            <div className="bg-yellow-900/10 border border-yellow-600/30 p-4 rounded-lg mt-4">
                              <h4 className="text-yellow-500 font-bold text-xs uppercase mb-2 flex items-center gap-2"><RefreshCw size={14}/> Datos Exchange</h4>
                              <p className="text-gray-400 text-sm">Tipo: {selectedOrder.fullData.exchangeData.receiveType}</p>
                              <p className="text-gray-400 text-sm">Monto: {selectedOrder.fullData.exchangeData.receiveAmount}</p>
                              <p className="text-gray-400 text-sm mt-1 break-all bg-black/30 p-2 rounded">{selectedOrder.fullData.exchangeData.receiveAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- APP COMPONENT ---
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
