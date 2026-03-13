import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 4, 6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI;
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.3);
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.45);
  mainLight.position.set(3, 5, 3);
  mainLight.target.position.set(0, 0, 0);
  const backLight = new THREE.DirectionalLight(0xffffff, 0.35);
  backLight.position.set(-2, 3, -4);
  backLight.target.position.set(0, 0, 0);
  const leftLight = new THREE.DirectionalLight(0xffffff, 0.3);
  leftLight.position.set(-4, 2, 2);
  leftLight.target.position.set(0, 0, 0);

  scene.add(ambientLight);
  scene.add(hemiLight);
  scene.add(mainLight);
  scene.add(mainLight.target);
  scene.add(backLight);
  scene.add(backLight.target);
  scene.add(leftLight);
  scene.add(leftLight.target);

  const gridHelper = new THREE.GridHelper(8, 20, 0x335588, 0x224466);
  gridHelper.position.y = -1.8;
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 400;
  const starPositions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 40;
    starPositions[i + 1] = (Math.random() - 0.5) * 40;
    starPositions[i + 2] = (Math.random() - 0.5) * 40;
  }
  starsGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(starPositions, 3)
  );
  const starsMaterial = new THREE.PointsMaterial({
    color: 0x99aacc,
    size: 0.08,
    transparent: true,
    opacity: 0.5
  });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  return {
    THREE,
    scene,
    camera,
    renderer,
    controls,
    stars
  };
}

