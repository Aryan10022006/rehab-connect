import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../config/firebase";

export async function uploadClinicPhoto(file, clinicId) {
  const storage = getStorage(app);
  const storageRef = ref(storage, `clinics/${clinicId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}