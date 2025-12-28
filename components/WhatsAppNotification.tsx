
import React, { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface WhatsAppNotificationProps {
  alert: { name: string; id: string } | null;
  onClose: () => void;
}

const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({ alert, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for fade out animation
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  if (!alert && !isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-[100] w-80 transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="bg-[#202c33] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        <div className="bg-[#00a884] p-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-80 leading-none">WhatsApp Business</p>
              <p className="text-xs font-black leading-tight">Central Remoção</p>
            </div>
          </div>
          <button onClick={() => { setIsVisible(false); setTimeout(onClose, 500); }} className="hover:bg-black/10 rounded-full p-1 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-white text-sm">
            Olá <span className="font-bold">{alert?.name || 'Cliente'}</span>, sua lista <span className="text-[#00a884] font-bold">#{alert?.id || '001'}</span> acaba de atingir <span className="font-black">90%</span> de conclusão. Verifique o painel!
          </p>
          <div className="mt-3 flex items-center justify-end text-[10px] text-[#8696a0] font-medium">
            Agora • <span className="ml-1 text-[#53bdeb] uppercase">Visualizar</span>
          </div>
        </div>
      </div>
      {/* Sound simulation effect can be added here if needed */}
    </div>
  );
};

export default WhatsAppNotification;
