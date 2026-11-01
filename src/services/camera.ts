// Camera bridge for native iOS via @capacitor/camera.
// Web users continue to use the existing getUserMedia + <video> + canvas pipeline in SnapMode.tsx.
// On native iOS, calling captureNativeCamera() opens the system camera UI with proper permission flow.

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedImage {
  /** "data:image/jpeg;base64,..." */
  dataUrl: string;
  /** e.g. "image/jpeg" */
  mimeType: string;
}

export const isNativeCamera = Capacitor.isNativePlatform();

export async function captureNativeCamera(): Promise<CapturedImage> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    saveToGallery: false,
  });
  const format = photo.format ?? 'jpeg';
  return {
    dataUrl: photo.dataUrl ?? '',
    mimeType: `image/${format}`,
  };
}

export async function pickFromGallery(): Promise<CapturedImage> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });
  const format = photo.format ?? 'jpeg';
  return {
    dataUrl: photo.dataUrl ?? '',
    mimeType: `image/${format}`,
  };
}
