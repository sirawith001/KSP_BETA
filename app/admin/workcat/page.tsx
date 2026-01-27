'use client';

import { useEffect, useState } from 'react';
import { 
  Shield, 
  Target, 
  Activity, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Crosshair
} from 'lucide-react'; // แนะนำให้ลง lucide-react ถ้ายังไม่มี หรือใช้ Emoji เดิมก็ได้

interface WorkCat {
  catid: number;
  catname: string;
  catnameopd: string | null;
  catnameer: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function WorkCatPage() {
  const [workCats, setWorkCats] = useState<WorkCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCat, setCurrentCat] = useState<WorkCat | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    catname: '',
    catnameopd: '',
    catnameer: '',
  });

  // ดึงข้อมูลทั้งหมด
  useEffect(() => {
    fetchWorkCats();
  }, []);

  const fetchWorkCats = async () => {
    try {
      const response = await fetch('/api/admin/workcat');
      const data = await response.json();
      
      if (response.ok) {
        setWorkCats(data.workCats || []);
      }
    } catch (error) {
      console.error('Error fetching work categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // เปิด Modal สำหรับเพิ่ม
  const handleAdd = () => {
    setEditMode(false);
    setCurrentCat(null);
    setFormData({
      catname: '',
      catnameopd: '',
      catnameer: '',
    });
    setShowModal(true);
  };

  // เปิด Modal สำหรับแก้ไข
  const handleEdit = (cat: WorkCat) => {
    setEditMode(true);
    setCurrentCat(cat);
    setFormData({
      catname: cat.catname,
      catnameopd: cat.catnameopd || '',
      catnameer: cat.catnameer || '',
    });
    setShowModal(true);
  };

  // บันทึกข้อมูล (เพิ่ม/แก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editMode 
        ? `/api/admin/workcat/${currentCat?.catid}` 
        : '/api/admin/workcat';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // alert(editMode ? 'แก้ไขสำเร็จ!' : 'เพิ่มสำเร็จ!'); // เปลี่ยนเป็น UI แจ้งเตือนแบบอื่นถ้าต้องการ
        setShowModal(false);
        fetchWorkCats();
      } else {
        alert(data.error || 'OPERATION FAILED');
      }
    } catch (error) {
      console.error('Error saving work category:', error);
      alert('COMMUNICATION ERROR');
    }
  };

  // ลบข้อมูล
  const handleDelete = async (catid: number, catname: string) => {
    if (!confirm(`CONFIRM DELETION OF TARGET: "${catname}"?`)) return;

    try {
      const response = await fetch(`/api/admin/workcat/${catid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWorkCats();
      } else {
        const data = await response.json();
        alert(data.error || 'UNABLE TO ELIMINATE TARGET');
      }
    } catch (error) {
      console.error('Error deleting work category:', error);
      alert('SYSTEM ERROR');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 border-4 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[#556b2f] font-mono text-xl tracking-widest animate-pulse">INITIALIZING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-300 font-sans p-4">
      
      {/* --- HEADER SECTION: COMMAND CENTER --- */}
      <div className="bg-[#2b2b2b] border-l-4 border-[#556b2f] shadow-lg p-6 mb-8 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-[#556b2f]" />
              <span className="text-xs font-mono text-[#556b2f] tracking-[0.2em]">MED-OPS // SECTOR 1</span>
            </div>
            <h2 className="text-3xl font-black text-[#e5e4dc] uppercase tracking-wider font-mono">
              Work Category Control
            </h2>
            <p className="text-gray-500 text-sm font-mono mt-1">
              // AUTHORIZED PERSONNEL ONLY
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="mt-4 md:mt-0 group relative px-6 py-3 bg-[#3d4c22] hover:bg-[#4d602b] text-[#e5e4dc] font-bold uppercase tracking-widest transition-all clip-path-polygon"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Deploy New Unit</span>
            </div>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#8f9e68]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#8f9e68]"></div>
          </button>
        </div>
      </div>

      {/* --- STATS HUD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL UNITS', value: workCats.length, icon: <FileText />, color: 'text-gray-400' },
          { label: 'OPD STATUS', value: workCats.filter(c => c.catnameopd).length, icon: <Activity />, color: 'text-blue-400' },
          { label: 'ER STATUS', value: workCats.filter(c => c.catnameer).length, icon: <Crosshair />, color: 'text-red-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-[#222] border border-[#333] p-4 relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono text-[#556b2f] tracking-widest mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-[#e5e4dc] font-mono">{stat.value}</p>
              </div>
              <div className={`p-2 bg-[#111] rounded-sm ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                {stat.icon}
              </div>
            </div>
            {/* Tactical line */}
            <div className="absolute bottom-0 left-0 h-1 bg-[#556b2f] w-0 group-hover:w-full transition-all duration-500"></div>
          </div>
        ))}
      </div>

      {/* --- TACTICAL TABLE --- */}
      <div className="bg-[#222] border border-[#333] mb-10">
        <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500">DATA_STREAM::LIVE</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#2a2a2a] text-[#8f9e68] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-[#444]">ID_TAG</th>
                <th className="px-6 py-4 border-b border-[#444]">DESIGNATION (Name)</th>
                <th className="px-6 py-4 border-b border-[#444]">OPD_Protocol</th>
                <th className="px-6 py-4 border-b border-[#444]">ER_Protocol</th>
                <th className="px-6 py-4 border-b border-[#444]">TimeStamp</th>
                <th className="px-6 py-4 border-b border-[#444] text-center">Command</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {workCats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600 tracking-widest">
                    [ NO INTELLIGENCE DATA FOUND ]
                  </td>
                </tr>
              ) : (
                workCats.map((cat, idx) => (
                  <tr key={cat.catid} className={`border-b border-[#333] hover:bg-[#2c3325] transition-colors ${idx % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#1a1a1a]'}`}>
                    <td className="px-6 py-4 text-gray-500">#{String(cat.catid).padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <span className="text-[#e5e4dc] font-bold">{cat.catname}</span>
                    </td>
                    <td className="px-6 py-4">
                      {cat.catnameopd ? (
                        <span className="bg-[#1e3a8a]/30 text-blue-400 px-2 py-1 text-xs border border-blue-900">
                          {cat.catnameopd}
                        </span>
                      ) : <span className="text-gray-600">N/A</span>}
                    </td>
                    <td className="px-6 py-4">
                      {cat.catnameer ? (
                        <span className="bg-[#451a03]/30 text-orange-400 px-2 py-1 text-xs border border-orange-900">
                          {cat.catnameer}
                        </span>
                      ) : <span className="text-gray-600">N/A</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(cat.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#444] rounded-sm transition-all"
                          title="Modify"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.catid, cat.catname)}
                          className="p-2 text-[#8b0000] hover:text-red-500 hover:bg-[#3f1212] rounded-sm transition-all"
                          title="Purge"
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

      {/* --- MODAL: CLASSIFIED FILE STYLE --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1c] border-2 border-[#556b2f] w-full max-w-md relative shadow-[0_0_30px_rgba(85,107,47,0.3)]">
            
            {/* Modal Header */}
            <div className="bg-[#556b2f] p-3 flex justify-between items-center">
              <h3 className="text-black font-black uppercase tracking-widest flex items-center gap-2">
                {editMode ? <Edit3 size={18} /> : <Plus size={18} />}
                {editMode ? 'MODIFY RECORD' : 'NEW ENTRY'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-black hover:bg-black/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] text-[#556b2f] uppercase tracking-widest font-bold">
                  Designation (Name) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.catname}
                    onChange={(e) => setFormData({ ...formData, catname: e.target.value })}
                    required
                    className="w-full bg-[#111] border-l-2 border-[#333] text-[#e5e4dc] p-3 focus:outline-none focus:border-[#556b2f] focus:bg-[#000] transition-colors font-mono"
                    placeholder="ENTER DESIGNATION..."
                  />
                  <div className="absolute right-2 top-3 text-[#333]">
                    <Target size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-blue-500/70 uppercase tracking-widest font-bold">
                    OPD Protocol
                  </label>
                  <input
                    type="text"
                    value={formData.catnameopd}
                    onChange={(e) => setFormData({ ...formData, catnameopd: e.target.value })}
                    className="w-full bg-[#111] border-l-2 border-[#333] text-gray-300 p-2 text-sm focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="OPTIONAL"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-orange-500/70 uppercase tracking-widest font-bold">
                    ER Protocol
                  </label>
                  <input
                    type="text"
                    value={formData.catnameer}
                    onChange={(e) => setFormData({ ...formData, catnameer: e.target.value })}
                    className="w-full bg-[#111] border-l-2 border-[#333] text-gray-300 p-2 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="OPTIONAL"
                  />
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
                  EXECUTE
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