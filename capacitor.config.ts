import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'example-rfid',
  webDir: 'www',
  plugins: {
    RFIDUHF: {
      enabled: true
    }
  }
};

export default config;
