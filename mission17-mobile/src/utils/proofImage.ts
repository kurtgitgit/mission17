import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_PROOF_WIDTH = 720;

/**
 * Produces a compact JPEG data URL for the proof-submission endpoint. Keeping
 * this under the proxy/body limit prevents a valid resident photo from failing
 * before it reaches the server.
 */
export async function createProofImagePayload(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_PROOF_WIDTH } }],
    { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}
