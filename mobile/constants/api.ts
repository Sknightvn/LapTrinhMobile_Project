import { Platform } from 'react-native';

// Use 10.0.2.2 on Android emulator to reach the host machine's localhost.
// Use localhost for iOS simulator and web/dev on the same machine.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_URL = `http://${HOST}:5001/api`;
