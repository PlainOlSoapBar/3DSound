import * as THREE from 'three';

export function setupResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
) {
  var tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2);
  var windowHeight = window.innerHeight;

  addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov =
      (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  });
}
