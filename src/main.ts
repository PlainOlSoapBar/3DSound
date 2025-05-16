import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { vertexShader } from './shaders/vertexShader';
import { fragmentShader } from './shaders/fragmentShader';
import { EffectComposer } from 'three/addons/postprocessing//EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;
let audio: THREE.Audio, listener: THREE.AudioListener, audioLoader: THREE.AudioLoader;
let uploadForm: HTMLFormElement, uploadedAudio: HTMLInputElement;

init();

function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;
  scene.add(camera);

  // Render setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor('#000000');
  document.body.appendChild(renderer.domElement);

  // Orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Requires animation loop to function
  controls.dampingFactor = 0.01;
  controls.enablePan = false;
  controls.update();

  // Uploading audio file
  uploadForm = document.getElementById('upload-form') as HTMLFormElement;
  uploadedAudio = document.getElementById('choose-file') as HTMLInputElement;
  uploadForm.addEventListener(
    'submit',
    (e) => {
      e.preventDefault(); // Prevent empty uploads
      setAudio();
    },
    false
  );
}

function setAudio() {
  const audioFile = uploadedAudio.files?.[0];
  if (!audioFile) {
    return;
  }

  if (audio) {
    audio.pause();
    audio.remove();
  }

  const audioURL = URL.createObjectURL(audioFile);

  listener = new THREE.AudioListener();
  camera.add(listener);

  audio = new THREE.Audio(listener);

  audioLoader = new THREE.AudioLoader();
  audioLoader.load(audioURL, function (buffer) {
    audio.setBuffer(buffer);
    audio.play();
  });

  resetVisualizer();
  startVisualizer();
}

function resetVisualizer() {
  scene.children = scene.children.filter((obj) => obj.type === 'Camera' || obj.type.includes('Light'));
}

function startVisualizer() {
  // Don't start if no audio is provided
  if (!audio) {
    return;
  }

  // Audio analyzer
  const analyser = new THREE.AudioAnalyser(audio, 32);
  const uniforms = {
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
  };

  // Sphere Mesh
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms,
    wireframe: true,
    vertexShader,
    fragmentShader,
  });
  const geometry = new THREE.IcosahedronGeometry(4, 30);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lighting
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.8, 0.5);

  const outputPass = new OutputPass();
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(outputPass);

  // Window resizing
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    bloomComposer.setSize(width, height);
  });

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    uniforms.u_frequency.value = analyser.getAverageFrequency();
    uniforms.u_time.value = clock.getElapsedTime();

    controls.update();

    requestAnimationFrame(animate);
    bloomComposer.render(); // this does the actual render
  }

  renderer.setAnimationLoop(animate);
}
