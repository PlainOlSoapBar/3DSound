import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 50;

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

// DOM
document.body.appendChild( renderer.domElement );

// Material
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

// Geometry
const geometry = new THREE.SphereGeometry( 15, 32, 32 ); 
const sphere = new THREE.Mesh( geometry, material );
scene.add(sphere);

// Animation
function animate() {
  sphere.rotation.x += 0.01;
  sphere.rotation.y += 0.01;

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

// Window Resizing
var tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
var windowHeight = window.innerHeight;

// Event Listeners
addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    
    // adjust the FOV
    camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / windowHeight ) );
    
    camera.updateProjectionMatrix();
    camera.lookAt( scene.position );

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render( scene, camera );
    
});