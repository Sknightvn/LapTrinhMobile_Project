import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5001/api';
    }

    if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) {
        return 'http://10.0.2.2:5001/api';
    }

    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];
        return `http://${host}:5001/api`;
    }

    return 'http://localhost:5001/api';
};

export const API_URL = getApiUrl();

console.log('📡 API URL:', API_URL);