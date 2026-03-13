import * as THREE from 'three';

const colors = {
  right: 0x2ecc40,
  left: 0x0074d9,
  up: 0xffdc00,
  down: 0xffffff,
  front: 0xff4136,
  back: 0xff851b,
  black: 0x222222
};

// 颜色 hex -> 面字母（用于贴纸状态）
const hexToFace = {
  [colors.up]: 'U',
  [colors.down]: 'D',
  [colors.left]: 'L',
  [colors.right]: 'R',
  [colors.front]: 'F',
  [colors.back]: 'B'
};

// 每个面的世界法线 + 该面 9 个格子的世界坐标 [x,y,z]
const faceNormalsAndPositions = {
  U: { normal: new THREE.Vector3(0, 1, 0), positions: [[-1,1,1],[0,1,1],[1,1,1], [-1,1,0],[0,1,0],[1,1,0], [-1,1,-1],[0,1,-1],[1,1,-1]] },
  D: { normal: new THREE.Vector3(0, -1, 0), positions: [[-1,-1,-1],[0,-1,-1],[1,-1,-1], [-1,-1,0],[0,-1,0],[1,-1,0], [-1,-1,1],[0,-1,1],[1,-1,1]] },
  F: { normal: new THREE.Vector3(0, 0, 1), positions: [[-1,1,1],[0,1,1],[1,1,1], [-1,0,1],[0,0,1],[1,0,1], [-1,-1,1],[0,-1,1],[1,-1,1]] },
  B: { normal: new THREE.Vector3(0, 0, -1), positions: [[1,1,-1],[0,1,-1],[-1,1,-1], [1,0,-1],[0,0,-1],[-1,0,-1], [1,-1,-1],[0,-1,-1],[-1,-1,-1]] },
  L: { normal: new THREE.Vector3(-1, 0, 0), positions: [[-1,1,-1],[-1,1,0],[-1,1,1], [-1,0,-1],[-1,0,0],[-1,0,1], [-1,-1,-1],[-1,-1,0],[-1,-1,1]] },
  R: { normal: new THREE.Vector3(1, 0, 0), positions: [[1,1,1],[1,1,0],[1,1,-1], [1,0,1],[1,0,0],[1,0,-1], [1,-1,1],[1,-1,0],[1,-1,-1]] }
};

const localFaceNormals = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1)
];

const size = 0.92;
const smallCubes = [];
const initialPositions = [];
const initialQuaternions = [];

let isAnimating = false;
let animationQueue = [];
let baseAnimDuration = 150;
let currentAnimationComplete = null;

function getRotationParams(face) {
  let baseFace = face;
  let modifier = '';
  let durationMultiplier = 1;

  if (face.endsWith("'")) {
    baseFace = face.slice(0, -1);
    modifier = "'";
  } else if (face.endsWith('2')) {
    baseFace = face.slice(0, -1);
    modifier = '2';
    durationMultiplier = 2;
  }

  let angle;
  switch (baseFace) {
    case 'U':
      angle =
        modifier === "'"
          ? Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : -Math.PI / 2;
      break;
    case 'D':
      angle =
        modifier === "'"
          ? -Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : Math.PI / 2;
      break;
    case 'L':
      angle =
        modifier === "'"
          ? -Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : Math.PI / 2;
      break;
    case 'R':
      angle =
        modifier === "'"
          ? Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : -Math.PI / 2;
      break;
    case 'F':
      angle =
        modifier === "'"
          ? Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : -Math.PI / 2;
      break;
    case 'B':
      angle =
        modifier === "'"
          ? -Math.PI / 2
          : modifier === '2'
            ? Math.PI
            : Math.PI / 2;
      break;
    default:
      return null;
  }

  const duration = baseAnimDuration * durationMultiplier;

  switch (baseFace) {
    case 'U':
      return { axis: 'y', fixedVal: 1, angle, duration };
    case 'D':
      return { axis: 'y', fixedVal: -1, angle, duration };
    case 'L':
      return { axis: 'x', fixedVal: -1, angle, duration };
    case 'R':
      return { axis: 'x', fixedVal: 1, angle, duration };
    case 'F':
      return { axis: 'z', fixedVal: 1, angle, duration };
    case 'B':
      return { axis: 'z', fixedVal: -1, angle, duration };
    default:
      return null;
  }
}

function getStickerState() {
  const posToCube = new Map();
  smallCubes.forEach((cube) => {
    const ix = Math.round(cube.position.x);
    const iy = Math.round(cube.position.y);
    const iz = Math.round(cube.position.z);
    posToCube.set(`${ix},${iy},${iz}`, cube);
  });

  const state = { U: [], D: [], F: [], B: [], L: [], R: [] };
  const faceNames = ['U', 'D', 'F', 'B', 'L', 'R'];

  faceNames.forEach((faceName) => {
    const { normal: targetNormal, positions } = faceNormalsAndPositions[faceName];
    const arr = state[faceName];
    positions.forEach(([px, py, pz]) => {
      const key = `${px},${py},${pz}`;
      const cube = posToCube.get(key);
      if (!cube) {
        arr.push('?');
        return;
      }
      const q = cube.quaternion;
      let bestDot = -2;
      let bestFaceIndex = 0;
      localFaceNormals.forEach((localN, i) => {
        const worldN = localN.clone().applyQuaternion(q);
        const dot = worldN.dot(targetNormal);
        if (dot > bestDot) {
          bestDot = dot;
          bestFaceIndex = i;
        }
      });
      const mat = Array.isArray(cube.material) ? cube.material[bestFaceIndex] : cube.material;
      const hex = mat.color.getHex ? mat.color.getHex() : mat.color;
      arr.push(hexToFace[hex] || '?');
    });
  });

  return state;
}

export function createCube(scene, options = {}) {
  const { onRotationEnd } = options;
  const cubeGroup = new THREE.Group();

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const materials = [
          new THREE.MeshPhongMaterial({
            color: x === 1 ? colors.right : colors.black,
            shininess: 30
          }),
          new THREE.MeshPhongMaterial({
            color: x === -1 ? colors.left : colors.black,
            shininess: 30
          }),
          new THREE.MeshPhongMaterial({
            color: y === 1 ? colors.up : colors.black,
            shininess: 30
          }),
          new THREE.MeshPhongMaterial({
            color: y === -1 ? colors.down : colors.black,
            shininess: 30
          }),
          new THREE.MeshPhongMaterial({
            color: z === 1 ? colors.front : colors.black,
            shininess: 30
          }),
          new THREE.MeshPhongMaterial({
            color: z === -1 ? colors.back : colors.black,
            shininess: 30
          })
        ];

        const geometry = new THREE.BoxGeometry(size, size, size);
        const cube = new THREE.Mesh(geometry, materials);
        cube.position.set(x, y, z);

        cube.userData = { initX: x, initY: y, initZ: z };

        cubeGroup.add(cube);
        smallCubes.push(cube);

        initialPositions.push(cube.position.clone());
        initialQuaternions.push(cube.quaternion.clone());
      }
    }
  }

  scene.add(cubeGroup);

  function rotateFace(face) {
    if (isAnimating) {
      animationQueue.push(face);
      return;
    }

    const params = getRotationParams(face);
    if (!params) return;

    const { axis, fixedVal, angle, duration } = params;

    const cubesToRotate = smallCubes.filter(cube => {
      const pos = cube.position;
      if (axis === 'x') return Math.abs(pos.x - fixedVal) < 0.1;
      if (axis === 'y') return Math.abs(pos.y - fixedVal) < 0.1;
      if (axis === 'z') return Math.abs(pos.z - fixedVal) < 0.1;
      return false;
    });

    if (cubesToRotate.length === 0) return;

    isAnimating = true;

    const startTime = performance.now();
    const startRotations = cubesToRotate.map(cube => cube.quaternion.clone());
    const startPositions = cubesToRotate.map(cube => cube.position.clone());

    const rotationMatrix = new THREE.Matrix4();
    if (axis === 'x') rotationMatrix.makeRotationX(angle);
    else if (axis === 'y') rotationMatrix.makeRotationY(angle);
    else if (axis === 'z') rotationMatrix.makeRotationZ(angle);

    function animate() {
      const now = performance.now();
      const elapsed = now - startTime;
      let progress = Math.min(elapsed / duration, 1);

      progress = 1 - Math.pow(1 - progress, 3);

      cubesToRotate.forEach((cube, index) => {
        const startPos = startPositions[index];
        const startRot = startRotations[index];

        const targetPos = startPos.clone();
        if (axis === 'x') {
          const y = targetPos.y;
          const z = targetPos.z;
          targetPos.y = y * Math.cos(angle) - z * Math.sin(angle);
          targetPos.z = y * Math.sin(angle) + z * Math.cos(angle);
        } else if (axis === 'y') {
          const x = targetPos.x;
          const z = targetPos.z;
          targetPos.x = x * Math.cos(angle) + z * Math.sin(angle);
          targetPos.z = -x * Math.sin(angle) + z * Math.cos(angle);
        } else if (axis === 'z') {
          const x = targetPos.x;
          const y = targetPos.y;
          targetPos.x = x * Math.cos(angle) - y * Math.sin(angle);
          targetPos.y = x * Math.sin(angle) + y * Math.cos(angle);
        }

        cube.position.lerpVectors(startPos, targetPos, progress);

        const targetRot = startRot
          .clone()
          .premultiply(
            new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
          );
        THREE.Quaternion.slerp(startRot, targetRot, cube.quaternion, progress);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        applyComplete(false);
      }
    }

    function applyComplete(skipQueue) {
      cubesToRotate.forEach((cube, index) => {
        const startPos = startPositions[index];
        const startRot = startRotations[index];

        if (axis === 'x') {
          const y = startPos.y;
          const z = startPos.z;
          cube.position.set(
            startPos.x,
            y * Math.cos(angle) - z * Math.sin(angle),
            y * Math.sin(angle) + z * Math.cos(angle)
          );
        } else if (axis === 'y') {
          const x = startPos.x;
          const z = startPos.z;
          cube.position.set(
            x * Math.cos(angle) + z * Math.sin(angle),
            startPos.y,
            -x * Math.sin(angle) + z * Math.cos(angle)
          );
        } else if (axis === 'z') {
          const x = startPos.x;
          const y = startPos.y;
          cube.position.set(
            x * Math.cos(angle) - y * Math.sin(angle),
            x * Math.sin(angle) + y * Math.cos(angle),
            startPos.z
          );
        }

        const targetRot = startRot
          .clone()
          .premultiply(
            new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
          );
        cube.quaternion.copy(targetRot);
      });

      isAnimating = false;
      currentAnimationComplete = null;
      onRotationEnd?.();

      if (!skipQueue && animationQueue.length > 0) {
        const nextFace = animationQueue.shift();
        setTimeout(() => {
          rotateFace(nextFace);
        }, 10);
      }
    }

    currentAnimationComplete = () => applyComplete(true);

    requestAnimationFrame(animate);
  }

  function resetCube() {
    animationQueue = [];

    if (isAnimating) {
      setTimeout(resetCube, 100);
      return;
    }

    smallCubes.forEach((cube, index) => {
      cube.position.copy(initialPositions[index]);
      cube.quaternion.copy(initialQuaternions[index]);
    });
    onRotationEnd?.();
  }

  function stopAnimation() {
    animationQueue = [];
    if (currentAnimationComplete) {
      currentAnimationComplete();
    }
    isAnimating = false;
  }

  function queueScramble(scrambleStr) {
    if (isAnimating) {
      stopAnimation();
    }
    animationQueue = [];

    const moves = scrambleStr.split(' ');
    moves.forEach(move => {
      const trimmed = move.trim();
      if (!trimmed) return;

      // 对带 2 的公式（如 U2）拆成两次 90° 旋转
      if (trimmed.endsWith('2')) {
        const base = trimmed.slice(0, -1);
        animationQueue.push(base, base);
      } else {
        animationQueue.push(trimmed);
      }
    });

    if (animationQueue.length > 0) {
      const firstMove = animationQueue.shift();
      rotateFace(firstMove);
    }
  }

  return {
    cubeGroup,
    rotateFace,
    resetCube,
    queueScramble,
    getStickerState,
    setBaseRotationDuration: (ms) => {
      if (typeof ms === 'number' && ms > 0) {
        baseAnimDuration = ms;
      }
    }
  };
}

