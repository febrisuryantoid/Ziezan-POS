
import React from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptProps {
  promptEvent: any;
  onClose: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ promptEvent, onClose }) => {
  
  const handleInstallClick = async () => {
    if (!promptEvent) return;

    // Show the browser's install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    
    // We've used the prompt, and can't use it again, so close the banner
    onClose();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[1000] bg-popover/80 backdrop-blur-2xl border border-border rounded-[2rem] p-4 shadow-2xl animate-slide-in flex items-center gap-4">
      <img 
        src="https://beeimg.com/images/t47564105964.png" 
        alt="App Icon" 
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg border border-white/10" 
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-base sm:text-lg text-foreground leading-tight">Install Ziezan Station</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-tight mt-1 truncate">Get the full-screen app experience.</p>
      </div>
      <button 
        onClick={handleInstallClick} 
        className="btn-primary h-10 sm:h-12 px-4 sm:px-5 text-xs shrink-0"
      >
        <Download size={16}/>
        <span>Install</span>
      </button>
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss install notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallPrompt;
