import * as THREE from 'three';

let audioFile;
let audioURL;
const uploadForm = document.getElementById('upload-form') as HTMLFormElement;

export function setupAudio(camera: THREE.Camera, uploadedAudio?: any) {
  // Create and add an AudioListener to the camera
  const listener = new THREE.AudioListener();
  camera.add(listener);

  // Create a global audio source
  const audio = new THREE.Audio(listener);

  if (uploadedAudio) {
    // Create URL object from uploaded audio file
    audioFile = uploadedAudio.files[0];
    audioURL = URL.createObjectURL(audioFile);

    // Load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(audioURL, function (buffer) {
      audio.setBuffer(buffer);
      audio.setVolume(0.3);
      audio.play();
    });
  }

  // If another audio is uploaded, stop the current audio
  uploadForm.addEventListener(
    'submit',
    () => {
      audio.stop();
    },
    false
  );
}