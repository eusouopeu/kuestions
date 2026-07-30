import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pedroteles.kumonfiscal",
  appName: "Kuestions",
  webDir: "dist",
  android: {
    backgroundColor: "#F6F5F0",
  },
  ios: {
    backgroundColor: "#F6F5F0",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorSQLite: {
      // Android: banco em armazenamento interno do app (não requer permissão).
      androidIsEncryption: false,
      // iOS: grupo padrão; o banco vive no sandbox do app.
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: false,
    },
  },
};

export default config;
