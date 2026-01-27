"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  Trash2, 
  RefreshCw,
  FileText,
  X,
  Maximize2
} from "lucide-react";

// ============================================
// 1. TYPE DEFINITIONS
// ============================================

type UserProfile = {
  wardid: number;
  warduser: string;
  wardname: string;
  role: "ADMIN" | "USER";
};

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
  finishedAt?: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  
  // State ข้อมูล
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // State UI
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // State สำหรับ Lightbox รูปภาพ (เพิ่มเข้ามา)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // ============================================
  // 2. FUNCTIONS
  // ============================================

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      
      const user: UserProfile = await res.json();
      
      if (user.role !== "ADMIN") {
        alert("ACCESS DENIED: ADMIN CLEARANCE REQUIRED");
        router.push("/tickets");
        return;
      }

      setCurrentUser(user);
      fetchTickets();
    } catch (err) {
      console.error("Auth Error:", err);
      router.push("/login");
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a: Ticket, b: Ticket) => {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority] || 
                 new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setTickets(sortedData);
      }
    } catch (err) {
      console.error("Fetch Tickets Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    if (!currentUser) return;

    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          assigneeId: newStatus === 'IN_PROGRESS' ? currentUser.wardid : undefined 
        }),
      });
      
      await fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      alert("COMMAND FAILED: UNABLE TO UPDATE STATUS");
    }
  };

  const deleteTicket = async (id: number) => {
    if (!confirm(`WARNING: PURGE RECORD #${id}? THIS ACTION CANNOT BE UNDONE.`)) return;
    try {
      await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      alert("PURGE FAILED");
    }
  };

  // Stats Calculation
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === "PENDING").length,
    critical: tickets.filter(t => t.priority === "CRITICAL" && t.status !== "RESOLVED").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length
  };

  const filteredTickets = filterStatus === "ALL" 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  // ============================================
  // 3. RENDER
  // ============================================
  
  if (!currentUser && loading) return <div className="min-h-screen bg-[#2b2b2b] flex items-center justify-center text-[#556b2f] font-mono animate-pulse">INITIALIZING SECURITY PROTOCOLS...</div>;

  return (
    <div className="min-h-screen bg-[#2b2b2b] text-gray-200 font-sans pb-20 relative">
      
      {/* --- COMMAND HEADER --- */}
      <header className="bg-[#1a1a1a] border-b-4 border-[#556b2f] sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-[#556b2f] p-2 rounded-sm shadow-[0_0_15px_rgba(85,107,47,0.6)]">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[0.2em] text-[#e5e4dc] uppercase font-mono">
               OPERATIONS
              </h1>
              <p className="text-[10px] text-[#8c9480] tracking-widest uppercase flex gap-2">
                ADMIN LEVEL 1 // OPERATOR: <span className="text-white font-bold">{currentUser?.wardname}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push("/tickets")}
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#8c9480] hover:text-[#e5e4dc] transition"
          >
            SWITCH TO FIELD VIEW &rarr;
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* --- HUD STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText size={60}/>} title="Total Reports" value={stats.total} color="text-white" border="border-[#556b2f]" />
          <StatCard icon={<Clock size={60}/>} title="Pending Action" value={stats.pending} color="text-yellow-500" border="border-yellow-600" />
          <StatCard icon={<AlertTriangle size={60}/>} title="Critical Threats" value={stats.critical} color="text-red-500" border="border-red-600" animate={stats.critical > 0} />
          <StatCard icon={<CheckCircle size={60}/>} title="Mission Success" value={stats.resolved} color="text-green-500" border="border-green-600" />
        </div>

        {/* --- CONTROL PANEL --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-[#222] p-4 rounded-sm border border-[#444]">
          <div className="flex items-center gap-2">
            <Activity className="text-[#556b2f] w-5 h-5" />
            <h2 className="text-lg font-bold tracking-widest uppercase text-[#e5e4dc]">Incoming Intel Feed</h2>
          </div>
          
          <div className="flex gap-2">
            {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${filterStatus === status 
                    ? "bg-[#556b2f] text-white border-[#556b2f]" 
                    : "bg-transparent text-[#8c9480] border-[#444] hover:border-[#556b2f]"}`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
            <button 
              onClick={fetchTickets}
              className="px-3 py-1.5 bg-[#333] text-white border border-[#444] hover:bg-[#444] transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- TICKET GRID --- */}
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-[#1a1a1a] text-[#8c9480] text-[10px] font-bold uppercase tracking-wider border-b border-[#444]">
            <div className="col-span-1">ID</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Subject / Detail</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Reporter</div>
            <div className="col-span-2 text-right">Command</div>
          </div>

          {loading ? (
             <div className="py-20 text-center text-[#556b2f] font-mono animate-pulse">ESTABLISHING UPLINK...</div>
          ) : filteredTickets.length === 0 ? (
             <div className="py-20 text-center text-[#444] font-mono">NO RECORDS FOUND IN DATABASE.</div>
          ) : (
            filteredTickets.map((ticket) => (
              <div 
                key={ticket.ticketId} 
                onClick={() => setSelectedTicket(ticket)}
                className="grid grid-cols-12 gap-4 px-4 py-4 bg-[#333] border-l-4 hover:bg-[#3a3a3a] transition items-start group cursor-pointer relative"
                style={{ 
                  borderLeftColor: ticket.priority === 'CRITICAL' ? '#ef4444' : 
                                   ticket.priority === 'HIGH' ? '#f97316' : 
                                   ticket.priority === 'NORMAL' ? '#0ea5e9' : '#78716c' 
                }}
              >
                {/* ID & Priority */}
                <div className="col-span-1">
                  <span className="font-mono text-xs text-white block">#{ticket.ticketId.toString().padStart(4, '0')}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded-sm font-bold inline-block mt-1
                    ${ticket.priority === 'CRITICAL' ? 'bg-red-900 text-red-100' : 
                      ticket.priority === 'HIGH' ? 'bg-orange-900 text-orange-100' : 'bg-gray-700 text-gray-300'}`}>
                    {ticket.priority.charAt(0)}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                   {ticket.status === 'PENDING' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                   {ticket.status === 'IN_PROGRESS' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin-slow" />}
                   {ticket.status === 'RESOLVED' && <CheckCircle className="w-5 h-5 text-green-500" />}
                   {ticket.status === 'CANCELLED' && <Activity className="w-5 h-5 text-gray-500" />}
                </div>

                {/* Content */}
                <div className="col-span-4 pr-4">
                  <h3 className="text-sm font-bold text-[#e5e4dc] uppercase mb-1 truncate">{ticket.title}</h3>
                  <p className="text-xs text-gray-400 font-mono line-clamp-2">{ticket.description}</p>
                  {ticket.assignee && (
                    <p className="text-[9px] text-blue-400 mt-1 font-mono uppercase">
                     &gt;&gt; ASSIGNED TO: {ticket.assignee.wardname}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-xs text-gray-300 font-mono">
                    <MapPin className="w-3 h-3 text-[#556b2f]" />
                    {ticket.location}
                  </div>
                </div>

                {/* Reporter */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <User className="w-3 h-3 text-[#556b2f]" />
                    {ticket.reporter.wardname}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">
                    {new Date(ticket.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </div>

                {/* Actions (Inline) */}
                <div className="col-span-2 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                   {ticket.status === 'PENDING' && (
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         updateStatus(ticket.ticketId, "IN_PROGRESS");
                       }}
                       className="w-full bg-[#1e3a8a] hover:bg-[#2e4ead] text-white text-[10px] font-bold py-1 px-2 rounded-sm uppercase tracking-wider"
                     >
                       ACKNOWLEDGE
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* 4. TICKET DETAIL MODAL (POPUP)               */}
      {/* ============================================ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1f1f1f] border border-[#556b2f] w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-10 ${
                   selectedTicket.priority === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 
                   selectedTicket.priority === 'HIGH' ? 'bg-orange-500' : 
                   'bg-[#556b2f]'
                }`}></div>
                <div>
                  <h2 className="text-xl font-black uppercase text-[#e5e4dc] tracking-wider">
                    INCIDENT REPORT #{selectedTicket.ticketId.toString().padStart(4, '0')}
                  </h2>
                  <p className="text-[10px] font-mono text-[#8c9480]">
                    CLASSIFICATION: {selectedTicket.priority} // {selectedTicket.category}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white transition">
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                  {/* Subject */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#556b2f] font-bold block mb-1">Subject</label>
                    <div className="text-xl font-bold text-white bg-[#2a2a2a] p-3 border-l-2 border-[#556b2f]">
                      {selectedTicket.title}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#556b2f] font-bold block mb-1">Detail / Situation</label>
                      <div className="text-gray-300 font-mono text-sm leading-relaxed bg-[#2a2a2a] p-4 rounded-sm border border-[#333] min-h-[100px]">
                         {selectedTicket.description}
                      </div>
                  </div>

                  {/* Meta Data Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#2a2a2a] p-3 border border-[#333]">
                         <div className="flex items-center gap-2 mb-1 text-[#8c9480] text-xs uppercase font-bold">
                            <MapPin className="w-3 h-3"/> Location
                         </div>
                         <div className="text-white text-sm font-mono">{selectedTicket.location}</div>
                      </div>
                      <div className="bg-[#2a2a2a] p-3 border border-[#333]">
                         <div className="flex items-center gap-2 mb-1 text-[#8c9480] text-xs uppercase font-bold">
                            <User className="w-3 h-3"/> Reported By
                         </div>
                         <div className="text-white text-sm font-mono">{selectedTicket.reporter.wardname}</div>
                      </div>
                      <div className="bg-[#2a2a2a] p-3 border border-[#333]">
                         <div className="flex items-center gap-2 mb-1 text-[#8c9480] text-xs uppercase font-bold">
                            <Clock className="w-3 h-3"/> Timestamp
                         </div>
                         <div className="text-white text-sm font-mono">{new Date(selectedTicket.createdAt).toLocaleString('th-TH')}</div>
                      </div>
                      <div className="bg-[#2a2a2a] p-3 border border-[#333]">
                         <div className="flex items-center gap-2 mb-1 text-[#8c9480] text-xs uppercase font-bold">
                            <Activity className="w-3 h-3"/> Current Status
                         </div>
                         <div className={`text-sm font-bold uppercase
                            ${selectedTicket.status === 'PENDING' ? 'text-yellow-500' : 
                             selectedTicket.status === 'IN_PROGRESS' ? 'text-blue-500' : 
                             selectedTicket.status === 'RESOLVED' ? 'text-green-500' : 'text-gray-500'}`}>
                            {selectedTicket.status.replace("_", " ")}
                         </div>
                      </div>
                  </div>
                </div>

                {/* Right Column: Evidence / Actions */}
                <div className="md:col-span-1 space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-[#556b2f] font-bold block">Visual Evidence</label>
                  
                  <div className="bg-black border border-[#333] h-48 flex items-center justify-center relative group overflow-hidden">
                    {selectedTicket.photoUpload ? (
                      // เปลี่ยนจาก <a> เป็น <div> และใส่ onClick
                      <div 
                        onClick={() => setEnlargedImage(selectedTicket.photoUpload)}
                        className="w-full h-full cursor-pointer relative"
                      >
                        <img 
                          src={selectedTicket.photoUpload} 
                          alt="Evidence" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                           <span className="text-white text-xs font-mono flex items-center gap-1 border border-white px-2 py-1">
                             <Maximize2 className="w-3 h-3"/> ENLARGE
                           </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-600 text-xs font-mono flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 opacity-20"/>
                        NO VISUAL DATA
                      </div>
                    )}
                  </div>
                  
                  {/* Action Panel in Modal */}
                  <div className="border-t border-[#333] pt-4 mt-4">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">Command Override</label>
                      <div className="space-y-2">
                        {selectedTicket.status === 'PENDING' && (
                           <button 
                              onClick={() => updateStatus(selectedTicket.ticketId, 'IN_PROGRESS')}
                              className="w-full bg-[#1e3a8a] hover:bg-[#2e4ead] text-white py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg"
                           >
                              <RefreshCw className="w-4 h-4"/> Acknowledge
                           </button>
                        )}
                        {selectedTicket.status === 'IN_PROGRESS' && (
                           <button 
                              onClick={() => updateStatus(selectedTicket.ticketId, 'RESOLVED')}
                              className="w-full bg-[#14532d] hover:bg-[#1a6b3a] text-white py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg"
                           >
                              <CheckCircle className="w-4 h-4"/> Mark Resolved
                           </button>
                        )}
                        <button 
                           onClick={() => deleteTicket(selectedTicket.ticketId)}
                           className="w-full border border-red-900/50 hover:bg-red-900/20 text-red-500 py-2 font-mono uppercase text-xs flex items-center justify-center gap-2 transition"
                        >
                           <Trash2 className="w-3 h-3"/> Purge Record
                        </button>
                      </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-2 bg-[#1a1a1a] border-t border-[#333] text-center">
               <p className="text-[9px] text-[#444] font-mono">SECURE CONNECTION // LOGGING ACTIONS BY: {currentUser?.wardname.toUpperCase()}</p>
            </div>

          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 5. LIGHTBOX MODAL (IMAGE ENLARGE)            */}
      {/* ============================================ */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          {/* Container for Image & Close Button */}
          <div className="relative max-w-7xl max-h-screen w-full flex items-center justify-center">
            
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 md:-top-12 md:-right-0 text-white hover:text-[#556b2f] transition flex items-center gap-2 font-mono bg-black/50 px-3 py-1 border border-white/20 rounded"
              onClick={() => setEnlargedImage(null)}
            >
              <X className="w-5 h-5"/> CLOSE VISUAL
            </button>

            {/* The Image */}
            <img 
              src={enlargedImage} 
              alt="Enlarged Evidence" 
              className="max-h-[90vh] w-auto object-contain border border-[#333] shadow-[0_0_50px_rgba(85,107,47,0.2)]"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Component for Stats
function StatCard({ icon, title, value, color, border, animate = false }: any) {
  return (
    <div className={`bg-[#333] border-l-4 ${border} p-4 shadow-lg relative overflow-hidden group ${animate ? 'animate-pulse-slow' : ''}`}>
      <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition text-white">{icon}</div>
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${color.replace("text-", "text-opacity-80 text-")}`}>{title}</h3>
      <p className={`text-4xl font-mono font-bold ${color}`}>{value}</p>
    </div>
  )
}