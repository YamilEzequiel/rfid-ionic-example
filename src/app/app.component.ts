import { Component } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  deviceInfo: any = {};

  constructor(private platform: Platform) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    await this.getDeviceInfo();
  }

  async getDeviceInfo() {
    this.deviceInfo = {
      info: await Device.getInfo(),
      battery: await Device.getBatteryInfo(),
      language: await Device.getLanguageCode()
    };
    console.log(Device);
    console.log('Device Info:', this.deviceInfo);
  }
}
