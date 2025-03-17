import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { registerPlugin } from '@capacitor/core';
import { RFIDPluginPlugin } from 'capacitor-plugin-rfid';

// Interfaces
interface RFIDResponse {
  success: boolean;
  message?: string;
}

interface TagInfo {
  epc: string;
  rssi: string;
}

interface PowerResponse {
  success: boolean;
  power: number;
}

interface KeyEventInfo {
  state: string;
  keyCode: number;
  keyName: string;
}

@Injectable({
  providedIn: 'root',
})
export class RfidService {
  private plugin = registerPlugin<RFIDPluginPlugin>('RFIDUHF');
  private tagSubject = new BehaviorSubject<TagInfo | null>(null);
  private triggerStateSubject = new BehaviorSubject<boolean>(false);
  private keyEventSubject = new BehaviorSubject<KeyEventInfo | null>(null);

  public currentTag$ = this.tagSubject.asObservable();
  public triggerState$ = this.triggerStateSubject.asObservable();
  public keyEvent$ = this.keyEventSubject.asObservable();

  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Configurar listeners de inicialización
      await this.plugin.addListener('initSuccess', (data) => {
        console.log('Inicialización exitosa:', data.message);
        this.initialized = true;
      });

      await this.plugin.addListener('initError', (data) => {
        console.error('Error de inicialización:', data.message);
        this.initialized = false;
      });

      // Setting listener de tags
      await this.plugin.addListener('tagFound', (result: TagInfo) => {
        this.tagSubject.next(result);
        console.log('Tag result:', result);
      });

      // Setting listeners del trigger
      await this.plugin.addListener('triggerPressed', async (data) => {
        console.log('Trigger pressed:', data.message);
        this.triggerStateSubject.next(true);
        await this.startReading();
      });

      await this.plugin.addListener('triggerReleased', async (data) => {
        console.log('Trigger released:', data.message);
        this.triggerStateSubject.next(false);
        await this.stopReading();
      });

      // Setting listener events of keyboard
      await this.plugin.addListener('keyEvent', (data: KeyEventInfo) => {
        this.keyEventSubject.next(data);
        if (data.state === 'pressed') {
          console.log(
            `Key pressed - Code: ${data.keyCode}, Name: ${data.keyName}`
          );
        } else if (data.state === 'released') {
          console.log(
            `Key released - Code: ${data.keyCode}, Name: ${data.keyName}`
          );
        }
      });

      const response = await this.plugin.initReader();
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error initializing RFID:', error);
      throw error;
    }
  }

  async startReading(): Promise<RFIDResponse> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      return await this.plugin.startReading();
    } catch (error: any) {
      console.error('Error starting reading:', error);
      return { success: false, message: error.message };
    }
  }

  async stopReading(): Promise<RFIDResponse> {
    try {
      if (!this.initialized) {
        return { success: false, message: 'RFID no inicializado' };
      }
      return await this.plugin.stopReading();
    } catch (error: any) {
      console.error('Error stopping reading:', error);
      return { success: false, message: error.message };
    }
  }

  async setPower(power: number): Promise<PowerResponse> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, power: 0 };
      }
      return await this.plugin.setPower({ power });
    } catch (error: any) {
      console.error('Error setting power:', error);
      return { success: false, power: 0 };
    }
  }

  async getPower(): Promise<PowerResponse> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, power: 0 };
      }
      return await this.plugin.getPower();
    } catch (error: any) {
      console.error('Error getting power:', error);
      return { success: false, power: 0 };
    }
  }

  async getInventoryTag(): Promise<{
    epc?: string;
    rssi?: string;
    success: boolean;
    message?: string;
  }> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, message: 'No disponible en plataforma web' };
      }
      return await this.plugin.getInventoryTag();
    } catch (error: any) {
      console.error('Error getting tag from inventory:', error);
      return { success: false, message: error.message };
    }
  }

  async free(): Promise<RFIDResponse> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, message: 'No disponible en plataforma web' };
      }
      const result = await this.plugin.free();
      this.initialized = false;
      this.tagSubject.next(null);
      return result;
    } catch (error: any) {
      console.error('Error freeing resources:', error);
      return { success: false, message: error.message };
    }
  }

  async getDeviceId(): Promise<{ success: boolean; id: string }> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, id: '' };
      }
      const result = await this.plugin.getDeviceId();
      return result;
    } catch (error: any) {
      console.error('Error getting device ID:', error);
      return { success: false, id: '' };
    }
  }

  getCurrentTag(): Observable<TagInfo | null> {
    return this.currentTag$;
  }

  getLastTag(): TagInfo | null {
    return this.tagSubject.getValue();
  }

  getKeyEvents(): Observable<KeyEventInfo | null> {
    return this.keyEvent$;
  }

  getLastKeyEvent(): KeyEventInfo | null {
    return this.keyEventSubject.getValue();
  }

  getTriggerState(): Observable<boolean> {
    return this.triggerState$;
  }

  async dispose(): Promise<void> {
    try {
      await this.free();
      this.initialized = false;
      this.tagSubject.next(null);
      this.triggerStateSubject.next(false);
      this.keyEventSubject.next(null);
    } catch (error) {
      console.error('Error freeing resources:', error);
    }
  }
}
