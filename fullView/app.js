import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTennisAnimationClips } from './tennisMoves.js';

// --- State Management ---
const state = {
  activeModelName: 'karakter_atlet2.glb',
  currentModel: null,
  mixer: null,
  actions: [],
  activeAction: null,
  isPlaying: true,
  isScrubbing: false,
  animSpeed: 1.0,
  wireframe: false,
  gridVisible: true,
  autoRotate: false,
  themeIndex: 0,
  defaultCamDist: 5,
  defaultTarget: new THREE.Vector3(0, 1, 0),
  defaultCamPos: new THREE.Vector3(2, 2, 4),
};

const THEMES = [
  { name: 'Dark Studio', bg: 0x0b0f19, grid1: 0x1e293b, grid2: 0x334155 },
  { name: 'Slate Gray', bg: 0x1e293b, grid1: 0x334155, grid2: 0x475569 },
  { name: 'Clean White', bg: 0xf1f5f9, grid1: 0xcfd8dc, grid2: 0x90a4ae },
];

// --- DOM Elements ---
const canvas = document.getElementById('webgl-canvas');
const activeModelNameEl = document.getElementById('active-model-name');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingTitle = document.getElementById('loading-title');
const loadingDetail = document.getElementById('loading-detail');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const dropzoneOverlay = document.getElementById('dropzone-overlay');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');
const toastCloseBtn = document.getElementById('toast-close');
const corsModal = document.getElementById('cors-modal');
const btnCloseCors = document.getElementById('btn-close-cors');
const btnCorsPickFile = document.getElementById('btn-cors-pick-file');
const fileInput = document.getElementById('file-input');
const btnCustomFile = document.getElementById('btn-custom-file');
const modelPills = document.querySelectorAll('.model-pill[data-model]');

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
const checkSkeletonHelper = document.getElementById('check-skeleton-helper');
const debugLogContent = document.getElementById('debug-log-content');

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
const btnWireframe = document.getElementById('btn-wireframe');
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
camera.position.set(2, 2, 4);

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
controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow slightly below horizon
controls.minDistance = 0.2;
controls.maxDistance = 50;
controls.target.set(0, 0.8, 0);
controls.update();

// --- Lighting & Shadow Catcher ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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
let gridHelper = new THREE.GridHelper(12, 24, THEMES[0].grid1, THEMES[0].grid2);
gridHelper.position.y = 0;
scene.add(gridHelper);

// --- Loaders Setup ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

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

// --- Model Loading & Setup ---
function loadModel(url, displayName, isBlob = false) {
  state.activeModelName = displayName;
  activeModelNameEl.textContent = displayName;

  // Show loading screen
  loadingOverlay.classList.remove('fade-out');
  loadingTitle.textContent = `Memuat ${displayName}...`;
  loadingDetail.textContent = 'Mengunduh dan mendekode data 3D...';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  // Update active pill
  modelPills.forEach(pill => {
    if (pill.getAttribute('data-model') === displayName) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  gltfLoader.load(
    url,
    (gltf) => {
      onModelLoaded(gltf, displayName);
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
      console.error('GLTF Load Error:', error);
      loadingOverlay.classList.add('fade-out');

      // Check for file:// protocol CORS restriction
      if (window.location.protocol === 'file:') {
        corsModal.classList.remove('hidden');
      } else {
        showToast(`Gagal memuat ${displayName}: ${error.message || 'File tidak ditemukan'}`);
      }
    }
  );
}

function onModelLoaded(gltf, displayName) {
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

  if (state.mixer) {
    state.mixer.stopAllAction();
    state.mixer.uncacheRoot(state.currentModel);
    state.mixer = null;
  }
  state.actions = [];
  state.activeAction = null;

  const model = gltf.scene;
  state.currentModel = model;

  // Enable Shadows and adjust materials
  let meshCount = 0;
  let triangleCount = 0;

  model.traverse((child) => {
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

  scene.add(model);

  // Setup Scale, Ground Positioning, Camera Framing & Grid
  const isKarakterAtlet = displayName.includes('karakter_atlet');
  let box = new THREE.Box3();
  let size = new THREE.Vector3();

  if (isKarakterAtlet) {
    // Hardcoded scale specifically for atlet models
    if (displayName.includes('karakter_atlet2')) {
      // karakter_atlet2.glb has root parent scale 0.01; 100x brings it to exact real-world human scale (1.83m)
      model.scale.set(100, 100, 100);
    } else {
      model.scale.set(1, 1, 1);
    }
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);

    box.setFromObject(model);
    box.getSize(size);

    // Center model at ground level (y=0)
    const center = box.getCenter(new THREE.Vector3());
    model.position.x = -center.x;
    model.position.y = -box.min.y;
    model.position.z = -center.z;
    model.updateMatrixWorld(true);

    // Re-verify bounding box after positioning
    box.setFromObject(model);
    box.getSize(size);

    // Hardcoded camera position & focus target: full body athletic framing
    const targetY = 0.95; // Focus at chest level
    state.defaultTarget.set(0, targetY, 0);
    state.defaultCamPos.set(0.55, 1.25, 2.60); // 3/4 hero view, head-to-toe filled prominently
    state.defaultCamDist = state.defaultCamPos.distanceTo(state.defaultTarget);

    camera.position.copy(state.defaultCamPos);
    controls.target.copy(state.defaultTarget);
    controls.minDistance = 0.4;
    controls.maxDistance = 8.0;
    controls.update();
    updateZoomUI();

    // Proportional, clean 3.5m court grid (does not dwarf the character)
    scene.remove(gridHelper);
    gridHelper = new THREE.GridHelper(3.5, 14, THEMES[state.themeIndex].grid1, THEMES[state.themeIndex].grid2);
    gridHelper.visible = state.gridVisible;
    scene.add(gridHelper);

    logDebug(`Hardcode atlet aktif: skala=${model.scale.x}x, tinggi=${size.y.toFixed(2)}m, camDist=${state.defaultCamDist.toFixed(2)}m`);
  } else {
    // Generic auto-framing for items like raket_tenis.glb
    box.setFromObject(model);
    box.getSize(size);

    const center = box.getCenter(new THREE.Vector3());
    model.position.x += (model.position.x - center.x);
    model.position.y += (model.position.y - box.min.y);
    model.position.z += (model.position.z - center.z);
    model.updateMatrixWorld(true);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let camDistance = (maxDim / 2) / Math.tan(fov / 2);
    camDistance *= 1.4;

    const targetY = size.y * 0.5;
    state.defaultCamDist = camDistance;
    state.defaultTarget.set(0, targetY, 0);
    state.defaultCamPos.set(camDistance * 0.7, targetY + camDistance * 0.3, camDistance * 0.8);

    camera.position.copy(state.defaultCamPos);
    controls.target.copy(state.defaultTarget);
    controls.minDistance = maxDim * 0.1;
    controls.maxDistance = maxDim * 10;
    controls.update();
    updateZoomUI();

    const gridExtent = Math.max(3, Math.ceil(maxDim * 2.5));
    scene.remove(gridHelper);
    gridHelper = new THREE.GridHelper(gridExtent, Math.max(8, gridExtent * 2), THEMES[state.themeIndex].grid1, THEMES[state.themeIndex].grid2);
    gridHelper.visible = state.gridVisible;
    scene.add(gridHelper);
  }

  // Setup Animations
  let activeClips = [];
  if (displayName.includes('karakter_atlet')) {
    // Override animations using the rigged skeleton from tennisMoves.js
    const tennisClips = createTennisAnimationClips(model);
    activeClips = [...tennisClips];

    // Also include original animations for comparison
    if (gltf.animations && gltf.animations.length > 0) {
      gltf.animations.forEach((orig) => {
        const copy = orig.clone();
        copy.displayName = `🏃 ${orig.name || 'Animasi'} (Bawaan)`;
        activeClips.push(copy);
      });
    }
  } else {
    activeClips = gltf.animations || [];
  }

  setupAnimations(activeClips);
  updateSkeletonHelper();

  // Update Model Information Modal
  infoFilename.textContent = displayName;
  infoMeshes.textContent = meshCount.toLocaleString();
  infoTriangles.textContent = Math.round(triangleCount).toLocaleString();
  infoAnimations.textContent = activeClips.length;
  infoSize.textContent = `${size.x.toFixed(2)}m × ${size.y.toFixed(2)}m × ${size.z.toFixed(2)}m`;

  // Hide loading screen smoothly
  setTimeout(() => {
    loadingOverlay.classList.add('fade-out');
    if (displayName.includes('karakter_atlet')) {
      showToast(`${displayName} siap! Gerakan Tenis aktif.`);
    } else {
      showToast(`${displayName} siap ditampilkan!`);
    }
  }, 300);
}

// --- Animation Handler ---
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

function setupAnimations(animations) {
  animClipSelect.innerHTML = '';

  if (!animations || animations.length === 0) {
    animationPanel.classList.add('hidden');
    if (animTimelineSlider) animTimelineSlider.value = 0;
    if (animCurrentTime) animCurrentTime.textContent = '00:00.0';
    if (animTotalDuration) animTotalDuration.textContent = '00:00.0';
    if (animTimelineProgress) animTimelineProgress.style.width = '0%';
    return;
  }

  animationPanel.classList.remove('hidden');
  state.mixer = new THREE.AnimationMixer(state.currentModel);
  state.actions = [];

  animations.forEach((clip, index) => {
    const action = state.mixer.clipAction(clip);
    state.actions.push(action);

    const option = document.createElement('option');
    option.value = index;
    option.textContent = clip.displayName || clip.name || `Animasi ${index + 1}`;
    animClipSelect.appendChild(option);
  });

  // Play first animation by default
  playAnimation(0);
}

// --- Debug Logging & Diagnostics ---
function logDebug(msg) {
  console.log(`[3D Debug] ${msg}`);
  if (debugLogContent) {
    const time = new Date().toLocaleTimeString();
    debugLogContent.textContent = `[${time}] ${msg}\n` + debugLogContent.textContent.slice(0, 1500);
  }
}

// Skeleton Helper
let skeletonHelper = null;
function updateSkeletonHelper() {
  if (!state.currentModel) return;
  if (checkSkeletonHelper && checkSkeletonHelper.checked) {
    if (skeletonHelper) scene.remove(skeletonHelper);
    skeletonHelper = new THREE.SkeletonHelper(state.currentModel);
    skeletonHelper.material.linewidth = 2;
    scene.add(skeletonHelper);
    logDebug('SkeletonHelper diaktifkan (garis tulang terlihat).');
  } else if (skeletonHelper) {
    scene.remove(skeletonHelper);
    skeletonHelper = null;
    logDebug('SkeletonHelper dinonaktifkan.');
  }
}

function playAnimation(index) {
  if (!state.actions[index]) return;

  if (state.activeAction && state.activeAction !== state.actions[index]) {
    state.activeAction.fadeOut(0.3);
  }

  state.activeAction = state.actions[index];
  state.activeAction.reset();
  state.activeAction.fadeIn(0.3);
  state.activeAction.play();
  state.activeAction.timeScale = state.animSpeed;

  state.isPlaying = true;
  updatePlayPauseUI();
  animClipSelect.value = index;

  const clip = state.activeAction.getClip();
  const duration = clip ? clip.duration : 0;

  // Initialize Timeline Scrubber for this clip
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

  // Diagnostic verification
  const displayName = clip.displayName || clip.name;
  if (debugClipName) debugClipName.textContent = displayName;
  if (debugStatus) debugStatus.textContent = 'Memutar (Playing)';
  if (debugTracksCount) debugTracksCount.textContent = `${clip.tracks.length} track`;

  let boundCount = 0;
  const missingNodes = [];

  clip.tracks.forEach((track) => {
    const parsed = THREE.PropertyBinding.parseTrackName(track.name);
    const targetNodeName = parsed.nodeName;
    let found = false;

    state.currentModel.traverse((child) => {
      if (
        child.name === targetNodeName ||
        THREE.PropertyBinding.sanitizeNodeName(child.name) === targetNodeName
      ) {
        found = true;
      }
    });

    if (found) {
      boundCount++;
    } else {
      missingNodes.push(targetNodeName);
    }
  });

  if (missingNodes.length > 0) {
    logDebug(`⚠️ Klip "${displayName}": ${missingNodes.length} track tidak cocok dengan nama tulang: ${missingNodes.slice(0, 3).join(', ')}...`);
    if (debugBindingStatus) {
      debugBindingStatus.innerHTML = `<span style="color:#f59e0b">${boundCount}/${clip.tracks.length} Terhubung</span>`;
    }
  } else {
    logDebug(`✅ Klip "${displayName}": Semua ${boundCount} track terhubung sempurna ke skeleton!`);
    if (debugBindingStatus) {
      debugBindingStatus.innerHTML = `<span style="color:#10b981">${boundCount}/${clip.tracks.length} Terhubung Sempurna ✅</span>`;
    }
  }
}

function updatePlayPauseUI() {
  if (state.isPlaying) {
    iconPause.style.display = 'block';
    iconPlay.style.display = 'none';
    animPlayText.textContent = 'Jeda';
    if (debugStatus) debugStatus.textContent = 'Memutar (Playing)';
  } else {
    iconPause.style.display = 'none';
    iconPlay.style.display = 'block';
    animPlayText.textContent = 'Putar';
    if (debugStatus) debugStatus.textContent = 'Jeda (Paused)';
  }
}

// --- Event Listeners: Model Selection ---
modelPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    const modelName = pill.getAttribute('data-model');
    if (modelName && modelName !== state.activeModelName) {
      loadModel(modelName, modelName);
    }
  });
});

// Custom File Picker
btnCustomFile.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const blobUrl = URL.createObjectURL(file);
    loadModel(blobUrl, file.name, true);
  }
});

// CORS pick file button inside dialog
btnCorsPickFile.addEventListener('click', () => {
  corsModal.classList.add('hidden');
  fileInput.click();
});

btnCloseCors.addEventListener('click', () => {
  corsModal.classList.add('hidden');
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
    if (file.name.match(/\.(glb|gltf)$/i)) {
      const blobUrl = URL.createObjectURL(file);
      loadModel(blobUrl, file.name, true);
    } else {
      showToast('Harap jatuhkan file dengan format .glb atau .gltf');
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
  const speeds = [0.5, 1.0, 1.5, 2.0];
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
    zoomRange.value = Math.min(350, Math.max(30, percent));
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

// Continuous zoom on hold
let zoomHoldInterval = null;

function startZoomHold(factor) {
  zoomStep(factor);
  if (zoomHoldInterval) clearInterval(zoomHoldInterval);
  zoomHoldInterval = setInterval(() => {
    zoomStep(factor);
  }, 75);
}

function stopZoomHold() {
  if (zoomHoldInterval) {
    clearInterval(zoomHoldInterval);
    zoomHoldInterval = null;
  }
}

// Zoom In (+)
btnZoomIn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  startZoomHold(0.82);
});
btnZoomIn.addEventListener('pointerup', stopZoomHold);
btnZoomIn.addEventListener('pointerleave', stopZoomHold);
btnZoomIn.addEventListener('pointercancel', stopZoomHold);

// Zoom Out (-)
btnZoomOut.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  startZoomHold(1.22);
});
btnZoomOut.addEventListener('pointerup', stopZoomHold);
btnZoomOut.addEventListener('pointerleave', stopZoomHold);
btnZoomOut.addEventListener('pointercancel', stopZoomHold);

// Reset Zoom to 100% on badge click
btnZoomReset.addEventListener('click', () => {
  setZoomByPercentage(100);
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
  const gridExtent = gridHelper.geometry.parameters ? gridHelper.geometry.parameters.width : 12;
  gridHelper = new THREE.GridHelper(gridExtent, 24, currentTheme.grid1, currentTheme.grid2);
  gridHelper.visible = state.gridVisible;
  scene.add(gridHelper);

  showToast(`Tema: ${currentTheme.name}`);
});

// --- Fullscreen & Info Modal ---
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
  }
});

btnToggleInfo.addEventListener('click', () => {
  infoModal.classList.toggle('hidden');
  if (debugModal) debugModal.classList.add('hidden');
});

btnCloseInfo.addEventListener('click', () => {
  infoModal.classList.add('hidden');
});

// Debug Modal Listeners
if (btnToggleDebug) {
  btnToggleDebug.addEventListener('click', () => {
    debugModal.classList.toggle('hidden');
    infoModal.classList.add('hidden');
  });
}

if (btnCloseDebug) {
  btnCloseDebug.addEventListener('click', () => {
    debugModal.classList.add('hidden');
  });
}

if (btnSkeleton) {
  btnSkeleton.addEventListener('click', () => {
    if (checkSkeletonHelper) {
      checkSkeletonHelper.checked = !checkSkeletonHelper.checked;
      updateSkeletonHelper();
      btnSkeleton.classList.toggle('active', checkSkeletonHelper.checked);
      showToast(checkSkeletonHelper.checked ? 'Skeleton Ditampilkan' : 'Skeleton Disembunyikan');
    }
  });
}

if (checkSkeletonHelper) {
  checkSkeletonHelper.addEventListener('change', () => {
    updateSkeletonHelper();
    if (btnSkeleton) {
      btnSkeleton.classList.toggle('active', checkSkeletonHelper.checked);
    }
    showToast(checkSkeletonHelper.checked ? 'Skeleton Ditampilkan' : 'Skeleton Disembunyikan');
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (!infoModal.contains(e.target) && !btnToggleInfo.contains(e.target)) {
    infoModal.classList.add('hidden');
  }
  if (debugModal && !debugModal.contains(e.target) && !btnToggleDebug.contains(e.target)) {
    debugModal.classList.add('hidden');
  }
});

// --- Responsive Window Resize & Orientation ---
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

  if (state.mixer) {
    state.mixer.update(delta);
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

animate();

// --- Initial Load ---
loadModel('karakter_atlet2.glb', 'karakter_atlet2.glb');
