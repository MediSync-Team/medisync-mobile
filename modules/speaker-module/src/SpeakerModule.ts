import { NativeModules, Platform } from 'react-native';

const { SpeakerModule } = NativeModules;

export function setSpeakerphoneOn(enabled: boolean): void {
  if (Platform.OS === 'android' && SpeakerModule) {
    SpeakerModule.setSpeakerphoneOn(enabled);
  }
}
