import { BluetoothCommand } from '../types';

// --- Web Bluetooth API Types Polyfill ---
interface BluetoothLEScanFilter {
  name?: string;
  namePrefix?: string;
  services?: (string | number)[];
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: (string | number)[];
  acceptAllDevices?: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements?(): Promise<void>;
}

interface Bluetooth {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}
// ----------------------------------------

// Standard Serial Port Service UUID (Commonly used for generic modules like HC-05/HM-10 or custom apps)
// In a real scenario, the TV App must advertise this specific UUID.
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  public isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  public async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        console.warn('Web Bluetooth API is not available in this browser.');
        return false;
      }

      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        // optionalServices: ['battery_service'] // Add other services if needed
      });

      if (!this.device) return false;

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);

      console.log('Connecting to GATT Server...');
      if (!this.device.gatt) {
        throw new Error("GATT server not found on device");
      }
      this.server = await this.device.gatt.connect();

      console.log('Getting Service...');
      const service = await this.server.getPrimaryService(SERVICE_UUID);

      console.log('Getting Characteristic...');
      this.characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      console.log('Bluetooth Connected!');
      return true;
    } catch (error) {
      console.error('Bluetooth Connection Failed:', error);
      return false;
    }
  }

  public disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  private onDisconnected = () => {
    console.log('Bluetooth Device Disconnected');
    this.cleanup();
    // Dispatch event for UI update
    window.dispatchEvent(new Event('bluetooth-disconnected'));
  };

  private cleanup() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  public async sendCommand(command: BluetoothCommand): Promise<boolean> {
    if (!this.characteristic) {
      console.warn('Bluetooth not connected. Command ignored:', command);
      return false;
    }

    try {
      // Protocol: COMMAND|VALUE
      // Example: START|3600  (Start for 1 hour)
      // Example: STOP
      let message = command.type;
      if (command.durationSeconds !== undefined) {
        message += `|${command.durationSeconds}`;
      }

      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(message));
      console.log('Sent BT Command:', message);
      return true;
    } catch (error) {
      console.error('Failed to send Bluetooth command:', error);
      return false;
    }
  }
}

export const bluetoothService = new BluetoothService();