import React from 'react';
import ReactDOM from 'react-dom';

// 1. กำหนด Interface สำหรับ Props
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการลบข้อมูล?", 
  message = "คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้" 
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 antialiased">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-red-50 rounded-full p-6 ring-[12px] ring-red-50/50">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-gray-500 text-lg leading-relaxed px-2">
            {message}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} 
            className="w-full bg-red-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
          >
            ลบข้อมูล
          </button>
          <button 
            onClick={onClose} 
            className="w-full bg-white text-gray-500 px-6 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 border border-gray-100 transition-all active:scale-[0.98]"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;