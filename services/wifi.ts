import { supabase } from './supabaseClient';
import { BluetoothCommandType } from '../types';

export interface RemoteCommandPayload {
  type: BluetoothCommandType;
  durationSeconds?: number;
  memberName?: string;
  timestamp: number;
}

class WifiService {
  /**
   * Mengirim perintah ke TV yang sedang mendengarkan Channel Console ID tertentu.
   */
  public async sendCommand(consoleId: string, command: BluetoothCommandType, durationSeconds?: number, memberName?: string) {
    const channelName = `console-room:${consoleId}`;
    
    // Pastikan channel ada (subscribe sebentar untuk send, lalu unsubscribe tidak masalah, 
    // tapi lebih baik stateless send jika memungkinkan, namun Supabase butuh active channel untuk broadcast)
    const channel = supabase.channel(channelName);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const payload: RemoteCommandPayload = {
          type: command,
          durationSeconds,
          memberName,
          timestamp: Date.now()
        };

        await channel.send({
          type: 'broadcast',
          event: 'remote_command',
          payload: payload
        });
        
        console.log(`[Wi-Fi] Command ${command} sent to ${consoleId}`);
        
        // Cleanup: remove channel after sending to prevent leak
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  }

  /**
   * Untuk TV Receiver: Mendengarkan perintah masuk
   */
  public listenForCommands(consoleId: string, onCommand: (payload: RemoteCommandPayload) => void) {
    const channelName = `console-room:${consoleId}`;
    console.log(`[Wi-Fi] Listening on ${channelName}`);

    const channel = supabase.channel(channelName)
      .on(
        'broadcast',
        { event: 'remote_command' },
        (event) => {
          console.log('[Wi-Fi] Command Received:', event.payload);
          onCommand(event.payload as RemoteCommandPayload);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      console.log(`[Wi-Fi] Stopped listening on ${channelName}`);
      supabase.removeChannel(channel);
    };
  }
}

export const wifiService = new WifiService();