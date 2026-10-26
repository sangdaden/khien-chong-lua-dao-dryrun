// Chọn hoặc chụp ảnh, rồi thu nhỏ và nén để gửi lên proxy nhanh hơn.
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PickedImage = { uri: string; base64: string };

async function shrink(uri: string, width: number): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(uri);
  // Ảnh chụp màn hình điện thoại rộng ~1080-1290px; giữ 1080 để chữ vẫn đọc rõ.
  if (width > 1080) context.resize({ width: 1080 });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  return { uri: saved.uri, base64: saved.base64 ?? '' };
}

export async function pickImage(source: 'library' | 'camera'): Promise<PickedImage | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return shrink(asset.uri, asset.width);
}
