import * as THREE from 'three';
import { setupResizeHandler } from './utils/resizeHandler';
import { setupAudio } from './utils/audioHandler';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

// DOM
document.body.appendChild(renderer.domElement);

// Material
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Geometry
const geometry = new THREE.SphereGeometry(15, 32, 32);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Animation
function animate() {
  sphere.rotation.x += 0.01;
  sphere.rotation.y += 0.01;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

const uploadForm = document.getElementById('upload-form') as HTMLFormElement;
const uploadedAudio = document.getElementById('choose-file') as HTMLInputElement;

uploadForm.addEventListener(
  'submit',
  (e) => {
    e.preventDefault(); // Prevent empty uploads
    setupAudio(camera, uploadedAudio);
  },
  false
);

// Automatically adjusts content to window resizes
setupResizeHandler(camera, renderer, scene);