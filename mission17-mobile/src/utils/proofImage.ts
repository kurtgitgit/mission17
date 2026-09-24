import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_PROOF_WIDTH = 720;
const FALLBACK_PROOF_WIDTH = 540;
const MAX_ENCODED_PROOF_LENGTH = 4_500_000;

export class ProofImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofImageError';
  }
}

function toDataUrl(base64: string) {
  return `data:image/jpeg;base64,${base64}`;
}

async function compressNativeImage(uri: string, width: number, quality: number) {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!compressed.base64) {
    throw new Error('The compressed photo did not include upload data.');
  }

  return toDataUrl(compressed.base64);
}

/**
 * Produces a compact JPEG data URL for the proof-submission endpoint. Keeping
 * this under the proxy/body limit prevents a valid resident photo from failing
 * before it reaches the server.
 */
export async function createProofImagePayload(uri: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      if (!response.ok) throw new Error('The selected photo could not be opened.');

      const blob = await response.blob();
      const payload = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (payload.length > MAX_ENCODED_PROOF_LENGTH) {
        throw new ProofImageError('The photo is too large. Please choose a smaller photo and try again.');
      }

      return payload;
    }

    let payload = await compressNativeImage(uri, MAX_PROOF_WIDTH, 0.65);
    if (payload.length > MAX_ENCODED_PROOF_LENGTH) {
      payload = await compressNativeImage(uri, FALLBACK_PROOF_WIDTH, 0.45);
    }

    if (payload.length > MAX_ENCODED_PROOF_LENGTH) {
      throw new ProofImageError('The photo is too large. Please retake it and try again.');
    }

    return payload;
  } catch (error) {
    if (error instanceof ProofImageError) throw error;
    throw new ProofImageError('The photo could not be prepared for upload. Please retake it and try again.');
  }
}
