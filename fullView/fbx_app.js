import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// --- State Management ---
const state = {
  activeModelName: null,
  currentModel: null,
  mixer: null,
  actions: [],
  allClips: [],
  activeAction: null,
  isPlaying: true,
  isScrubbing: false,
  cameraFollow: true,
  trackerBone: null,
  racketVisible: true,
  racketObject: null,
  rightHandBone: null,
  racketConfig: {
    scale: 0.40,
    posX: 30.0,
    posY: 6.0,
    posZ: -6.0,
    rotX: 45,
    rotY: 15,
    rotZ: -100,
  },
  armCorrectionEnabled: true,
  armOnlyIdle: false,
  rightForeArmBone: null,
  leftForeArmBone: null,
  lastArmOffsetR: new THREE.Quaternion(),
  lastArmOffsetL: new THREE.Quaternion(),
  armConfig: {
    rightForeArm: { rotX: 0, rotY: 0, rotZ: 20 },
    leftForeArm: { rotX: 0, rotY: 0, rotZ: 20 },
  },
  animSpeed: 1.0,
  wireframe: false,
  skeletonVisible: false,
  gridVisible: true,
  autoRotate: false,
  themeIndex: 0,
  defaultCamDist: 4,
  defaultTarget: new THREE.Vector3(0, 1, 0),
  defaultCamPos: new THREE.Vector3(1, 1.4, 3),
};

// --- SubClips Configuration (Tennis Movements) ---
const SUBCLIPS_CONFIG = [
  { name: 'Idle (Stance Ready)', start: 0.2, end: 2.5, icon: '🎾' },
  { name: 'Forehand Drive', start: 2.6, end: 5.0, icon: '🎾' },
  { name: 'Backhand Drive', start: 7.1, end: 9.0, icon: '🎾' },
  { name: 'Servis Atas', start: 12.1, end: 17.0, icon: '🎾' },
  { name: 'Forehand 2', start: 5.1, end: 7.0, icon: '🎾' },
  { name: 'Servis Bawah', start: 10.0, end: 12.0, icon: '🎾' },
  { name: '9. Penutup (Jabat Tangan)', start: 27.0, end: 28.67, icon: '🤝' },
];

const THEMES = [
  { name: 'Dark Studio', bg: 0x0b0f19, grid1: 0x1e293b, grid2: 0x334155 },
  { name: 'Slate Gray', bg: 0x1e293b, grid1: 0x334155, grid2: 0x475569 },
  { name: 'Clean White', bg: 0xf1f5f9, grid1: 0xcfd8dc, grid2: 0x90a4ae },
];

// --- DOM Elements ---
const canvas = document.getElementById('webgl-canvas');
const activeModelNameEl = document.getElementById('active-model-name');
const btnDefaultModel = document.getElementById('btn-default-model');
const fbxWelcomeCard = document.getElementById('fbx-welcome-card');
const btnWelcomePick = document.getElementById('btn-welcome-pick');
const btnUploadFbx = document.getElementById('btn-upload-fbx');
const fbxFileInput = document.getElementById('fbx-file-input');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingTitle = document.getElementById('loading-title');
const loadingDetail = document.getElementById('loading-detail');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const dropzoneOverlay = document.getElementById('dropzone-overlay');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');
const toastCloseBtn = document.getElementById('toast-close');

// Info modal elements
const infoModal = document.getElementById('info-modal');
const btnToggleInfo = document.getElementById('btn-toggle-info');
const btnCloseInfo = document.getElementById('btn-close-info');
const infoFilename = document.getElementById('info-filename');
const infoMeshes = document.getElementById('info-meshes');
const infoTriangles = document.getElementById('info-triangles');
const infoAnimations = document.getElementById('info-animations');
const infoSize = document.getElementById('info-size');

// Debug modal elements
const debugModal = document.getElementById('debug-modal');
const btnToggleDebug = document.getElementById('btn-toggle-debug');
const btnCloseDebug = document.getElementById('btn-close-debug');
const debugClipName = document.getElementById('debug-clip-name');
const debugStatus = document.getElementById('debug-status');
const debugTracksCount = document.getElementById('debug-tracks-count');
const debugBindingStatus = document.getElementById('debug-binding-status');
const checkRacket = document.getElementById('check-racket');
const checkCameraFollow = document.getElementById('check-camera-follow');
const checkSkeletonHelper = document.getElementById('check-skeleton-helper');
const debugLogContent = document.getElementById('debug-log-content');

// Racket Tuning modal elements
const racketModal = document.getElementById('racket-modal');
const btnToggleRacketSettings = document.getElementById('btn-toggle-racket-settings');
const btnCloseRacketModal = document.getElementById('btn-close-racket-modal');
const btnOpenRacketFromDebug = document.getElementById('btn-open-racket-tuning-from-debug');
const checkRacketActive = document.getElementById('check-racket-active');

const presetRacketNormal = document.getElementById('preset-racket-normal');
const presetRacketTennis = document.getElementById('preset-racket-tennis');
const presetRacketLarge = document.getElementById('preset-racket-large');

const sliderRacketScale = document.getElementById('slider-racket-scale');
const valRacketScale = document.getElementById('val-racket-scale');

const sliderRacketPosX = document.getElementById('slider-racket-pos-x');
const valRacketPosX = document.getElementById('val-racket-pos-x');
const sliderRacketPosY = document.getElementById('slider-racket-pos-y');
const valRacketPosY = document.getElementById('val-racket-pos-y');
const sliderRacketPosZ = document.getElementById('slider-racket-pos-z');
const valRacketPosZ = document.getElementById('val-racket-pos-z');

const sliderRacketRotX = document.getElementById('slider-racket-rot-x');
const valRacketRotX = document.getElementById('val-racket-rot-x');
const sliderRacketRotY = document.getElementById('slider-racket-rot-y');
const valRacketRotY = document.getElementById('val-racket-rot-y');
const sliderRacketRotZ = document.getElementById('slider-racket-rot-z');
const valRacketRotZ = document.getElementById('val-racket-rot-z');

const btnResetRacketTuning = document.getElementById('btn-reset-racket-tuning');
const btnCopyRacketTuning = document.getElementById('btn-copy-racket-tuning');

// Arm Pose Tuning modal elements
const armModal = document.getElementById('arm-modal');
const btnToggleArmSettings = document.getElementById('btn-toggle-arm-settings');
const btnCloseArmModal = document.getElementById('btn-close-arm-modal');
const btnOpenArmFromDebug = document.getElementById('btn-open-arm-tuning-from-debug');
const checkArmCorrection = document.getElementById('check-arm-correction');
const checkArmOnlyIdle = document.getElementById('check-arm-only-idle');

const sliderRarmRotX = document.getElementById('slider-rarm-rot-x');
const valRarmRotX = document.getElementById('val-rarm-rot-x');
const sliderRarmRotY = document.getElementById('slider-rarm-rot-y');
const valRarmRotY = document.getElementById('val-rarm-rot-y');
const sliderRarmRotZ = document.getElementById('slider-rarm-rot-z');
const valRarmRotZ = document.getElementById('val-rarm-rot-z');

const sliderLarmRotX = document.getElementById('slider-larm-rot-x');
const valLarmRotX = document.getElementById('val-larm-rot-x');
const sliderLarmRotY = document.getElementById('slider-larm-rot-y');
const valLarmRotY = document.getElementById('val-larm-rot-y');
const sliderLarmRotZ = document.getElementById('slider-larm-rot-z');
const valLarmRotZ = document.getElementById('val-larm-rot-z');

const btnResetArmTuning = document.getElementById('btn-reset-arm-tuning');
const btnCopyArmTuning = document.getElementById('btn-copy-arm-tuning');

// Fullscreen
const btnFullscreen = document.getElementById('btn-fullscreen');
const iconExpand = btnFullscreen.querySelector('.icon-expand');
const iconCompress = btnFullscreen.querySelector('.icon-compress');

// Anim panel elements
const animationPanel = document.getElementById('animation-panel');
const animTimelineSlider = document.getElementById('anim-timeline-slider');
const animCurrentTime = document.getElementById('anim-current-time');
const animTotalDuration = document.getElementById('anim-total-duration');
const animTimelineProgress = document.getElementById('anim-timeline-progress');
const btnPlayPause = document.getElementById('btn-play-pause');
const animPlayText = document.getElementById('anim-play-text');
const iconPlay = btnPlayPause.querySelector('.icon-play');
const iconPause = btnPlayPause.querySelector('.icon-pause');
const animClipSelect = document.getElementById('anim-clip-select');
const btnAnimSpeed = document.getElementById('btn-anim-speed');
const animSpeedLabel = document.getElementById('anim-speed-label');

// Tools bar buttons
const btnResetCam = document.getElementById('btn-reset-cam');
const btnAutoRotate = document.getElementById('btn-autorotate');
const btnToggleRacket = document.getElementById('btn-toggle-racket');
const btnWireframe = document.getElementById('btn-wireframe');
const btnCameraFollow = document.getElementById('btn-camera-follow');
const btnSkeleton = document.getElementById('btn-skeleton');
const btnGrid = document.getElementById('btn-grid');
const btnTheme = document.getElementById('btn-theme');

// Zoom controller elements
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const zoomRange = document.getElementById('zoom-range');
const zoomPercentText = document.getElementById('zoom-percent-text');

// --- Three.js Core Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(THEMES[0].bg);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(1, 1.4, 3);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Environment Map for Realistic PBR Lighting
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI / 2 + 0.08;
controls.minDistance = 0.2;
controls.maxDistance = 50;
controls.target.set(0, 0.95, 0);
controls.update();

// --- Lighting & Shadow Catcher ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.bias = -0.0005;
const shadowDist = 4;
keyLight.shadow.camera.left = -shadowDist;
keyLight.shadow.camera.right = shadowDist;
keyLight.shadow.camera.top = shadowDist;
keyLight.shadow.camera.bottom = -shadowDist;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xa5c9eb, 0.6);
fillLight.position.set(-5, 4, -4);
scene.add(fillLight);

// Ground Shadow Receiver Plane
const groundPlaneGeo = new THREE.PlaneGeometry(30, 30);
const groundPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const groundPlane = new THREE.Mesh(groundPlaneGeo, groundPlaneMat);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -0.001;
groundPlane.receiveShadow = true;
scene.add(groundPlane);

// Grid Helper
let gridHelper = new THREE.GridHelper(4, 16, THEMES[0].grid1, THEMES[0].grid2);
gridHelper.position.y = 0;
scene.add(gridHelper);

// Skeleton Helper
let skeletonHelper = null;

// --- Loaders Setup ---
const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

// --- Toast Utility ---
let toastTimeout = null;
function showToast(msg, duration = 3500) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessageEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastTimeout = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, duration);
}

toastCloseBtn.addEventListener('click', () => {
  toastEl.classList.add('hidden');
});

// --- Debug Logging & Diagnostics ---
function logDebug(msg) {
  console.log(`[FBX Debug] ${msg}`);
  if (debugLogContent) {
    const time = new Date().toLocaleTimeString();
    debugLogContent.textContent = `[${time}] ${msg}\n` + debugLogContent.textContent.slice(0, 1500);
  }
}

// --- FBX Model Loading & Setup ---
function loadFBX(url, displayName, isBlob = false) {
  state.activeModelName = displayName;
  activeModelNameEl.textContent = displayName;
  if (btnDefaultModel && btnUploadFbx) {
    if (displayName.toLowerCase().includes('tennis')) {
      btnDefaultModel.classList.add('active');
      btnUploadFbx.classList.remove('active');
    } else {
      btnDefaultModel.classList.remove('active');
      btnUploadFbx.classList.add('active');
    }
  }

  // Show loading screen
  loadingOverlay.classList.remove('hidden');
  loadingOverlay.classList.remove('fade-out');
  loadingTitle.textContent = `Memuat ${displayName}...`;
  loadingDetail.textContent = 'Mendekode hierarki tulang dan data animasi FBX...';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  fbxLoader.load(
    url,
    (fbx) => {
      onFBXLoaded(fbx, displayName);
      setZoomByPercentage(40);
      if (isBlob) {
        URL.revokeObjectURL(url);
      }
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}% (${(xhr.loaded / (1024 * 1024)).toFixed(1)} MB / ${(xhr.total / (1024 * 1024)).toFixed(1)} MB)`;
      } else {
        const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
        progressBar.style.width = '70%';
        progressText.textContent = `${loadedMb} MB termuat`;
      }

    },
    (error) => {
      console.error('FBX Load Error:', error);
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
      showToast(`Gagal memuat file FBX: ${error.message || 'Format tidak didukung'}`);
      logDebug(`Error memuat FBX: ${error.message}`);
    }
  );
}

function onFBXLoaded(fbx, displayName) {
  // Hide welcome card
  if (fbxWelcomeCard) {
    fbxWelcomeCard.classList.add('hidden');

  }

  //btnZoomReset.click();

  // Clean up previous model and animations
  if (state.currentModel) {
    scene.remove(state.currentModel);
    state.currentModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }

  if (skeletonHelper) {
    scene.remove(skeletonHelper);
    skeletonHelper.dispose();
    skeletonHelper = null;
  }

  if (state.racketObject) {
    if (state.racketObject.parent) {
      state.racketObject.parent.remove(state.racketObject);
    }
    state.racketObject = null;
  }

  if (state.mixer) {
    state.mixer.stopAllAction();
    state.mixer.uncacheRoot(state.currentModel);
    state.mixer = null;
  }
  state.actions = [];
  state.allClips = [];
  state.activeAction = null;

  state.currentModel = fbx;

  // Calculate Bounding Box & Dimensions
  let box = new THREE.Box3().setFromObject(fbx);
  let size = box.getSize(new THREE.Vector3());

  // Detect scale units (Centimeters vs Meters)
  // FBX exported from Rokoko, Maya, or Mixamo often use centimeters (human ~170-190cm)
  if (size.y > 30) {
    const scaleFactor = 0.01; // cm to meters
    fbx.scale.multiplyScalar(scaleFactor);
    fbx.updateMatrixWorld(true);
    box.setFromObject(fbx);
    size = box.getSize(new THREE.Vector3());
    logDebug(`FBX terdeteksi dalam satuan sentimeter (${(size.y * 100).toFixed(0)}cm). Dikonversi ke meter: ~${size.y.toFixed(2)}m`);
  } else if (size.y > 0 && size.y < 0.3) {
    // Miniature scale
    const scaleFactor = 1.8 / size.y;
    fbx.scale.multiplyScalar(scaleFactor);
    fbx.updateMatrixWorld(true);
    box.setFromObject(fbx);
    size = box.getSize(new THREE.Vector3());
    logDebug(`FBX diskalakan up ke ukuran manusia standar: ~${size.y.toFixed(2)}m`);
  }

  // Center model at ground level (y=0)
  const center = box.getCenter(new THREE.Vector3());
  fbx.position.x = -center.x;
  fbx.position.y = -box.min.y;
  fbx.position.z = -center.z;
  fbx.updateMatrixWorld(true);

  // Recompute bounding box after positioning
  box.setFromObject(fbx);
  size = box.getSize(new THREE.Vector3());

  // Enable Shadows, Wireframe, and adjust materials
  let meshCount = 0;
  let triangleCount = 0;
  let boneCount = 0;
  let spine1Bone = null;
  let spineBone = null;
  let hipsBone = null;
  let rightHandBone = null;
  let rightForeArmBone = null;
  let leftForeArmBone = null;

  fbx.traverse((child) => {
    if (child.isBone) {
      boneCount++;
      const lower = child.name.toLowerCase();
      if (lower.includes('spine1') || lower.includes('spine_01')) {
        spine1Bone = child;
      } else if (!spineBone && (lower.includes('spine') || lower.includes('spine_00'))) {
        spineBone = child;
      } else if (!hipsBone && (lower.includes('hip') || lower.includes('pelvis'))) {
        hipsBone = child;
      }

      if (!rightHandBone && (lower.includes('righthand') || lower.includes('right_hand') || (lower.includes('hand') && lower.endsWith('r')))) {
        rightHandBone = child;
      }

      if (!rightForeArmBone && (lower.includes('rightforearm') || lower.includes('right_forearm') || (lower.includes('forearm') && lower.endsWith('r')))) {
        rightForeArmBone = child;
      }

      if (!leftForeArmBone && (lower.includes('leftforearm') || lower.includes('left_forearm') || (lower.includes('forearm') && lower.endsWith('l')))) {
        leftForeArmBone = child;
      }
    }

    if (child.isMesh) {
      meshCount++;
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.geometry) {
        if (child.geometry.index) {
          triangleCount += child.geometry.index.count / 3;
        } else if (child.geometry.attributes.position) {
          triangleCount += child.geometry.attributes.position.count / 3;
        }
      }

      if (child.material) {
        child.material.wireframe = state.wireframe;
        child.material.side = THREE.DoubleSide;
        if ('roughness' in child.material && child.material.roughness === undefined) {
          child.material.roughness = 0.5;
        }
      }
    }
  });

  state.trackerBone = spine1Bone || spineBone || hipsBone;
  if (state.trackerBone) {
    logDebug(`Spinal Tracker aktif menggunakan tulang: '${state.trackerBone.name}'`);
  }

  // Prioritize direct parent of hand bone to guarantee targeting the real skeletal hierarchy
  if (rightHandBone && rightHandBone.parent && rightHandBone.parent.isBone) {
    rightForeArmBone = rightHandBone.parent;
  }
  let leftHandBone = null;
  fbx.traverse(c => {
    if (c.isBone && !leftHandBone) {
      const l = c.name.toLowerCase();
      if (l.includes('lefthand') || l.includes('left_hand') || (l.includes('hand') && l.endsWith('l'))) {
        leftHandBone = c;
      }
    }
  });
  if (leftHandBone && leftHandBone.parent && leftHandBone.parent.isBone) {
    leftForeArmBone = leftHandBone.parent;
  }

  state.rightHandBone = rightHandBone;
  state.rightForeArmBone = rightForeArmBone;
  state.leftForeArmBone = leftForeArmBone;

  if (state.rightForeArmBone) {
    logDebug(`Tulang lengan bawah kanan aktif: '${state.rightForeArmBone.name}'`);
  }
  if (state.leftForeArmBone) {
    logDebug(`Tulang lengan bawah kiri aktif: '${state.leftForeArmBone.name}'`);
  }

  if (state.rightHandBone) {
    logDebug(`Tulang tangan kanan ditemukan: '${state.rightHandBone.name}'. Menempelkan raket_tenis.glb...`);
    attachTennisRacket();
  }

  scene.add(fbx);

  // Setup SkeletonHelper (essential for pure MoCap bone hierarchies)
  skeletonHelper = new THREE.SkeletonHelper(fbx);
  skeletonHelper.visible = state.skeletonVisible;
  scene.add(skeletonHelper);

  // Camera Framing (aligned to Spinal Tracker if available)
  const maxDim = Math.max(size.x, size.y, size.z, 1.8);
  const camDist = Math.max(2.2, maxDim * 1.45);

  if (state.trackerBone) {
    fbx.updateMatrixWorld(true);
    const trackerPos = new THREE.Vector3();
    state.trackerBone.getWorldPosition(trackerPos);
    state.defaultTarget.copy(trackerPos);
    state.defaultCamPos.set(trackerPos.x + camDist * 0.25, trackerPos.y + camDist * 0.12, trackerPos.z + camDist * 0.95);
  } else {
    const targetY = size.y > 0 ? size.y * 0.52 : 0.95;
    state.defaultTarget.set(0, targetY, 0);
    state.defaultCamPos.set(camDist * 0.25, targetY + camDist * 0.12, camDist * 0.95);
  }
  state.defaultCamDist = state.defaultCamPos.distanceTo(state.defaultTarget);

  camera.position.copy(state.defaultCamPos);
  controls.target.copy(state.defaultTarget);
  controls.minDistance = 0.3;
  controls.maxDistance = maxDim * 6;
  controls.update();
  updateZoomUI();

  // Adjust Grid bounds
  const gridExtent = Math.max(3.5, Math.ceil(maxDim * 2));
  scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(gridExtent, Math.max(12, gridExtent * 4), THEMES[state.themeIndex].grid1, THEMES[state.themeIndex].grid2);
  gridHelper.visible = state.gridVisible;
  scene.add(gridHelper);

  // Setup Animations
  const animations = fbx.animations || [];
  logDebug(`Ditemukan ${animations.length} klip animasi, ${meshCount} mesh, ${boneCount} tulang.`);
  setupAnimations(animations);

  // Update Info Modal
  infoFilename.textContent = displayName;
  infoMeshes.textContent = meshCount;
  infoTriangles.textContent = Math.round(triangleCount).toLocaleString();
  infoAnimations.textContent = animations.length;
  infoSize.textContent = `${size.x.toFixed(2)}m × ${size.y.toFixed(2)}m × ${size.z.toFixed(2)}m`;

  // Hide loading screen smoothly
  setTimeout(() => {
    loadingOverlay.classList.add('fade-out');
    setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
    // showToast(`Model FBX siap! ${animations.length} animasi terdeteksi.`);
  }, 300);
}

// --- Tennis Racket Attachment (Parenting to RightHand Bone) ---
function attachTennisRacket() {
  if (!state.rightHandBone) {
    logDebug('Tulang tangan kanan tidak ditemukan, raket tidak dapat dipasang.');
    return;
  }

  // Remove existing racket if any
  if (state.racketObject) {
    if (state.racketObject.parent) {
      state.racketObject.parent.remove(state.racketObject);
    }
    state.racketObject = null;
  }

  const gripAnchor = new THREE.Group();
  gripAnchor.name = 'Racket_Grip_Anchor';
  state.rightHandBone.add(gripAnchor);
  state.racketObject = gripAnchor;

  gltfLoader.load(
    'raket_tenis.glb',
    (gltf) => {
      const racket = gltf.scene;
      racket.name = 'Tennis_Racket_Mesh';

      racket.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
        }
      });

      // Racket mesh sits centered inside gripAnchor
      racket.position.set(0, 0, 0);
      gripAnchor.add(racket);

      // Apply initial transform and inverse scale compensation
      applyRacketTransform();

      logDebug(`Raket tenis berhasil dipasang ke tangan kanan ('${state.rightHandBone.name}') dengan skala normal!`);
      //showToast('Raket tenis terpasang di tangan kanan!');
    },
    undefined,
    (err) => {
      console.error('Gagal memuat raket_tenis.glb:', err);
      logDebug(`Gagal memuat raket_tenis.glb: ${err.message}`);
    }
  );
}

function applyRacketTransform() {
  if (!state.racketObject || !state.rightHandBone) return;

  const cfg = state.racketConfig;

  // Compute inverse of bone world scale to counteract parent FBX armature scaling (e.g. 0.01)
  const boneWorldScale = new THREE.Vector3();
  state.rightHandBone.getWorldScale(boneWorldScale);

  const invX = (boneWorldScale.x > 0.0001) ? (1 / boneWorldScale.x) : 1;
  const invY = (boneWorldScale.y > 0.0001) ? (1 / boneWorldScale.y) : 1;
  const invZ = (boneWorldScale.z > 0.0001) ? (1 / boneWorldScale.z) : 1;

  // Apply compensated scale so cfg.scale=1.0 renders as 1.0 in world units
  state.racketObject.scale.set(
    cfg.scale * invX,
    cfg.scale * invY,
    cfg.scale * invZ
  );

  // Position offset (in bone local coordinate units: 1 unit = 1cm in Mixamo armature)
  state.racketObject.position.set(cfg.posX, cfg.posY, cfg.posZ);

  // Rotation in degrees converted to radians
  state.racketObject.rotation.set(
    THREE.MathUtils.degToRad(cfg.rotX),
    THREE.MathUtils.degToRad(cfg.rotY),
    THREE.MathUtils.degToRad(cfg.rotZ)
  );

  state.racketObject.visible = state.racketVisible;
  updateRacketTuningUI();
}

function updateRacketTuningUI() {
  const cfg = state.racketConfig;
  if (valRacketScale) valRacketScale.textContent = `${cfg.scale.toFixed(2)}x`;
  if (sliderRacketScale) sliderRacketScale.value = cfg.scale;

  if (valRacketPosX) valRacketPosX.textContent = `${cfg.posX.toFixed(1)}`;
  if (sliderRacketPosX) sliderRacketPosX.value = cfg.posX;

  if (valRacketPosY) valRacketPosY.textContent = `${cfg.posY.toFixed(1)}`;
  if (sliderRacketPosY) sliderRacketPosY.value = cfg.posY;

  if (valRacketPosZ) valRacketPosZ.textContent = `${cfg.posZ.toFixed(1)}`;
  if (sliderRacketPosZ) sliderRacketPosZ.value = cfg.posZ;

  if (valRacketRotX) valRacketRotX.textContent = `${Math.round(cfg.rotX)}°`;
  if (sliderRacketRotX) sliderRacketRotX.value = cfg.rotX;

  if (valRacketRotY) valRacketRotY.textContent = `${Math.round(cfg.rotY)}°`;
  if (sliderRacketRotY) sliderRacketRotY.value = cfg.rotY;

  if (valRacketRotZ) valRacketRotZ.textContent = `${Math.round(cfg.rotZ)}°`;
  if (sliderRacketRotZ) sliderRacketRotZ.value = cfg.rotZ;

  if (checkRacketActive) checkRacketActive.checked = state.racketVisible;
  const checkRacketEl = document.getElementById('check-racket');
  if (checkRacketEl) checkRacketEl.checked = state.racketVisible;
  const btnToggleRacketEl = document.getElementById('btn-toggle-racket');
  if (btnToggleRacketEl) {
    btnToggleRacketEl.classList.toggle('active', state.racketVisible);
  }

  // Update presets active highlight
  const isDefault = Math.abs(cfg.scale - 0.40) < 0.01 && Math.abs(cfg.posX - 30.0) < 0.1 && Math.abs(cfg.posY - 6.0) < 0.1 && Math.abs(cfg.posZ - (-6.0)) < 0.1 && Math.abs(cfg.rotX - 45) < 1 && Math.abs(cfg.rotY - 15) < 1 && Math.abs(cfg.rotZ - (-100)) < 1;
  const isNormal = Math.abs(cfg.scale - 1.0) < 0.01 && cfg.posX === 0 && cfg.posY === 0 && cfg.posZ === 0 && cfg.rotX === 0 && cfg.rotY === 0 && cfg.rotZ === 0;
  const isLarge = Math.abs(cfg.scale - 1.5) < 0.01;

  if (presetRacketTennis) presetRacketTennis.classList.toggle('active', isDefault);
  if (presetRacketNormal) presetRacketNormal.classList.toggle('active', isNormal);
  if (presetRacketLarge) presetRacketLarge.classList.toggle('active', isLarge && !isDefault && !isNormal);
}

// --- Animation Handler ---
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

// --- Running Animation Cache (from karakter_atlet.glb) ---
let runningClipPromise = null;
function getRunningClip() {
  if (!runningClipPromise) {
    runningClipPromise = new Promise((resolve) => {
      gltfLoader.load(
        'karakter_atlet.glb',
        (gltf) => {
          const runClip = (gltf.animations && gltf.animations.find((a) => a.name === 'Running')) || (gltf.animations && gltf.animations[0]);
          if (runClip) {
            logDebug(`Animasi 'Running' berhasil dimuat dari karakter_atlet.glb (${runClip.tracks.length} tracks, ${runClip.duration.toFixed(2)}s)`);
            resolve(runClip);
          } else {
            console.warn('Animasi Running tidak ditemukan di karakter_atlet.glb');
            resolve(null);
          }
        },
        undefined,
        (err) => {
          console.error('Gagal memuat karakter_atlet.glb untuk animasi lari:', err);
          resolve(null);
        }
      );
    });
  }
  return runningClipPromise;
}

// Preload running clip in background
getRunningClip();

// --- Helper: Stitched Volley Animation Clip (Running -> Hit) ---
function createStitchedVolleyClip(name, runClip, hitClip, runDuration = 1.1, blendTime = 0.2, targetModel) {
  if (!hitClip) return null;
  if (!runClip) return hitClip;

  const tHitStart = runDuration + blendTime;
  const totalDuration = tHitStart + hitClip.duration;

  // 1. Build bone name dictionary from targetModel
  const boneNameMap = new Map();
  if (targetModel) {
    targetModel.traverse((child) => {
      if (child.isBone) {
        const exact = child.name;
        boneNameMap.set(exact.toLowerCase(), exact);
        const stripped = exact.replace(/mixamorig[:_]?/i, '').replace(/[:_\s]/g, '').toLowerCase();
        boneNameMap.set(stripped, exact);
      }
    });
  }

  function resolveTrackName(trackName) {
    const dotIdx = trackName.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const nodePart = trackName.substring(0, dotIdx);
    const propPart = trackName.substring(dotIdx);
    if (boneNameMap.has(nodePart.toLowerCase())) {
      return `${boneNameMap.get(nodePart.toLowerCase())}${propPart}`;
    }
    const stripped = nodePart.replace(/mixamorig[:_]?/i, '').replace(/[:_\s]/g, '').toLowerCase();
    if (boneNameMap.has(stripped)) {
      return `${boneNameMap.get(stripped)}${propPart}`;
    }
    return trackName;
  }

  // 2. Index runClip tracks (only keep .quaternion tracks to preserve bone proportions)
  const runTracksByName = new Map();
  runClip.tracks.forEach((track) => {
    if (track.name.endsWith('.quaternion')) {
      const resolvedName = resolveTrackName(track.name);
      if (resolvedName) {
        runTracksByName.set(resolvedName, track);
      }
    }
  });

  // 3. Index hitClip tracks
  const hitTracksByName = new Map();
  hitClip.tracks.forEach((track) => {
    hitTracksByName.set(track.name, track);
  });

  // 4. Combine all track names
  const allTrackNames = new Set([...hitTracksByName.keys(), ...runTracksByName.keys()]);
  const newTracks = [];

  allTrackNames.forEach((trackName) => {
    const hitTrack = hitTracksByName.get(trackName);
    const runTrack = runTracksByName.get(trackName);

    const isQuat = trackName.endsWith('.quaternion');
    const stride = isQuat ? 4 : 3;
    const outTimes = [];
    const outValues = [];

    function addKeyframe(t, slice) {
      if (outTimes.length > 0 && t <= outTimes[outTimes.length - 1] + 0.0001) {
        return; // Avoid duplicate or non-increasing timestamps
      }
      outTimes.push(t);
      for (let s = 0; s < stride; s++) {
        outValues.push(slice[s]);
      }
    }

    if (runTrack) {
      // Loop run keyframes up to runDuration
      const runDur = runTrack.times[runTrack.times.length - 1] || 0.6;
      let offset = 0;
      while (offset < runDuration) {
        for (let i = 0; i < runTrack.times.length; i++) {
          const t = offset + runTrack.times[i];
          if (t <= runDuration) {
            const slice = [];
            for (let s = 0; s < stride; s++) slice.push(runTrack.values[i * stride + s]);
            addKeyframe(t, slice);
          }
        }
        offset += runDur;
      }
    } else if (hitTrack) {
      // If no runTrack, hold initial hitTrack pose during run phase
      const initialSlice = [];
      for (let s = 0; s < stride; s++) initialSlice.push(hitTrack.values[s]);
      addKeyframe(0, initialSlice);
      addKeyframe(runDuration, initialSlice);
    }

    if (hitTrack) {
      for (let i = 0; i < hitTrack.times.length; i++) {
        const t = tHitStart + hitTrack.times[i];
        const slice = [];
        for (let s = 0; s < stride; s++) slice.push(hitTrack.values[i * stride + s]);
        addKeyframe(t, slice);
      }
    } else if (runTrack) {
      // If no hitTrack, hold last runTrack pose until totalDuration
      const lastSlice = [];
      const lastIdx = (runTrack.times.length - 1) * stride;
      for (let s = 0; s < stride; s++) lastSlice.push(runTrack.values[lastIdx + s]);
      addKeyframe(tHitStart, lastSlice);
      addKeyframe(totalDuration, lastSlice);
    }

    if (outTimes.length > 0) {
      const timesArr = new Float32Array(outTimes);
      const valuesArr = new Float32Array(outValues);
      if (isQuat) {
        newTracks.push(new THREE.QuaternionKeyframeTrack(trackName, timesArr, valuesArr));
      } else {
        newTracks.push(new THREE.VectorKeyframeTrack(trackName, timesArr, valuesArr));
      }
    }
  });

  const stitchedClip = new THREE.AnimationClip(name, totalDuration, newTracks);
  return stitchedClip;
}

async function setupAnimations(animations) {
  animClipSelect.innerHTML = '';

  if (!animations || animations.length === 0) {
    animationPanel.classList.add('hidden');
    debugClipName.textContent = 'Tidak ada animasi';
    debugStatus.textContent = 'Diam';
    debugTracksCount.textContent = '0';
    debugBindingStatus.textContent = 'Model statis (tanpa klip)';
    if (animTimelineSlider) animTimelineSlider.value = 0;
    if (animCurrentTime) animCurrentTime.textContent = '00:00.0';
    if (animTotalDuration) animTotalDuration.textContent = '00:00.0';
    if (animTimelineProgress) animTimelineProgress.style.width = '0%';
    return;
  }

  animationPanel.classList.remove('hidden');
  state.mixer = new THREE.AnimationMixer(state.currentModel);
  state.actions = [];
  state.allClips = [];

  const mainClip = animations[0];
  const fps = 30;
  const isTennisModel = (state.activeModelName && state.activeModelName.toLowerCase().includes('tennis')) ||
                        (mainClip.duration >= 25 && mainClip.duration <= 32);

  if (isTennisModel) {
    // 1. Full original clip
    const fullClip = mainClip.clone();
    fullClip.name = 'Full MoCap';
    fullClip.icon = '🎬';
    fullClip.sourceRange = [0, mainClip.duration];

    // 2. Base SubClips from SUBCLIPS_CONFIG
    const subclipsMap = new Map();
    SUBCLIPS_CONFIG.forEach((cfg) => {
      const startFrame = Math.round(cfg.start * fps);
      const endFrame = Math.round(cfg.end * fps);
      const sub = THREE.AnimationUtils.subclip(mainClip, cfg.name, startFrame, endFrame, fps);
      sub.sourceRange = [cfg.start, cfg.end];
      sub.icon = cfg.icon;
      subclipsMap.set(cfg.name, sub);
    });

    const idleClip = subclipsMap.get('Idle (Stance Ready)');
    const forehandClip = subclipsMap.get('Forehand Drive');
    const backhandClip = subclipsMap.get('Backhand Drive');
    const smashClip = subclipsMap.get('Servis Atas');
    const forehand2Clip = subclipsMap.get('Forehand 2');
    const serviceBawahClip = subclipsMap.get('Servis Bawah');
    const jabatTanganClip = subclipsMap.get('9. Penutup (Jabat Tangan)');

    // 3. Stitched Volley Clips (Running + Forehand/Backhand)
    let volleyForehandClip = null;
    let volleyBackhandClip = null;

    try {
      const runClip = await getRunningClip();
      if (runClip && forehandClip) {
        volleyForehandClip = createStitchedVolleyClip('Volley Forehand', runClip, forehandClip, 1.1, 0.2, state.currentModel);
        volleyForehandClip.icon = '🎾';
        volleyForehandClip.sourceRange = [0, volleyForehandClip.duration];
      }
      if (runClip && backhandClip) {
        volleyBackhandClip = createStitchedVolleyClip('Volley Backhand', runClip, backhandClip, 1.1, 0.2, state.currentModel);
        volleyBackhandClip.icon = '🎾';
        volleyBackhandClip.sourceRange = [0, volleyBackhandClip.duration];
      }
    } catch (err) {
      console.error('Gagal membuat klip Volley:', err);
      logDebug(`Peringatan: Gagal membuat klip Volley: ${err.message}`);
    }

    let orderedClips = [
      //fullClip,
      idleClip,
      forehandClip,
      backhandClip,
      smashClip,
      //serviceBawahClip,
      volleyForehandClip,
      volleyBackhandClip,
      //forehand2Clip,
      //jabatTanganClip,
    ].filter(Boolean);

    orderedClips = filterClip(orderedClips);

    orderedClips.forEach((clip, index) => {
      state.allClips.push(clip);
      const action = state.mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      state.actions.push(action);

      const rangeStr = clip.sourceRange ? ` [${clip.sourceRange[0].toFixed(1)}s - ${clip.sourceRange[1].toFixed(1)}s]` : '';
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${clip.icon || '🎾'} ${clip.name}${rangeStr}`;
      animClipSelect.appendChild(option);
    });

    logDebug(`Berhasil membuat 1 Klip Penuh dan ${state.allClips.length - 1} SubClips tenis (termasuk Volley)!`);
  } else {
    // Generic FBX animations
    animations.forEach((clip, index) => {
      state.allClips.push(clip);
      const action = state.mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      state.actions.push(action);

      const durationStr = clip.duration ? ` (${clip.duration.toFixed(1)}s)` : '';
      const clipTitle = clip.name || `MoCap ${index + 1}`;

      const option = document.createElement('option');
      option.value = index;
      option.textContent = `🏃 ${clipTitle}${durationStr}`;
      animClipSelect.appendChild(option);
    });
  }

  // Play first animation by default
  playAnimation(0);
}

function playAnimation(index) {
  if (!state.actions[index]) return;

  const nextAction = state.actions[index];
  const clip = state.allClips[index] || (state.currentModel && state.currentModel.animations && state.currentModel.animations[index]);
  const duration = clip ? clip.duration : 0;

  if (state.activeAction && state.activeAction !== nextAction) {
    state.activeAction.fadeOut(0.25);
  }

  nextAction.reset();
  nextAction.setLoop(THREE.LoopRepeat);
  nextAction.clampWhenFinished = false;
  nextAction.timeScale = state.animSpeed;
  nextAction.paused = !state.isPlaying;
  nextAction.fadeIn(0.25);
  nextAction.play();

  state.activeAction = nextAction;
  animClipSelect.value = index;
  updatePlayPauseUI();

  // Initialize Timeline Scrubber for this clip / subclip
  if (animTimelineSlider) {
    animTimelineSlider.min = 0;
    animTimelineSlider.max = duration;
    animTimelineSlider.step = 0.01;
    animTimelineSlider.value = 0;
  }
  if (animTotalDuration) {
    animTotalDuration.textContent = formatTime(duration);
  }
  if (animCurrentTime) {
    animCurrentTime.textContent = formatTime(0);
  }
  if (animTimelineProgress) {
    animTimelineProgress.style.width = '0%';
  }

  // Update Debug HUD
  const rangeInfo = clip && clip.sourceRange ? ` [Detik Asli: ${clip.sourceRange[0].toFixed(1)}s - ${clip.sourceRange[1].toFixed(1)}s]` : '';
  const clipTitle = clip ? clip.name : `Klip ${index + 1}`;
  debugClipName.textContent = clipTitle + rangeInfo;
  debugStatus.textContent = state.isPlaying ? 'Memutar (Loop)' : 'Dijeda';
  debugTracksCount.textContent = clip ? `${clip.tracks.length} tracks` : '0';
  debugBindingStatus.textContent = `Aktif (${duration.toFixed(2)}s)`;

  logDebug(`Memutar animasi: '${clipTitle}' (${clip ? clip.tracks.length : 0} tracks, durasi ${duration.toFixed(2)}s${rangeInfo})`);
}

function updatePlayPauseUI() {
  if (state.isPlaying) {
    iconPause.style.display = 'block';
    iconPlay.style.display = 'none';
    animPlayText.textContent = 'Jeda';
    debugStatus.textContent = 'Memutar';
  } else {
    iconPause.style.display = 'none';
    iconPlay.style.display = 'block';
    animPlayText.textContent = 'Putar';
    debugStatus.textContent = 'Dijeda';
  }
}

// --- File Input & Model Switcher Handlers ---
if (btnDefaultModel) {
  btnDefaultModel.addEventListener('click', () => {
    if (state.activeModelName !== 'Tennis_mixamo.fbx') {
      loadFBX('Tennis_mixamo.fbx', 'Tennis_mixamo.fbx');
    }
  });
}

btnUploadFbx.addEventListener('click', () => {
  fbxFileInput.click();
});

if (btnWelcomePick) {
  btnWelcomePick.addEventListener('click', () => {
    fbxFileInput.click();
  });
}

fbxFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    if (file.name.match(/\.fbx$/i)) {
      const blobUrl = URL.createObjectURL(file);
      loadFBX(blobUrl, file.name, true);
    } else {
      showToast('Harap pilih file dengan format .fbx');
    }
  }
});

// Drag and Drop
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzoneOverlay.classList.remove('hidden');
});

window.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) {
    dropzoneOverlay.classList.add('hidden');
  }
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzoneOverlay.classList.add('hidden');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.name.match(/\.fbx$/i)) {
      const blobUrl = URL.createObjectURL(file);
      loadFBX(blobUrl, file.name, true);
    } else {
      showToast('Harap jatuhkan file dengan format .fbx');
    }
  }
});

// --- Animation Controls Listeners ---
btnPlayPause.addEventListener('click', () => {
  if (!state.activeAction) return;

  state.isPlaying = !state.isPlaying;
  state.activeAction.paused = !state.isPlaying;
  updatePlayPauseUI();
});

animClipSelect.addEventListener('change', (e) => {
  const selectedIndex = parseInt(e.target.value, 10);
  if (!isNaN(selectedIndex)) {
    playAnimation(selectedIndex);
  }
});

btnAnimSpeed.addEventListener('click', () => {
  const speeds = [0.5, 1.0] //, 1.5, 2.0];
  const nextIdx = (speeds.indexOf(state.animSpeed) + 1) % speeds.length;
  state.animSpeed = speeds[nextIdx];
  animSpeedLabel.textContent = `${state.animSpeed.toFixed(1)}x`;

  if (state.activeAction) {
    state.activeAction.timeScale = state.animSpeed;
  }
});

// --- Timeline Scrubber Controls ---
if (animTimelineSlider) {
  const seekAnimation = (targetTime) => {
    if (!state.activeAction || !state.mixer) return;
    const clip = state.activeAction.getClip();
    const duration = clip ? clip.duration : 0;
    if (duration <= 0) return;

    targetTime = Math.max(0, Math.min(duration, targetTime));
    state.activeAction.time = targetTime;
    state.mixer.update(0);

    if (animCurrentTime) animCurrentTime.textContent = formatTime(targetTime);
    if (animTimelineProgress) {
      const pct = (targetTime / duration) * 100;
      animTimelineProgress.style.width = `${pct}%`;
    }
  };

  animTimelineSlider.addEventListener('pointerdown', () => {
    state.isScrubbing = true;
  });

  animTimelineSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    seekAnimation(val);
  });

  const endScrubbing = () => {
    if (state.isScrubbing) {
      state.isScrubbing = false;
      if (state.activeAction && state.mixer) {
        state.activeAction.time = parseFloat(animTimelineSlider.value);
        state.mixer.update(0);
      }
    }
  };

  animTimelineSlider.addEventListener('pointerup', endScrubbing);
  animTimelineSlider.addEventListener('pointercancel', endScrubbing);
  animTimelineSlider.addEventListener('change', endScrubbing);
}

// --- Zoom Controls Logic ---
let isInternalZoomUpdate = false;

function getZoomPercentage() {
  const currentDist = camera.position.distanceTo(controls.target);
  if (currentDist <= 0.0001 || !state.defaultCamDist) return 100;
  return Math.round((state.defaultCamDist / currentDist) * 100);
}

function updateZoomUI() {
  const percent = getZoomPercentage();
  if (zoomPercentText) {
    zoomPercentText.textContent = `${percent}%`;
  }
  if (zoomRange && !isInternalZoomUpdate) {
    zoomRange.value = Math.min(350, Math.max(25, percent));
  }
}

function setZoomByPercentage(percent) {
  percent = Math.max(30, Math.min(350, percent));
  const targetDist = state.defaultCamDist / (percent / 100);
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const currentLen = offset.length();

  if (currentLen > 0.0001) {
    isInternalZoomUpdate = true;
    offset.normalize().multiplyScalar(targetDist);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    if (zoomPercentText) {
      zoomPercentText.textContent = `${Math.round(percent)}%`;
    }
    isInternalZoomUpdate = false;
  }
}

function zoomStep(factor) {
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const newLen = offset.length() * factor;
  if (newLen >= controls.minDistance && newLen <= controls.maxDistance) {
    offset.normalize().multiplyScalar(newLen);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    updateZoomUI();
  }
}

// Continuous hold to zoom
let zoomHoldInterval = null;

function startZoomHold(factor) {
  zoomStep(factor);
  zoomHoldInterval = setInterval(() => {
    zoomStep(factor);
  }, 60);
}

function stopZoomHold() {
  if (zoomHoldInterval) {
    clearInterval(zoomHoldInterval);
    zoomHoldInterval = null;
  }
}

btnZoomIn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  startZoomHold(0.95);
});
btnZoomIn.addEventListener('pointerup', stopZoomHold);
btnZoomIn.addEventListener('pointerleave', stopZoomHold);
btnZoomIn.addEventListener('pointercancel', stopZoomHold);

btnZoomOut.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  startZoomHold(1.05);
});
btnZoomOut.addEventListener('pointerup', stopZoomHold);
btnZoomOut.addEventListener('pointerleave', stopZoomHold);
btnZoomOut.addEventListener('pointercancel', stopZoomHold);

// Reset Zoom to 100% on badge click
btnZoomReset.addEventListener('click', () => {
  setZoomByPercentage(40);
  showToast('Zoom di-reset ke 100%');
});

// Slider scrubbing
zoomRange.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  setZoomByPercentage(val);
});

// OrbitControls change listener: keeps zoom percentage & slider in sync with pinch-to-zoom / wheel
controls.addEventListener('change', () => {
  if (!isInternalZoomUpdate) {
    updateZoomUI();
  }
});

// --- Quick Tools Listeners ---
btnResetCam.addEventListener('click', () => {
  camera.position.copy(state.defaultCamPos);
  controls.target.copy(state.defaultTarget);
  controls.update();
  updateZoomUI();
  setZoomByPercentage(40);
  showToast('Kamera di-reset ke tengah');
});

btnAutoRotate.addEventListener('click', () => {
  state.autoRotate = !state.autoRotate;
  controls.autoRotate = state.autoRotate;
  btnAutoRotate.classList.toggle('active', state.autoRotate);
});

btnWireframe.addEventListener('click', () => {
  state.wireframe = !state.wireframe;
  btnWireframe.classList.toggle('active', state.wireframe);

  if (state.currentModel) {
    state.currentModel.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => { m.wireframe = state.wireframe; });
        } else {
          child.material.wireframe = state.wireframe;
        }
      }
    });
  }
  showToast(state.wireframe ? 'Mode Wireframe Aktif' : 'Mode Wireframe Nonaktif');
});

btnGrid.addEventListener('click', () => {
  state.gridVisible = !state.gridVisible;
  gridHelper.visible = state.gridVisible;
  btnGrid.classList.toggle('active', state.gridVisible);
});

btnTheme.addEventListener('click', () => {
  state.themeIndex = (state.themeIndex + 1) % THEMES.length;
  const currentTheme = THEMES[state.themeIndex];

  scene.background.setHex(currentTheme.bg);
  document.body.style.backgroundColor = '#' + currentTheme.bg.toString(16).padStart(6, '0');

  // Re-create grid with current theme colors
  scene.remove(gridHelper);
  const gridExtent = gridHelper.geometry.parameters ? gridHelper.geometry.parameters.width : 4;
  gridHelper = new THREE.GridHelper(gridExtent, Math.max(12, gridExtent * 4), currentTheme.grid1, currentTheme.grid2);
  gridHelper.visible = state.gridVisible;
  scene.add(gridHelper);

  showToast(`Tema: ${currentTheme.name}`);
});

// --- Info Modal Listeners ---
btnToggleInfo.addEventListener('click', () => {
  infoModal.classList.toggle('hidden');
});

btnCloseInfo.addEventListener('click', () => {
  infoModal.classList.add('hidden');
});

// --- Debug Modal Listeners ---
btnToggleDebug.addEventListener('click', () => {
  debugModal.classList.toggle('hidden');
});

btnCloseDebug.addEventListener('click', () => {
  debugModal.classList.add('hidden');
});

if (btnToggleRacket) {
  btnToggleRacket.addEventListener('click', () => {
    state.racketVisible = !state.racketVisible;
    btnToggleRacket.classList.toggle('active', state.racketVisible);
    if (checkRacket) checkRacket.checked = state.racketVisible;
    if (checkRacketActive) checkRacketActive.checked = state.racketVisible;
    if (state.racketObject) state.racketObject.visible = state.racketVisible;
    showToast(state.racketVisible ? 'Raket Ditampilkan' : 'Raket Disembunyikan');
  });
}

if (checkRacket) {
  checkRacket.addEventListener('change', (e) => {
    state.racketVisible = e.target.checked;
    if (btnToggleRacket) btnToggleRacket.classList.toggle('active', state.racketVisible);
    if (checkRacketActive) checkRacketActive.checked = state.racketVisible;
    if (state.racketObject) state.racketObject.visible = state.racketVisible;
    showToast(state.racketVisible ? 'Raket Ditampilkan' : 'Raket Disembunyikan');
  });
}

// --- Racket Tuning Modal Event Listeners ---
if (btnToggleRacketSettings) {
  btnToggleRacketSettings.addEventListener('click', () => {
    racketModal.classList.toggle('hidden');
    infoModal.classList.add('hidden');
    debugModal.classList.add('hidden');
  });
}

if (btnCloseRacketModal) {
  btnCloseRacketModal.addEventListener('click', () => {
    racketModal.classList.add('hidden');
  });
}

if (btnOpenRacketFromDebug) {
  btnOpenRacketFromDebug.addEventListener('click', () => {
    debugModal.classList.add('hidden');
    racketModal.classList.remove('hidden');
  });
}

if (checkRacketActive) {
  checkRacketActive.addEventListener('change', (e) => {
    state.racketVisible = e.target.checked;
    if (state.racketObject) state.racketObject.visible = state.racketVisible;
    if (checkRacket) checkRacket.checked = state.racketVisible;
    if (btnToggleRacket) btnToggleRacket.classList.toggle('active', state.racketVisible);
    showToast(state.racketVisible ? 'Raket Ditampilkan' : 'Raket Disembunyikan');
  });
}

// Preset Buttons
if (presetRacketNormal) {
  presetRacketNormal.addEventListener('click', () => {
    state.racketConfig = {
      scale: 1.0,
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
    };
    applyRacketTransform();
    showToast('Preset: Normal (1.0x) diterapkan');
  });
}

if (presetRacketTennis) {
  presetRacketTennis.addEventListener('click', () => {
    state.racketConfig = {
      scale: 0.40,
      posX: 30.0,
      posY: 6.0,
      posZ: -6.0,
      rotX: 45,
      rotY: 15,
      rotZ: -100,
    };
    applyRacketTransform();
    showToast('Preset: Tenis Atlet (0.40x) diterapkan');
  });
}

if (presetRacketLarge) {
  presetRacketLarge.addEventListener('click', () => {
    state.racketConfig.scale = 1.5;
    applyRacketTransform();
    showToast('Preset: Besar (1.5x) diterapkan');
  });
}

// Sliders Live Input
if (sliderRacketScale) {
  sliderRacketScale.addEventListener('input', (e) => {
    state.racketConfig.scale = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketPosX) {
  sliderRacketPosX.addEventListener('input', (e) => {
    state.racketConfig.posX = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketPosY) {
  sliderRacketPosY.addEventListener('input', (e) => {
    state.racketConfig.posY = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketPosZ) {
  sliderRacketPosZ.addEventListener('input', (e) => {
    state.racketConfig.posZ = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketRotX) {
  sliderRacketRotX.addEventListener('input', (e) => {
    state.racketConfig.rotX = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketRotY) {
  sliderRacketRotY.addEventListener('input', (e) => {
    state.racketConfig.rotY = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

if (sliderRacketRotZ) {
  sliderRacketRotZ.addEventListener('input', (e) => {
    state.racketConfig.rotZ = parseFloat(e.target.value);
    applyRacketTransform();
  });
}

// Reset Button
if (btnResetRacketTuning) {
  btnResetRacketTuning.addEventListener('click', () => {
    state.racketConfig = {
      scale: 0.40,
      posX: 30.0,
      posY: 6.0,
      posZ: -6.0,
      rotX: 45,
      rotY: 15,
      rotZ: -100,
    };
    applyRacketTransform();
    showToast('Pengaturan raket direset ke konfigurasi atlet (0.40x)');
  });
}

// Copy Config Button
if (btnCopyRacketTuning) {
  btnCopyRacketTuning.addEventListener('click', () => {
    const cfg = state.racketConfig;
    const text = `// Konfigurasi Raket Tenis:\nscale: ${cfg.scale.toFixed(2)},\nposX: ${cfg.posX.toFixed(1)},\nposY: ${cfg.posY.toFixed(1)},\nposZ: ${cfg.posZ.toFixed(1)},\nrotX: ${cfg.rotX},\nrotY: ${cfg.rotY},\nrotZ: ${cfg.rotZ}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Nilai konfigurasi raket berhasil disalin ke clipboard!');
    }).catch(() => {
      showToast(`Skala: ${cfg.scale}x | Pos: [${cfg.posX}, ${cfg.posY}, ${cfg.posZ}] | Rot: [${cfg.rotX}°, ${cfg.rotY}°, ${cfg.rotZ}°]`);
    });
});
}
// --- Arm Pose Tuning Handlers & Listeners ---
function updateArmTuningUI() {
  const cfgR = state.armConfig.rightForeArm;
  const cfgL = state.armConfig.leftForeArm;

  if (sliderRarmRotX) sliderRarmRotX.value = cfgR.rotX;
  if (valRarmRotX) valRarmRotX.textContent = `${Math.round(cfgR.rotX)}°`;
  if (sliderRarmRotY) sliderRarmRotY.value = cfgR.rotY;
  if (valRarmRotY) valRarmRotY.textContent = `${Math.round(cfgR.rotY)}°`;
  if (sliderRarmRotZ) sliderRarmRotZ.value = cfgR.rotZ;
  if (valRarmRotZ) valRarmRotZ.textContent = `${Math.round(cfgR.rotZ)}°`;

  if (sliderLarmRotX) sliderLarmRotX.value = cfgL.rotX;
  if (valLarmRotX) valLarmRotX.textContent = `${Math.round(cfgL.rotX)}°`;
  if (sliderLarmRotY) sliderLarmRotY.value = cfgL.rotY;
  if (valLarmRotY) valLarmRotY.textContent = `${Math.round(cfgL.rotY)}°`;
  if (sliderLarmRotZ) sliderLarmRotZ.value = cfgL.rotZ;
  if (valLarmRotZ) valLarmRotZ.textContent = `${Math.round(cfgL.rotZ)}°`;

  if (checkArmCorrection) checkArmCorrection.checked = state.armCorrectionEnabled;
  if (checkArmOnlyIdle) checkArmOnlyIdle.checked = state.armOnlyIdle;
}

if (btnToggleArmSettings) {
  btnToggleArmSettings.addEventListener('click', () => {
    armModal.classList.toggle('hidden');
    racketModal.classList.add('hidden');
    infoModal.classList.add('hidden');
    debugModal.classList.add('hidden');
    if (!armModal.classList.contains('hidden')) {
      updateArmTuningUI();
    }
  });
}

if (btnCloseArmModal) {
  btnCloseArmModal.addEventListener('click', () => {
    armModal.classList.add('hidden');
  });
}

if (btnOpenArmFromDebug) {
  btnOpenArmFromDebug.addEventListener('click', () => {
    debugModal.classList.add('hidden');
    armModal.classList.remove('hidden');
    updateArmTuningUI();
  });
}

if (checkArmCorrection) {
  checkArmCorrection.addEventListener('change', (e) => {
    state.armCorrectionEnabled = e.target.checked;
    showToast(state.armCorrectionEnabled ? 'Koreksi Pose Lengan: Aktif' : 'Koreksi Pose Lengan: Nonaktif');
  });
}

if (checkArmOnlyIdle) {
  checkArmOnlyIdle.addEventListener('change', (e) => {
    state.armOnlyIdle = e.target.checked;
    showToast(state.armOnlyIdle ? 'Koreksi Lengan: Khusus Idle/Stance' : 'Koreksi Lengan: Semua Gerakan');
  });
}

// Right Forearm Sliders
if (sliderRarmRotX) {
  sliderRarmRotX.addEventListener('input', (e) => {
    state.armConfig.rightForeArm.rotX = parseFloat(e.target.value);
    if (valRarmRotX) valRarmRotX.textContent = `${Math.round(state.armConfig.rightForeArm.rotX)}°`;
  });
}

if (sliderRarmRotY) {
  sliderRarmRotY.addEventListener('input', (e) => {
    state.armConfig.rightForeArm.rotY = parseFloat(e.target.value);
    if (valRarmRotY) valRarmRotY.textContent = `${Math.round(state.armConfig.rightForeArm.rotY)}°`;
  });
}

if (sliderRarmRotZ) {
  sliderRarmRotZ.addEventListener('input', (e) => {
    state.armConfig.rightForeArm.rotZ = parseFloat(e.target.value);
    if (valRarmRotZ) valRarmRotZ.textContent = `${Math.round(state.armConfig.rightForeArm.rotZ)}°`;
  });
}

// Left Forearm Sliders
if (sliderLarmRotX) {
  sliderLarmRotX.addEventListener('input', (e) => {
    state.armConfig.leftForeArm.rotX = parseFloat(e.target.value);
    if (valLarmRotX) valLarmRotX.textContent = `${Math.round(state.armConfig.leftForeArm.rotX)}°`;
  });
}

if (sliderLarmRotY) {
  sliderLarmRotY.addEventListener('input', (e) => {
    state.armConfig.leftForeArm.rotY = parseFloat(e.target.value);
    if (valLarmRotY) valLarmRotY.textContent = `${Math.round(state.armConfig.leftForeArm.rotY)}°`;
  });
}

if (sliderLarmRotZ) {
  sliderLarmRotZ.addEventListener('input', (e) => {
    state.armConfig.leftForeArm.rotZ = parseFloat(e.target.value);
    if (valLarmRotZ) valLarmRotZ.textContent = `${Math.round(state.armConfig.leftForeArm.rotZ)}°`;
  });
}

// Reset Arm Tuning
if (btnResetArmTuning) {
  btnResetArmTuning.addEventListener('click', () => {
    state.armConfig = {
      rightForeArm: { rotX: 0, rotY: 0, rotZ: 20 },
      leftForeArm: { rotX: 0, rotY: 0, rotZ: 20 },
    };
    updateArmTuningUI();
    showToast('Pose lengan dikembalikan ke setelan atlet (rotZ: 20°)');
  });
}

// Copy Arm Tuning Config
if (btnCopyArmTuning) {
  btnCopyArmTuning.addEventListener('click', () => {
    const cfg = state.armConfig;
    const text = `// Konfigurasi Koreksi Lengan:\nrightForeArm: { rotX: ${cfg.rightForeArm.rotX}, rotY: ${cfg.rightForeArm.rotY}, rotZ: ${cfg.rightForeArm.rotZ} },\nleftForeArm: { rotX: ${cfg.leftForeArm.rotX}, rotY: ${cfg.leftForeArm.rotY}, rotZ: ${cfg.leftForeArm.rotZ} }`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Nilai sudut rotasi lengan disalin ke clipboard!');
    }).catch(() => {
      showToast(`R_Arm: [${cfg.rightForeArm.rotX}°, ${cfg.rightForeArm.rotY}°, ${cfg.rightForeArm.rotZ}°] | L_Arm: [${cfg.leftForeArm.rotX}°, ${cfg.leftForeArm.rotY}°, ${cfg.leftForeArm.rotZ}°]`);
    });
  });
}

if (btnCameraFollow) {
  btnCameraFollow.addEventListener('click', () => {
    state.cameraFollow = !state.cameraFollow;
    btnCameraFollow.classList.toggle('active', state.cameraFollow);
    if (checkCameraFollow) {
      checkCameraFollow.checked = state.cameraFollow;
    }
    showToast(state.cameraFollow ? 'Camera Follow: Aktif (Spinal Tracker)' : 'Camera Follow: Nonaktif');
  });
}

if (checkCameraFollow) {
  checkCameraFollow.addEventListener('change', (e) => {
    state.cameraFollow = e.target.checked;
    if (btnCameraFollow) {
      btnCameraFollow.classList.toggle('active', state.cameraFollow);
    }
    showToast(state.cameraFollow ? 'Camera Follow: Aktif (Spinal Tracker)' : 'Camera Follow: Nonaktif');
  });
}

if (btnSkeleton) {
  btnSkeleton.addEventListener('click', () => {
    state.skeletonVisible = !state.skeletonVisible;
    if (skeletonHelper) {
      skeletonHelper.visible = state.skeletonVisible;
    }
    btnSkeleton.classList.toggle('active', state.skeletonVisible);
    if (checkSkeletonHelper) {
      checkSkeletonHelper.checked = state.skeletonVisible;
    }
    showToast(state.skeletonVisible ? 'Skeleton Ditampilkan' : 'Skeleton Disembunyikan');
  });
}

if (checkSkeletonHelper) {
  checkSkeletonHelper.addEventListener('change', (e) => {
    state.skeletonVisible = e.target.checked;
    if (skeletonHelper) {
      skeletonHelper.visible = state.skeletonVisible;
    }
    if (btnSkeleton) {
      btnSkeleton.classList.toggle('active', state.skeletonVisible);
    }
    showToast(state.skeletonVisible ? 'Skeleton Ditampilkan' : 'Skeleton Disembunyikan');
  });
}

// --- Fullscreen Handler ---
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    iconExpand.style.display = 'none';
    iconCompress.style.display = 'block';
  } else {
    document.exitFullscreen().catch(() => {});
    iconExpand.style.display = 'block';
    iconCompress.style.display = 'none';
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    iconExpand.style.display = 'block';
    iconCompress.style.display = 'none';
  } else {
    iconExpand.style.display = 'none';
    iconCompress.style.display = 'block';
  }
});

// --- Window Resize Handler ---
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', () => {
  setTimeout(onWindowResize, 150);
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // 1. Revert previous frame's arm offsets so bones return to clean base/animation pose
  if (state.rightForeArmBone && (state.lastArmOffsetR.x !== 0 || state.lastArmOffsetR.y !== 0 || state.lastArmOffsetR.z !== 0 || state.lastArmOffsetR.w !== 1)) {
    const invR = state.lastArmOffsetR.clone().invert();
    state.rightForeArmBone.quaternion.multiply(invR);
    state.lastArmOffsetR.identity();
  }
  if (state.leftForeArmBone && (state.lastArmOffsetL.x !== 0 || state.lastArmOffsetL.y !== 0 || state.lastArmOffsetL.z !== 0 || state.lastArmOffsetL.w !== 1)) {
    const invL = state.lastArmOffsetL.clone().invert();
    state.leftForeArmBone.quaternion.multiply(invL);
    state.lastArmOffsetL.identity();
  }

  // 2. Update animation mixer
  if (state.mixer) {
    state.mixer.update(delta);
  }

  // 3. Apply current procedural arm offsets (only once per frame, never accumulates)
  if (state.armCorrectionEnabled) {
    const isIdle = state.activeAction && state.activeAction.getClip().name.toLowerCase().includes('idle');
    if (!state.armOnlyIdle || isIdle) {
      if (state.rightForeArmBone) {
        const cfgR = state.armConfig.rightForeArm;
        if (cfgR.rotX !== 0 || cfgR.rotY !== 0 || cfgR.rotZ !== 0) {
          const eR = new THREE.Euler(
            THREE.MathUtils.degToRad(cfgR.rotX),
            THREE.MathUtils.degToRad(cfgR.rotY),
            THREE.MathUtils.degToRad(cfgR.rotZ),
            'XYZ'
          );
          state.lastArmOffsetR.setFromEuler(eR);
          state.rightForeArmBone.quaternion.multiply(state.lastArmOffsetR);
        }
      }
      if (state.leftForeArmBone) {
        const cfgL = state.armConfig.leftForeArm;
        if (cfgL.rotX !== 0 || cfgL.rotY !== 0 || cfgL.rotZ !== 0) {
          const eL = new THREE.Euler(
            THREE.MathUtils.degToRad(cfgL.rotX),
            THREE.MathUtils.degToRad(cfgL.rotY),
            THREE.MathUtils.degToRad(cfgL.rotZ),
            'XYZ'
          );
          state.lastArmOffsetL.setFromEuler(eL);
          state.leftForeArmBone.quaternion.multiply(state.lastArmOffsetL);
        }
      }
    }
  }

  // Spinal Tracker: Camera smoothly follows the character's spine/hips
  if (state.cameraFollow && state.trackerBone) {
    const trackerPos = new THREE.Vector3();
    state.trackerBone.getWorldPosition(trackerPos);
    const deltaTarget = new THREE.Vector3().subVectors(trackerPos, controls.target);
    if (deltaTarget.lengthSq() > 0.000001) {
      const move = deltaTarget.multiplyScalar(0.08);
      controls.target.add(move);
      camera.position.add(move);
    }
  }

  // Update timeline slider and labels during playback
  if (state.activeAction && !state.isScrubbing && animTimelineSlider) {
    const clip = state.activeAction.getClip();
    const duration = clip ? clip.duration : 0;
    if (duration > 0) {
      let curTime = state.activeAction.time % duration;
      if (curTime < 0) curTime += duration;
      animTimelineSlider.value = curTime;
      if (animCurrentTime) animCurrentTime.textContent = formatTime(curTime);
      if (animTimelineProgress) {
        const pct = (curTime / duration) * 100;
        animTimelineProgress.style.width = `${pct}%`;
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function filterClip(array){
  let tmp = array;

  /*
  idle, forehand, backhand,
  servis atas, servis bawah, 
  volley forehand, volley backhand

  */
  let url = document.location.href; //untuk mengambil url
  let value = [];
  url = url.split('?');
  if(url.length > 1){
    value[0] = tmp[url[1]];
    return value;
  }

  return array;
}


animate();

logDebug('FBX MoCap Viewer siap! Memuat model default Tennis_mixamo.fbx...');

// --- Auto-load Default Fixed Model ---
loadFBX('Tennis_mixamo.fbx', 'Tennis_mixamo.fbx');
