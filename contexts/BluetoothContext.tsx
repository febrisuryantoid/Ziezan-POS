import React, { createContext, useContext, useState, useEffect } from 'react';
import { bluetoothService } from '../services/bluetooth';
import { BluetoothCommand } from '../types';

interface BluetoothContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (cmd: BluetoothCommand) => Promise<boolean>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check initial status (though usually false on load)
    setIsConnected(bluetoothService.isConnected());

    // Listen for disconnections
    const handleDisconnect = () => setIsConnected(false);
    window.addEventListener('bluetooth-disconnected', handleDisconnect);
    
    return () => window.removeEventListener('bluetooth-disconnected', handleDisconnect);
  }, []);

  const connect = async () => {
    const connected = await bluetoothService.connect();
    setIsConnected(connected);
  };

  const disconnect = () => {
    bluetoothService.disconnect();
    setIsConnected(false);
  };

  const sendCommand = async (cmd: BluetoothCommand) => {
    return await bluetoothService.sendCommand(cmd);
  };

  return (
    <BluetoothContext.Provider value={{ isConnected, connect, disconnect, sendCommand }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) throw new Error("useBluetooth must be used within BluetoothProvider");
  return context;
};