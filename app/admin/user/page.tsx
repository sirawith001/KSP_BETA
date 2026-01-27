'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Shield, 
  UserPlus, 
  Search, 
  Lock, 
  Key, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Activity,
  Briefcase
} from 'lucide-react';

// 1. Type Department definitions
type Department = 'USER' | 'ADMINMINI' | 'OPD' | 'ER';

interface WardUser {
  wardid: number;
  warduser: string;
  wardpass: string;
  role: 'USER' | 'ADMIN';
  department: Department;
  wardname: string | null;
  wardstatus: string | null;
  warddest: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<WardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<WardUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    warduser: '',
    wardpass: '',
    role: 'USER' as 'USER' | 'ADMIN',
    department: 'USER' as Department,
    wardname: '',
    wardstatus: '',
    warddest: '',
  });

  // Filter State
  const [filterRole, setFilterRole] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // ดึงข้อมูลทั้งหมด
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // เปิด Modal สำหรับเพิ่ม
  const handleAdd = () => {
    setEditMode(false);
    setCurrentUser(null);
    setFormData({
      warduser: '',
      wardpass: '',
      role: 'USER',
      department: 'USER', 
      wardname: '',
      wardstatus: '',
      warddest: '',
    });
    setShowPassword(false);
    setShowModal(true);
  };

  // เปิด Modal สำหรับแก้ไข
  const handleEdit = (user: WardUser) => {
    setEditMode(true);
    setCurrentUser(user);
    setFormData({
      warduser: user.warduser,
      wardpass: '', 
      role: user.role,
      department: user.department || 'USER',
      wardname: user.wardname || '',
      wardstatus: user.wardstatus || '',
      warddest: user.warddest || '',
    });
    setShowPassword(false);
    setShowModal(true);
  };

  // บันทึกข้อมูล (เพิ่ม/แก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warduser.trim()) {
      alert('MISSING OPERATIVE ID (Username)');
      return;
    }

    if (!editMode && !formData.wardpass.trim()) {
      alert('ACCESS CODE REQUIRED (Password)');
      return;
    }

    try {
      const url = editMode 
        ? `/api/admin/users/${currentUser?.wardid}` 
        : '/api/admin/users';
      
      const method = editMode ? 'PUT' : 'POST';

      const dataToSend = editMode && !formData.wardpass.trim()
        ? { ...formData, wardpass: undefined }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        // alert(editMode ? 'แก้ไขสำเร็จ!' : 'เพิ่มผู้ใช้สำเร็จ!');
        setShowModal(false);
        fetchUsers();
      } else {
        alert(data.error || 'OPERATION FAILED');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('COMMUNICATION ERROR');
    }
  };

  // ลบข้อมูล
  const handleDelete = async (wardid: number, warduser: string) => {
    if (!confirm(`CONFIRM DISCHARGE OF OPERATIVE: "${warduser}"?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${wardid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'UNABLE TO DISCHARGE');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('SYSTEM ERROR');
    }
  };

  const handleResetPassword = async (wardid: number, warduser: string) => {
    const newPassword = prompt(`ENTER NEW ACCESS CODE FOR "${warduser}":`);
    
    if (!newPassword) return;

    try {
      const response = await fetch(`/api/admin/users/${wardid}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert('ACCESS CODE UPDATED SUCCESSFULLY');
      } else {
        const data = await response.json();
        alert(data.error || 'UPDATE FAILED');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('SYSTEM ERROR');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchRole = filterRole === 'ALL' || user.role === filterRole;
    const matchSearch = 
      user.warduser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.wardname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchRole && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 border-4 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[#556b2f] font-mono text-xl tracking-widest animate-pulse">LOADING PERSONNEL DATA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-300 font-sans p-4">

      {/* --- HEADER: COMMAND CENTER STYLE --- */}
      <div className="bg-[#2b2b2b] border-l-4 border-[#556b2f] shadow-lg p-6 mb-8 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-6 h-6 text-[#556b2f]" />
              <span className="text-xs font-mono text-[#556b2f] tracking-[0.2em]">PERSONNEL // ROSTER</span>
            </div>
            <h2 className="text-3xl font-black text-[#e5e4dc] uppercase tracking-wider font-mono">
              Unit Management
            </h2>
            <p className="text-gray-500 text-sm font-mono mt-1">
              // CLASSIFIED: AUTHORIZED ACCESS ONLY
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="mt-4 md:mt-0 group relative px-6 py-3 bg-[#3d4c22] hover:bg-[#4d602b] text-[#e5e4dc] font-bold uppercase tracking-widest transition-all"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Recruit New Unit</span>
            </div>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#8f9e68]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#8f9e68]"></div>
          </button>
        </div>
      </div>

      {/* --- STATS DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TOTAL FORCES', value: users.length, icon: <Users />, color: 'text-gray-400' },
          { label: 'COMMANDERS (Admin)', value: users.filter(u => u.role === 'ADMIN').length, icon: <Shield />, color: 'text-red-500' },
          { label: 'OPERATIVES (User)', value: users.filter(u => u.role === 'USER').length, icon: <Briefcase />, color: 'text-blue-400' },
          { label: 'DEPLOYED (Assigned)', value: users.filter(u => u.wardname).length, icon: <Activity />, color: 'text-green-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-[#222] border border-[#333] p-4 relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono text-[#556b2f] tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-[#e5e4dc] font-mono">{stat.value}</p>
              </div>
              <div className={`p-2 bg-[#111] rounded-sm ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                {stat.icon}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-[#556b2f] w-0 group-hover:w-full transition-all duration-500"></div>
          </div>
        ))}
      </div>

      {/* --- FILTERS & SEARCH --- */}
      <div className="bg-[#222] border border-[#333] p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SCAN FOR OPERATIVE OR UNIT..."
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#444] text-[#e5e4dc] font-mono focus:border-[#556b2f] focus:outline-none placeholder-gray-600 uppercase"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        </div>

        <div className="flex gap-1 w-full md:w-auto">
          {['ALL', 'ADMIN', 'USER'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role as any)}
              className={`flex-1 md:flex-none px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-all ${
                filterRole === role
                  ? 'bg-[#556b2f] text-white border-[#556b2f]'
                  : 'bg-[#1a1a1a] text-gray-500 border-[#333] hover:bg-[#222]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* --- TACTICAL TABLE --- */}
      <div className="bg-[#222] border border-[#333] mb-10 overflow-hidden">
        <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500">PERSONNEL_DATA::LIVE</span>
          <div className="flex gap-1">
             {/* Decor dots */}
            <div className="w-1.5 h-1.5 bg-red-900 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-yellow-900 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#2a2a2a] text-[#8f9e68] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-[#444]">ID_TAG</th>
                <th className="px-6 py-4 border-b border-[#444]">OPERATIVE (User)</th>
                <th className="px-6 py-4 border-b border-[#444]">DIVISION (Dept)</th>
                <th className="px-6 py-4 border-b border-[#444]">RANK (Role)</th>
                <th className="px-6 py-4 border-b border-[#444]">ASSIGNMENT (Ward)</th>
                <th className="px-6 py-4 border-b border-[#444]">STATUS</th>
                <th className="px-6 py-4 border-b border-[#444] text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-600 tracking-widest">
                    {searchTerm ? '[ SEARCH YIELDED NO RESULTS ]' : '[ NO PERSONNEL DATA ]'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.wardid} className={`border-b border-[#333] hover:bg-[#2c3325] transition-colors ${idx % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#1a1a1a]'}`}>
                    <td className="px-6 py-4 text-gray-500">#{String(user.wardid).padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <span className="text-[#e5e4dc] font-bold">{user.warduser}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 text-[10px] border font-bold uppercase ${
                          user.department === 'ADMINMINI' ? 'border-purple-900 text-purple-400 bg-purple-900/10' :
                          user.department === 'ER' ? 'border-red-900 text-red-400 bg-red-900/10' :
                          user.department === 'OPD' ? 'border-blue-900 text-blue-400 bg-blue-900/10' :
                          'border-gray-600 text-gray-400 bg-gray-700/10'
                       }`}>
                          {user.department}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="text-red-500 flex items-center gap-1 text-xs font-bold tracking-wider">
                          <Shield size={12} /> COMMANDER
                        </span>
                      ) : (
                        <span className="text-blue-400 flex items-center gap-1 text-xs font-bold tracking-wider">
                          <Users size={12} /> OPERATIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.wardname ? <span className="text-gray-300">{user.wardname}</span> : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {user.wardstatus ? <span className="text-[#556b2f]">{user.wardstatus}</span> : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#1e3a8a]/20 rounded-sm transition-all"
                          title="Modify Record"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.wardid, user.warduser)}
                          className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-[#451a03]/20 rounded-sm transition-all"
                          title="Update Access Code"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.wardid, user.warduser)}
                          className="p-2 text-[#8b0000] hover:text-red-500 hover:bg-[#3f1212] rounded-sm transition-all"
                          title="Discharge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: TOP SECRET FILE --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1c] border-2 border-[#556b2f] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-[0_0_30px_rgba(85,107,47,0.3)]">
            
            {/* Modal Header */}
            <div className="bg-[#556b2f] p-3 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-black font-black uppercase tracking-widest flex items-center gap-2">
                {editMode ? <Edit3 size={18} /> : <UserPlus size={18} />}
                {editMode ? 'MODIFY PERSONNEL FILE' : 'NEW RECRUITMENT FORM'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-black hover:bg-black/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Section: Identity */}
              <div className="border border-[#333] p-4 relative mt-2">
                <span className="absolute -top-3 left-3 bg-[#1c1c1c] px-2 text-[10px] text-[#556b2f] uppercase tracking-widest font-bold">
                  Identity Confirmation
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Operative ID (User) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.warduser}
                      onChange={(e) => setFormData({ ...formData, warduser: e.target.value })}
                      required
                      disabled={editMode}
                      className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-[#556b2f] focus:bg-[#000] disabled:opacity-50 font-mono transition-colors"
                      placeholder="CALLSIGN..."
                    />
                    {editMode && <p className="text-[10px] text-red-500/70 mt-1 font-mono">&gt;&gt; ID LOCKED: MODIFICATION PROHIBITED</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Access Level (Role) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                      className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-[#556b2f] font-mono cursor-pointer"
                    >
                      <option value="USER">OPERATIVE (USER)</option>
                      <option value="ADMIN">COMMANDER (ADMIN)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Division */}
              <div className="border border-[#333] p-4 relative mt-4">
                 <span className="absolute -top-3 left-3 bg-[#1c1c1c] px-2 text-[10px] text-purple-500/70 uppercase tracking-widest font-bold">
                  Division / Assignment
                </span>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                      className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
                    >
                      <option value="USER">GENERAL INFANTRY (USER)</option>
                      <option value="ADMINMINI">SUB-COMMAND (ADMINMINI)</option>
                      <option value="OPD">OUTPATIENT UNIT (OPD)</option>
                      <option value="ER">EMERGENCY RESPONSE (ER)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Ward Designation (Name)
                    </label>
                    <input
                      type="text"
                      value={formData.wardname}
                      onChange={(e) => setFormData({ ...formData, wardname: e.target.value })}
                      className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="e.g. WARD 5A"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Status & Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-green-500/70 uppercase tracking-widest font-bold">
                    Operational Status
                  </label>
                  <input
                    type="text"
                    value={formData.wardstatus}
                    onChange={(e) => setFormData({ ...formData, wardstatus: e.target.value })}
                    className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-green-500 font-mono"
                    placeholder="e.g. ACTIVE"
                  />
                </div>
                 <div className="space-y-1">
                  <label className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-bold">
                    Location/Bed (Dest)
                  </label>
                  <input
                    type="text"
                    value={formData.warddest}
                    onChange={(e) => setFormData({ ...formData, warddest: e.target.value })}
                    className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-yellow-500 font-mono"
                    placeholder="e.g. BED 01"
                  />
                </div>
              </div>

              {/* Security Clearance (Password) */}
              <div className="space-y-1 pt-2">
                <label className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                  Access Code (Password) {!editMode && '*'}
                  {editMode && <span className="text-gray-500 normal-case font-normal ml-2">// Leave blank to keep current code</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.wardpass}
                    onChange={(e) => setFormData({ ...formData, wardpass: e.target.value })}
                    required={!editMode}
                    className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-red-500 font-mono pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <Lock size={16} className="text-red-500"/> : <Users size={16}/>}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-[#333] mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-[#333] text-gray-400 hover:bg-[#444] hover:text-white uppercase font-bold text-xs tracking-wider transition-colors"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#556b2f] hover:bg-[#6b853a] text-white uppercase font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(85,107,47,0.4)] transition-all"
                >
                  <Save size={14} />
                  CONFIRM & EXECUTE
                </button>
              </div>

            </form>

            {/* Deco corner */}
            <div className="absolute bottom-0 right-0 p-1">
               <div className="w-4 h-4 border-b-2 border-r-2 border-[#556b2f]"></div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}