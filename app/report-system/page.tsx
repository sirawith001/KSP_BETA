"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  UploadCloud, 
  Crosshair, 
  Shield,
  ArrowLeft,
  X,           
  Maximize2    
} from "lucide-react";

// ============================================
// 1. TYPE DEFINITIONS
// ============================================
type Ticket = {
  ticketId: number;
  title: string;
  description: string;
  location: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  category: "SYSTEM" | "GENERAL";
  createdAt: string;
  reporter: { wardname: string };
  assignee?: { wardname: string };
  photoUpload: string | null;
};

type UserProfile = {
  wardid: number;
  username: string;
  wardname: string;
  role: "ADMIN" | "USER";
};

export default function TicketPage() {

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const router = useRouter();

  // ============================================
  // 2. STATES
  // ============================================
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // State สำหรับ Modal ดูรูปภาพ 
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    priority: "NORMAL",
    category: "GENERAL",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ============================================
  // 3. FUNCTIONS
  // ============================================
  
  const fetchUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me"); 
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error("Failed to fetch user session", err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        // ใช้ createObjectURL เพื่อความเร็วในการพรีวิว
        setPreviewUrl(URL.createObjectURL(file));

        // แปลงเป็น Base64 เผื่อต้องใช้ส่ง API แบบเก่า
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchUserSession();
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("ACCESS DENIED: PLEASE LOGIN");

    setUploading(true);
    let finalPhotoUrl = ""; // ตัวแปรสำหรับเก็บ URL หรือ Base64 ที่จะส่ง

    try {
      
      /*
      if (selectedFile) {
        const data = new FormData();
        data.set("file", selectedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: data });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) finalPhotoUrl = uploadJson.url;
      }
      */
      
      // กรณีใช้ Base64 ส่งตรงๆ (ตามโค้ดเดิมของคุณ)
      if (!finalPhotoUrl && photoBase64) {
          finalPhotoUrl = photoBase64;
      }

      // 2. Create Ticket
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          reporterId: currentUser.wardid,
          photoUpload: finalPhotoUrl 
        }),
      });

      // 3. Reset
      setFormData({ title: "", description: "", location: "", priority: "NORMAL", category: "GENERAL" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoBase64(null);
      fetchTickets();
      alert("MISSION REPORT SUBMITTED!");
    } catch (err) {
      alert("OPERATION FAILED");
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    if (!currentUser) return;
    if (!confirm(`CONFIRM STATUS CHANGE: ${newStatus}?`)) return;
    
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          assigneeId: newStatus === 'IN_PROGRESS' ? currentUser.wardid : undefined 
        }),
      });
      fetchTickets();
    } catch (err) {
      alert("UPDATE FAILED");
    }
  };

  // Helper Styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-600 text-white border-yellow-700";
      case "IN_PROGRESS": return "bg-blue-900 text-blue-100 border-blue-950";
      case "RESOLVED": return "bg-green-800 text-green-100 border-green-900";
      case "CANCELLED": return "bg-stone-500 text-stone-200 border-stone-600";
      default: return "bg-gray-500";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-900 text-red-100 border-l-4 border-red-500";
      case "HIGH": return "bg-orange-700 text-orange-100 border-l-4 border-orange-400";
      case "NORMAL": return "bg-sky-800 text-sky-100 border-l-4 border-sky-500";
      default: return "bg-stone-600 text-stone-200 border-l-4 border-stone-400";
    }
  };

  const handleBack = () => {
    router.back();
  };

  // ============================================
  // 4. UI RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#e5e4dc] font-sans text-stone-800 pb-20 relative">
      
      {/* --- TOP BAR --- */}
      <div className="bg-[#2b3024] text-[#e5e4dc] border-b-4 border-[#4a523e] shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4a523e] rounded-sm border border-[#5f6950]">
              <Shield className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest uppercase font-mono">
                UNIT MAINTENANCE LOG
              </h1>
              <p className="text-xs text-stone-400 tracking-wider">OFFICIAL USE ONLY // SECURE CHANNEL</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
             <div className="text-xs font-mono text-yellow-500">
               OPERATOR: {currentUser ? currentUser.wardname : "IDENTIFYING..."}
             </div>
             <div className="text-xs text-stone-400">
               STATUS: {currentUser ? "ONLINE" : "CONNECTING..."}
             </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 mt-8 ">
        <div className="max-w-6xl mx-auto mt-8 mb-4 flex justify-end">
            <button
                onClick={handleBack}
                className="group flex items-end gap-2 bg-stone-600 hover:bg-stone-700 text-stone-100 px-5 py-2.5 rounded-sm border-b-4 border-stone-800 active:border-b-0 active:translate-y-1 transition-all font-bold tracking-widest uppercase text-sm shadow-md"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                ย้อนกลับ
            </button>
        </div>

        {/* --- FORM SECTION --- */}
        {currentUser ? (
        <div className="bg-[#f0f0eb] border-2 border-[#b8b6a5] shadow-sm rounded-sm mb-10 overflow-hidden">
          <div className="bg-[#dcdbc4] px-6 py-3 border-b border-[#b8b6a5] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#556b2f]" />
            <h2 className="font-bold text-[#4b5320] uppercase tracking-wider">New Incident Report</h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Title */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">
                  Subject / Issue <span className="text-red-700">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-white border border-stone-400 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f] placeholder-stone-400 font-mono text-sm"
                  placeholder="IDENTIFY THE PROBLEM..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">
                  Sector / Location <span className="text-red-700">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-white border border-stone-400 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f] placeholder-stone-400 font-mono text-sm"
                  placeholder="E.G. WARD 4, ROOM 202"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-4 col-span-2 md:col-span-1">
                <div>
                  <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">Priority Level</label>
                  <select 
                    className="w-full bg-white border border-stone-400 rounded-sm px-2 py-2 font-mono text-sm focus:ring-2 focus:ring-[#556b2f]"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">Category</label>
                  <select 
                    className="w-full bg-white border border-stone-400 rounded-sm px-2 py-2 font-mono text-sm focus:ring-2 focus:ring-[#556b2f]"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">Details</label>
                <textarea
                  className="w-full bg-white border border-stone-400 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-mono text-sm"
                  rows={3}
                  placeholder="PROVIDE OPERATIONAL DETAILS..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Photo Upload */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#556b2f] uppercase mb-1 tracking-wide">Photographic Evidence</label>
                <div className="border-2 border-dashed border-[#8c9480] bg-[#e5e4dc] hover:bg-[#dcdbc4] transition p-6 flex flex-col items-center justify-center relative cursor-pointer group rounded-sm min-h-[160px]">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    onChange={handleFileChange}
                    />
                  
                  {selectedFile && previewUrl ? (
                    <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Evidence" 
                          className="w-48 h-32 object-cover border-4 border-white shadow-lg rotate-1 grayscale-[30%] contrast-125"
                        />
                        <div className="absolute top-2 right-2 bg-red-700 text-white text-[10px] px-1 py-0.5 font-bold uppercase tracking-wider shadow">
                          CONFIDENTIAL
                        </div>
                      </div>
                      <p className="mt-2 font-mono text-xs text-[#556b2f] bg-[#dcdbc4] px-2 py-1">
                        FILE: {selectedFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-[#8c9480] group-hover:text-[#556b2f] transition">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <span className="font-bold uppercase text-sm tracking-wider">Upload Image</span>
                      <span className="text-[10px] mt-1 font-mono">MAX SIZE: 5MB // FORMAT: JPG, PNG</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full py-3 px-6 uppercase font-bold tracking-widest text-white shadow-md border-b-4 active:border-b-0 active:translate-y-1 transition-all rounded-sm
                    ${uploading 
                      ? 'bg-stone-500 border-stone-700 cursor-wait' 
                      : 'bg-[#556b2f] border-[#3e4f22] hover:bg-[#4b5320]'}`}
                >
                  {uploading ? 'TRANSMITTING DATA...' : 'SUBMIT REPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
        ) : (
            <div className="mb-10 text-center text-stone-500 font-mono text-sm animate-pulse">
                [ AUTHENTICATING OPERATOR... ]
            </div>
        )}

        {/* --- TICKET LIST --- */}
        <div className="flex items-center gap-3 mb-6 border-b-2 border-stone-300 pb-2">
          <Crosshair className="w-6 h-6 text-[#556b2f]" />
          <h2 className="text-xl font-black uppercase text-stone-700 tracking-wider">Active Field Reports</h2>
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-10 font-mono text-stone-500 animate-pulse">
               [ LOADING DATA FROM SERVER... ]
             </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-[#f0f0eb] border border-stone-300 border-dashed rounded-sm">
              <p className="text-stone-500 font-mono">NO ACTIVE INCIDENTS REPORTED.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.ticketId} className="bg-white border-l-4 shadow-sm hover:shadow-md transition duration-200 group relative overflow-hidden rounded-r-sm ticket-card"
                   style={{ borderLeftColor: ticket.priority === 'CRITICAL' ? '#7f1d1d' : ticket.priority === 'HIGH' ? '#c2410c' : '#57534e' }}>
                
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                <div className="p-5 relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm border ${getStatusStyle(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          <span className="text-xs font-mono text-stone-400">ID: #{ticket.ticketId.toString().padStart(4, '0')}</span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-800 uppercase tracking-tight mb-1 group-hover:text-[#556b2f] transition">
                        {ticket.title}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-stone-500 mb-3 border-b border-stone-100 pb-3">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> LOC: {ticket.location || "N/A"}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3"/> REP: {ticket.reporter?.wardname}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> T: {new Date(ticket.createdAt).toLocaleString('th-TH')}</span>
                      </div>

                      <div className="flex gap-4 items-start">
                          <div className="flex-1 text-sm text-stone-700 bg-[#f9f9f7] p-3 border-l-2 border-stone-300 font-mono">
                            {ticket.description || "NO ADDITIONAL INTEL."}
                          </div>

                          {/* 🟢 แก้ไข: เปลี่ยนจาก <a> เป็นปุ่มกดเพื่อเปิด Modal */}
                          {ticket.photoUpload && (
                            <button 
                              type="button"
                              onClick={() => setViewingImage(ticket.photoUpload)}
                              className="flex-shrink-0 relative group/img cursor-zoom-in"
                            >
                              <img 
                                src={ticket.photoUpload} 
                                alt="Evidence" 
                                className="w-20 h-20 object-cover border-2 border-white shadow-md grayscale-[50%] group-hover/img:grayscale-0 transition duration-300" 
                              />
                              {/* Overlay Icon */}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                  <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                              </div>
                              <div className="absolute bottom-0 right-0 bg-black text-white text-[8px] px-1 font-mono uppercase">VIEW</div>
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {currentUser?.role === 'USER' &&  (
                        <div className="flex flex-col gap-2 min-w-[120px] border-l pl-4 border-stone-100">
                          <div className="mt-2 pt-2 border-t border-stone-100">
                            <span className="text-[10px] text-stone-400 block">ASSIGNED TO:</span>
                            <span className="text-xs font-bold text-stone-700">{ticket.assignee?.wardname || "UNASSIGNED"}</span>
                          </div>
                        </div>
                    )}

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/*  5. LIGHTBOX MODAL (POPUP)                */}
      {/* ============================================ */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)} // คลิกพื้นหลังเพื่อปิด
        >
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 text-stone-400 hover:text-white hover:scale-110 transition z-50"
            onClick={() => setViewingImage(null)}
          >
             <div className="bg-stone-800/50 p-2 rounded-full border border-stone-600">
                <X className="w-8 h-8" />
             </div>
          </button>

          <div className="relative max-w-7xl w-full max-h-screen flex flex-col items-center justify-center pointer-events-none">
             <img 
               src={viewingImage} 
               alt="Full Evidence" 
               className="pointer-events-auto max-w-full max-h-[85vh] object-contain border-2 border-stone-700 shadow-2xl bg-black/50"
               onClick={(e) => e.stopPropagation()} // คลิกที่รูปจะไม่ปิด
             />
             <div className="mt-4 px-4 py-1 bg-black/80 text-yellow-500 font-mono text-xs tracking-[0.2em] border-t border-b border-yellow-900/50 uppercase">
                Confidential Evidence Material // Mode: View Only
             </div>
          </div>
        </div>
      )}

    </div>
  );
}