import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RfidService } from '../core/services/rfid.service';
import { Subscription } from 'rxjs';
import { Device } from '@capacitor/device';

interface TagInfo {
  epc: string;
  rssi: string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  currentTag: TagInfo | null = null;
  tagList: TagInfo[] = [];
  isReading: boolean = false;
  power: number = 20; // Valor por defecto
  private tagSubscription?: Subscription;
  private triggerSubscription?: Subscription;

  constructor(
    private rfidService: RfidService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.detectedId();


    // Suscripción a tags
    this.tagSubscription = this.rfidService.getCurrentTag().subscribe(
      (tag) => {
        if (tag) {
          console.log('Tag recibido en subscription:', tag);
          this.currentTag = tag;
          // Verificar el estado actual de la lista antes de agregar
          console.log('Lista actual antes de agregar:', this.tagList);
          this.addUniqueTag(tag);
          // Verificar el estado después de intentar agregar
          console.log('Lista después de agregar:', this.tagList);
        }
      },
      (error) => {
        console.error('Error en la suscripción:', error);
      }
    );

    // Suscripción al estado del trigger
    this.triggerSubscription = this.rfidService
      .getTriggerState()
      .subscribe((isPressed) => {
        console.log('Estado del trigger:', isPressed);
        this.isReading = isPressed;
        this.cdr.detectChanges();
      });

    // Obtener la potencia actual al iniciar
    this.getCurrentPower();
  }


  async detectedId() {
    try {
      const info = await Device.getId();
      console.log('ID del dispositivo:', info.identifier);
      console.log('UUID:', info);

      const deviceId = await this.rfidService.getDeviceId();
      console.log('ID del dispositivo JAVA:', deviceId.id);


      // También podemos obtener más información del dispositivo
      const deviceInfo = await Device.getInfo();
      console.log('Información del dispositivo:', {
        modelo: deviceInfo.model,
        plataforma: deviceInfo.platform,
        sistemaOperativo: deviceInfo.operatingSystem,
        versionSO: deviceInfo.osVersion,
        fabricante: deviceInfo.manufacturer,
      });

      return info.identifier;
    } catch (error) {
      console.error('Error al detectar el ID del dispositivo:', error);
      return null;
    }
  }

  async getCurrentPower() {
    try {
      const powerResponse = await this.rfidService.getPower();
      if (powerResponse.success) {
        this.power = powerResponse.power;
      }
    } catch (error) {
      console.error('Error al obtener la potencia:', error);
    }
  }

  async initReader() {
    try {
      const result = await this.rfidService.startReading();
      if (result.success) {
        this.isReading = true;
        console.log('Reader RFID started:', result.message);
      } else {
        console.error('Error starting reader:', result.message);
      }
    } catch (error) {
      console.error('Error starting reader:', error);
      this.isReading = false;
    }
  }

  async stopReader() {
    try {
      const result = await this.rfidService.stopReading();
      if (result.success) {
        this.isReading = false;
        this.currentTag = null;
        this.tagList = [];
        console.log('Reader RFID stopped:', result.message);
      } else {
        console.error('Error stopping reader:', result.message);
      }
    } catch (error) {
      console.error('Error stopping reader:', error);
      this.isReading = false;
    }
  }

  async setPower(power: any) {
    console.log('Potencia recibida:', power);
    try {
      const result = await this.rfidService.setPower(power);
      console.log('Resultado de la configuración de potencia:', result);
      if (result.success) {
        this.power = result.power;
        console.log('Potencia actualizada:', this.power);
      } else {
        console.error('Error al configurar la potencia');
      }
    } catch (error) {
      console.error('Error al configurar la potencia:', error);
    }
  }

  async getLastInventoryTag() {
    try {
      const result = await this.rfidService.getInventoryTag();
      if (result.success && result.epc && result.rssi) {
        this.currentTag = {
          epc: result.epc,
          rssi: result.rssi,
        };
        console.log('Last tag in inventory:', this.currentTag);
      }
    } catch (error) {
      console.error('Error getting last tag:', error);
    }
  }

  private addUniqueTag(tag: TagInfo) {
    console.log('Intentando agregar tag:', tag);
    const exists = this.tagList.some((existingTag) => {
      const isMatch = existingTag.epc === tag.epc;
      console.log(`Comparando ${existingTag.epc} con ${tag.epc}: ${isMatch}`);
      return isMatch;
    });

    if (!exists) {
      console.log('Tag nuevo encontrado, agregando a la lista');
      this.tagList = [...this.tagList, { ...tag }];
      console.log('Nueva longitud de la lista:', this.tagList.length);
      this.cdr.detectChanges(); // Forzar la detección de cambios
    } else {
      console.log('Tag duplicado, no se agrega');
    }
  }

  ngOnDestroy() {
    if (this.tagSubscription) {
      this.tagSubscription.unsubscribe();
    }
    if (this.triggerSubscription) {
      this.triggerSubscription.unsubscribe();
    }
    this.rfidService.dispose();
  }
}
