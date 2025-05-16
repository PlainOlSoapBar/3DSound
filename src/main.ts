import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { vertexShader } from './shaders/vertexShader';
import { fragmentShader } from './shaders/fragmentShader';
import { GUI } from 'lil-gui';
import { EffectComposer } from 'three/addons/postprocessing//EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;
let audio: THREE.Audio, listener: THREE.AudioListener, audioLoader: THREE.AudioLoader;
let uploadForm: HTMLFormElement, uploadedAudio: HTMLInputElement;
let bloomComposer: EffectComposer;
let mesh: THREE.Mesh;

interface BloomParams {
  red: number;
  green: number;
  blue: number;
  strength: number;
  radius: number;
  threshold: number;
}

let params: BloomParams;

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

  // Listener
  listener = new THREE.AudioListener();
  camera.add(listener);

  // GUI
  params = {
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    strength: 0.4,
    radius: 0.8,
    threshold: 0.5,
  };
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

  // Dispose old mesh before creating new one
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    mesh = undefined as any;
  }
}

function startVisualizer() {
  // Don't start if no audio is provided
  if (!audio) {
    return;
  }

  // Dispose previous render targets
  if (bloomComposer) {
    bloomComposer.dispose();
  }

  // Audio analyzer
  const analyser = new THREE.AudioAnalyser(audio, 32);
  const uniforms = {
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: params.red },
    u_green: { value: params.green },
    u_blue: { value: params.blue },
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
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lighting
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.strength, params.radius, params.threshold);

  const outputPass = new OutputPass();
  bloomComposer = new EffectComposer(renderer);
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(outputPass);

  // GUI
  const gui = new GUI();

  const colorsFolder = gui.addFolder('Colors');
  colorsFolder.add(params, 'red', 0, 1).onChange(function (value: number) {
    uniforms.u_red.value = Number(value);
  });
  colorsFolder.add(params, 'green', 0, 1).onChange(function (value: number) {
    uniforms.u_green.value = Number(value);
  });
  colorsFolder.add(params, 'blue', 0, 1).onChange(function (value: number) {
    uniforms.u_blue.value = Number(value);
  });

  const bloomFolder = gui.addFolder('Bloom');
  bloomFolder.add(params, 'threshold', 0, 1).onChange(function (value: number) {
    bloomPass.threshold = Number(value);
  });
  bloomFolder.add(params, 'strength', 0, 3).onChange(function (value: number) {
    bloomPass.strength = Number(value);
  });
  bloomFolder.add(params, 'radius', 0, 1).onChange(function (value: number) {
    bloomPass.radius = Number(value);
  });

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

    bloomComposer.render(); // this does the actual render
  }

  renderer.setAnimationLoop(animate);
}
