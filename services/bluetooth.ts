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
  uuid: string;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
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

// COMMON UUIDS
// 1. Custom TV Control (HM-10/HC-05 default)
const SERIAL_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const SERIAL_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

// 2. Standard Printer UUIDs (Generic)
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'; 

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
        alert('Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android.');
        return false;
      }

      console.log('Requesting Bluetooth Device...');
      // Request device with broad filters to find both custom hardware and printers
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
            SERIAL_SERVICE_UUID, 
            PRINTER_SERVICE_UUID,
            '00001800-0000-1000-8000-00805f9b34fb' // Generic Access
        ] 
      });

      if (!this.device) return false;

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);

      console.log('Connecting to GATT Server...');
      if (!this.device.gatt) {
        throw new Error("GATT server not found on device");
      }
      this.server = await this.device.gatt.connect();

      console.log('Discovering Services...');
      // Try to find the correct service and characteristic dynamically
      // Priority 1: Serial (TV Control)
      try {
        const service = await this.server.getPrimaryService(SERIAL_SERVICE_UUID);
        this.characteristic = await service.getCharacteristic(SERIAL_CHAR_UUID);
        console.log('Connected to Serial/TV Control Service');
      } catch (e) {
        console.log('Serial service not found, trying generic printer...');
        // Priority 2: Generic Printer or First Available Writable Characteristic
        try {
            // Get all services
            const services = await this.server.getPrimaryServices();
            for (const service of services) {
                const characteristics = await service.getCharacteristics();
                for (const char of characteristics) {
                    // Check if writable (naive check, usually fine for simple thermal printers)
                    this.characteristic = char;
                    console.log('Connected to Generic Service:', service, 'Char:', char.uuid);
                    break;
                }
                if (this.characteristic) break;
            }
        } catch (err) {
            console.error("Could not find suitable service", err);
        }
      }

      if (this.characteristic) {
          console.log('Bluetooth Connected Ready!');
          return true;
      } else {
          alert("Gagal menemukan layanan tulis pada perangkat ini.");
          this.disconnect();
          return false;
      }
      
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
    window.dispatchEvent(new Event('bluetooth-disconnected'));
  };

  private cleanup() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  /**
   * Send text command (TV Control)
   */
  public async sendCommand(command: BluetoothCommand): Promise<boolean> {
    if (!this.characteristic) {
      console.warn('Bluetooth not connected.');
      return false;
    }

    try {
      let message = command.type;
      if (command.durationSeconds !== undefined) {
        message += `|${command.durationSeconds}`;
      }
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(message));
      return true;
    } catch (error) {
      console.error('Failed to send Bluetooth command:', error);
      return false;
    }
  }

  /**
   * Send Raw Bytes (For Thermal Printer ESC/POS)
   */
  public async sendRawData(data: Uint8Array): Promise<boolean> {
      if (!this.characteristic) {
          console.warn('Bluetooth not connected for printing.');
          return false;
      }
      try {
          // Send in chunks of 512 bytes to prevent overflow
          const chunkSize = 512;
          for (let i = 0; i < data.length; i += chunkSize) {
              const chunk = data.slice(i, i + chunkSize);
              await this.characteristic.writeValue(chunk);
          }
          return true;
      } catch (error) {
          console.error('Failed to print via Bluetooth:', error);
          alert('Gagal mengirim data ke printer. Pastikan printer nyala dan terhubung.');
          return false;
      }
  }
}

export const bluetoothService = new BluetoothService();