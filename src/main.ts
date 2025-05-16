import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;
scene.add(camera);

// Rendering
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor('#ffffff');
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

function render() {
  renderer.render(scene, camera);
}

render();

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 20, 100);
controls.enableDamping = true; // Requires animation loop to function
controls.dampingFactor = 0.01;
controls.enablePan = false;
controls.update();

// Animation loop
function animate() {
  controls.update();
  render();
}

// Visualizer
const noise = createNoise3D();
let audio: HTMLAudioElement | undefined;

const uploadForm = document.getElementById('upload-form') as HTMLFormElement;
const uploadedAudio = document.getElementById('choose-file') as HTMLInputElement;

uploadForm.addEventListener(
  'submit',
  (e) => {
    e.preventDefault(); // Prevent empty uploads
    setAudio();
  },
  false
);

function setAudio() {
  if (audio) {
    audio.pause();
  }

  const audioFile = uploadedAudio.files?.[0];
  if (!audioFile) return;

  const audioURL = URL.createObjectURL(audioFile);
  audio = new Audio(audioURL);
  audio.play();

  resetVisualizer();
  startVisualizer();
}

function resetVisualizer() {
  scene.children = scene.children.filter((obj) => obj.type === 'Camera' || obj.type.includes('Light'));
}

function startVisualizer() {
  if (!audio) {
    return;
  }

  const context = new AudioContext();
  const src = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  src.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 512;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Sphere Mesh
  const geometry = new THREE.IcosahedronGeometry(20, 3);
  const material = new THREE.MeshLambertMaterial({
    color: '#e0e0e0',
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const sphere = new THREE.Mesh(geometry, material);
  					sphere.castShadow = true;
					sphere.receiveShadow = true;
  scene.add(sphere);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x000000, 10);
  scene.add(ambientLight);



  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function render() {
    analyser.getByteFrequencyData(dataArray);

    const lowerHalf = dataArray.slice(0, dataArray.length / 2 - 1);
    const upperHalf = dataArray.slice(dataArray.length / 2 - 1, dataArray.length - 1);

    const lowerMax = max(lowerHalf);
    const upperAvg = average(upperHalf);

    const lowerMaxFr = Math.pow(lowerMax / lowerHalf.length, 1);
    const upperAvgFr = Math.pow(upperAvg / upperHalf.length, 1.5);

    WarpSphere(sphere, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function WarpSphere(mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.Material | THREE.Material[]>, bassFr: number, treFr: number): void {
    const geometry = mesh.geometry as THREE.IcosahedronGeometry;
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const offset: number = geometry.parameters.radius;
    const amp: number = 5;
    const time: number = window.performance.now();
    const rf: number = 0.00001;

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      vertex.normalize();
      const distance = offset + bassFr + noise(vertex.x + time * rf * 4, vertex.y + time * rf * 6, vertex.z + time * rf * 7) * amp * treFr * 2;
      vertex.multiplyScalar(distance);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  render();
}

// Helper functions
function fractionate(val: number, minVal: number, maxVal: number) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val: number, minVal: number, maxVal: number, outMin: number, outMax: number) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + fr * delta;
}

function average(arr: Uint8Array) {
  var total = arr.reduce(function (sum, b) {
    return sum + b;
  });
  return total / arr.length;
}

function max(arr: Uint8Array) {
  return arr.reduce(function (a, b) {
    return Math.max(a, b);
  });
}
