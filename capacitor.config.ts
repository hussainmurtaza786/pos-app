  import type { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'com.pos.app',
    appName: 'pos-app',
    webDir: 'public',
    server:{
      url:"http://192.168.100.49:3000",
      cleartext: true,
    }
  };

  export default config;
