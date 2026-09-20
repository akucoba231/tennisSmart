import * as THREE from 'three';

/**
 * Tennis Animations Generator for karakter_atlet.glb (Mixamo Rig)
 * Resolves bones robustly using Three.js PropertyBinding sanitization and normalized matching.
 */

const DEG2RAD = Math.PI / 180;

/**
 * Builds a flexible bone index from the model.
 * Resolves bones whether they are named 'mixamorig:RightArm', 'mixamorigRightArm', or 'RightArm'.
 */
function buildBoneIndex(model) {
  const bonesByName = new Map();
  const bonesByNormalized = new Map();

  // Reset skeleton to rest pose if SkinnedMesh exists
  model.traverse((child) => {
    if (child.isSkinnedMesh && child.skeleton) {
      child.skeleton.pose();
    }
  });

  model.traverse((child) => {
    if (child.isBone) {
      bonesByName.set(child.name, child);

      // Sanitized name (Three.js GLTFLoader convention)
      const sanitized = THREE.PropertyBinding.sanitizeNodeName(child.name);
      bonesByName.set(sanitized, child);

      // Normalized key: strip mixamorig, colons, underscores, lowercase
      const norm = child.name.replace(/mixamorig[:_]?/i, '').replace(/[:_\s]/g, '').toLowerCase();
      bonesByNormalized.set(norm, child);
    }
  });

  return {
    getBone(key) {
      if (bonesByName.has(key)) return bonesByName.get(key);
      const sanitized = THREE.PropertyBinding.sanitizeNodeName(key);
      if (bonesByName.has(sanitized)) return bonesByName.get(sanitized);

      const norm = key.replace(/mixamorig[:_]?/i, '').replace(/[:_\s]/g, '').toLowerCase();
      if (bonesByNormalized.has(norm)) return bonesByNormalized.get(norm);

      return null;
    },
    allBones: Array.from(new Set(bonesByName.values())),
  };
}

/**
 * Helper: Creates a QuaternionKeyframeTrack targeting the sanitized bone name.
 */
function createRelativeQuatTrack(bone, keyframes) {
  if (!bone) return null;

  // Use the exact sanitized name that Three.js PropertyBinding will match in the scene graph
  const trackTargetName = THREE.PropertyBinding.sanitizeNodeName(bone.name);
  const restQuat = bone.quaternion.clone();

  const times = [];
  const values = [];
  const euler = new THREE.Euler();
  const deltaQuat = new THREE.Quaternion();
  const finalQuat = new THREE.Quaternion();

  keyframes.forEach((kf) => {
    times.push(kf.time);
    const rot = kf.rot || [0, 0, 0];
    const order = kf.order || 'XYZ';

    euler.set(rot[0] * DEG2RAD, rot[1] * DEG2RAD, rot[2] * DEG2RAD, order);
    deltaQuat.setFromEuler(euler);

    // Multiply: finalQuat = restQuat * deltaQuat, then normalize
    finalQuat.copy(restQuat).multiply(deltaQuat).normalize();
    values.push(finalQuat.x, finalQuat.y, finalQuat.z, finalQuat.w);
  });

  return new THREE.QuaternionKeyframeTrack(`${trackTargetName}.quaternion`, times, values);
}

/**
 * Helper: Creates a VectorKeyframeTrack for bone position offsets.
 */
function createRelativePosTrack(bone, keyframes) {
  if (!bone) return null;

  const trackTargetName = THREE.PropertyBinding.sanitizeNodeName(bone.name);
  const restPos = bone.position.clone();

  const times = [];
  const values = [];

  keyframes.forEach((kf) => {
    times.push(kf.time);
    const offset = kf.pos || [0, 0, 0];
    values.push(restPos.x + offset[0], restPos.y + offset[1], restPos.z + offset[2]);
  });

  return new THREE.VectorKeyframeTrack(`${trackTargetName}.position`, times, values);
}

/**
 * Main Function: Builds all tennis motion clips for the model.
 * @param {THREE.Object3D} model - The loaded karakter_atlet model.
 * @returns {Array<THREE.AnimationClip>}
 */
export function createTennisAnimationClips(model) {
  console.group('[3D Debug] Generating Tennis Animation Clips');
  const boneIndex = buildBoneIndex(model);
  console.log(`[3D Debug] Detected ${boneIndex.allBones.length} bones in model:`, boneIndex.allBones.map(b => b.name));

  // Bone lookup helper
  const b = (name) => {
    const bone = boneIndex.getBone(name);
    if (!bone) {
      console.warn(`[3D Debug] Bone '${name}' not found in skeleton!`);
    }
    return bone;
  };

  // Cache resolved bones
  const hips = b('Hips');
  const spine = b('Spine');
  const spine1 = b('Spine1');
  const rightArm = b('RightArm');
  const rightForeArm = b('RightForeArm');
  const rightHand = b('RightHand');
  const leftArm = b('LeftArm');
  const leftForeArm = b('LeftForeArm');
  const leftHand = b('LeftHand');
  const rightUpLeg = b('RightUpLeg');
  const rightLeg = b('RightLeg');
  const leftUpLeg = b('LeftUpLeg');
  const leftLeg = b('LeftLeg');

  const addTrack = (tracks, track) => {
    if (track) tracks.push(track);
  };

  const clips = [];

  // =========================================================================
  // 1. IDLE (Ready Stance)
  // =========================================================================
  {
    const duration = 2.0;
    const tracks = [];

    // Hips vertical subtle athletic bounce
    addTrack(tracks, createRelativePosTrack(hips, [
      { time: 0.0, pos: [0, -0.07, 0] },
      { time: 1.0, pos: [0, -0.04, 0] },
      { time: 2.0, pos: [0, -0.07, 0] },
    ]));

    // Spine lean forward slightly
    addTrack(tracks, createRelativeQuatTrack(spine, [
      { time: 0.0, rot: [12, 0, 0] },
      { time: 1.0, rot: [8, 0, 0] },
      { time: 2.0, rot: [12, 0, 0] },
    ]));

    // Right Arm: Lowered from T-pose to side and brought forward to chest
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [55, 12, -22] },
      { time: 1.0, rot: [52, 10, -20] },
      { time: 2.0, rot: [55, 12, -22] },
    ]));

    // Right ForeArm: Bends elbow forward (Negative Z in Mixamo rig)
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 0, -85] },
      { time: 1.0, rot: [0, 0, -80] },
      { time: 2.0, rot: [0, 0, -85] },
    ]));

    // Left Arm: Lowered from T-pose and brought forward to support racket throat
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [50, -12, 28] },
      { time: 1.0, rot: [48, -10, 26] },
      { time: 2.0, rot: [50, -12, 28] },
    ]));

    // Left ForeArm: Bends elbow forward toward racket (Positive Z in Mixamo rig)
    addTrack(tracks, createRelativeQuatTrack(leftForeArm, [
      { time: 0.0, rot: [0, 0, 85] },
      { time: 1.0, rot: [0, 0, 80] },
      { time: 2.0, rot: [0, 0, 85] },
    ]));

    // Athletic leg stance: opened shoulder-width apart + knees flexed
    addTrack(tracks, createRelativeQuatTrack(rightUpLeg, [
      { time: 0.0, rot: [-16, 0, -12] },
      { time: 1.0, rot: [-10, 0, -12] },
      { time: 2.0, rot: [-16, 0, -12] },
    ]));
    addTrack(tracks, createRelativeQuatTrack(rightLeg, [
      { time: 0.0, rot: [26, 0, 0] },
      { time: 1.0, rot: [18, 0, 0] },
      { time: 2.0, rot: [26, 0, 0] },
    ]));

    addTrack(tracks, createRelativeQuatTrack(leftUpLeg, [
      { time: 0.0, rot: [-16, 0, 12] },
      { time: 1.0, rot: [-10, 0, 12] },
      { time: 2.0, rot: [-16, 0, 12] },
    ]));
    addTrack(tracks, createRelativeQuatTrack(leftLeg, [
      { time: 0.0, rot: [26, 0, 0] },
      { time: 1.0, rot: [18, 0, 0] },
      { time: 2.0, rot: [26, 0, 0] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Idle', duration, tracks);
    clip.displayName = '🎾 Stance Ready (Idle)';
    clips.push(clip);
  }

  // =========================================================================
  // 2. FOREHAND (Full Swing Cycle)
  // =========================================================================
  {
    const duration = 1.8;
    const tracks = [];

    // Hips rotation
    addTrack(tracks, createRelativeQuatTrack(hips, [
      { time: 0.0, rot: [0, 0, 0] },
      { time: 0.45, rot: [0, 45, 0] },
      { time: 0.85, rot: [0, 10, 0] },
      { time: 1.15, rot: [0, -35, 0] },
      { time: 1.8, rot: [0, 0, 0] },
    ]));

    // Spine coiling
    addTrack(tracks, createRelativeQuatTrack(spine1, [
      { time: 0.0, rot: [10, 0, 0] },
      { time: 0.45, rot: [5, 30, 0] },
      { time: 0.85, rot: [15, -10, 0] },
      { time: 1.15, rot: [10, -30, 0] },
      { time: 1.8, rot: [10, 0, 0] },
    ]));

    // Right Arm swing
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [-25, 20, -35] },
      { time: 0.45, rot: [15, 60, -20] },
      { time: 0.75, rot: [-20, 30, -50] },
      { time: 0.95, rot: [-50, -10, -70] },
      { time: 1.25, rot: [-65, -55, -80] },
      { time: 1.8, rot: [-25, 20, -35] },
    ]));

    // Right ForeArm snap
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 80, 0] },
      { time: 0.45, rot: [0, 45, 0] },
      { time: 0.75, rot: [0, 75, 0] },
      { time: 0.95, rot: [0, 95, 0] },
      { time: 1.25, rot: [0, 115, 0] },
      { time: 1.8, rot: [0, 80, 0] },
    ]));

    // Left Arm balance
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [-25, -20, 35] },
      { time: 0.45, rot: [-10, -50, 45] },
      { time: 0.9, rot: [-15, -15, 25] },
      { time: 1.25, rot: [-20, 30, 20] },
      { time: 1.8, rot: [-25, -20, 35] },
    ]));

    // Right Leg pivot
    addTrack(tracks, createRelativeQuatTrack(rightUpLeg, [
      { time: 0.0, rot: [-15, 5, -8] },
      { time: 0.45, rot: [-25, 20, -10] },
      { time: 0.95, rot: [-10, 0, -5] },
      { time: 1.25, rot: [5, -15, -5] },
      { time: 1.8, rot: [-15, 5, -8] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Forehand', duration, tracks);
    clip.displayName = '🎾 Forehand Drive';
    clips.push(clip);
  }

  // =========================================================================
  // 3. BACKHAND (Drive)
  // =========================================================================
  {
    const duration = 1.8;
    const tracks = [];

    // Hips coiling left
    addTrack(tracks, createRelativeQuatTrack(hips, [
      { time: 0.0, rot: [0, 0, 0] },
      { time: 0.45, rot: [0, -50, 0] },
      { time: 0.85, rot: [0, -10, 0] },
      { time: 1.15, rot: [0, 40, 0] },
      { time: 1.8, rot: [0, 0, 0] },
    ]));

    // Spine
    addTrack(tracks, createRelativeQuatTrack(spine1, [
      { time: 0.0, rot: [10, 0, 0] },
      { time: 0.45, rot: [5, -35, 0] },
      { time: 0.85, rot: [12, 10, 0] },
      { time: 1.15, rot: [8, 35, 0] },
      { time: 1.8, rot: [10, 0, 0] },
    ]));

    // Right Arm cross-body
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [-25, 20, -35] },
      { time: 0.45, rot: [10, -50, -30] },
      { time: 0.85, rot: [-35, -20, -45] },
      { time: 1.15, rot: [-60, 40, -55] },
      { time: 1.8, rot: [-25, 20, -35] },
    ]));

    // Right ForeArm
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 80, 0] },
      { time: 0.45, rot: [0, 90, 0] },
      { time: 0.85, rot: [0, 60, 0] },
      { time: 1.15, rot: [0, 105, 0] },
      { time: 1.8, rot: [0, 80, 0] },
    ]));

    // Left Arm supporting
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [-25, -20, 35] },
      { time: 0.45, rot: [-10, -65, 45] },
      { time: 0.85, rot: [-35, -30, 35] },
      { time: 1.15, rot: [-55, 30, 30] },
      { time: 1.8, rot: [-25, -20, 35] },
    ]));

    addTrack(tracks, createRelativeQuatTrack(leftForeArm, [
      { time: 0.0, rot: [0, -85, 0] },
      { time: 0.45, rot: [0, -95, 0] },
      { time: 0.85, rot: [0, -75, 0] },
      { time: 1.15, rot: [0, -110, 0] },
      { time: 1.8, rot: [0, -85, 0] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Backhand', duration, tracks);
    clip.displayName = '🎾 Backhand Drive';
    clips.push(clip);
  }

  // =========================================================================
  // 4. SERVICE (Trophy Pose -> Apex Contact -> Follow-Through)
  // =========================================================================
  {
    const duration = 2.4;
    const tracks = [];

    // Hips elevation
    addTrack(tracks, createRelativePosTrack(hips, [
      { time: 0.0, pos: [0, -0.05, 0] },
      { time: 0.6, pos: [0, -0.15, 0] },
      { time: 1.15, pos: [0, 0.15, 0] },
      { time: 1.6, pos: [0, -0.08, 0] },
      { time: 2.4, pos: [0, -0.05, 0] },
    ]));

    // Spine
    addTrack(tracks, createRelativeQuatTrack(spine1, [
      { time: 0.0, rot: [10, 0, 0] },
      { time: 0.6, rot: [-18, 20, 0] },
      { time: 1.15, rot: [5, 5, 0] },
      { time: 1.5, rot: [30, -15, 0] },
      { time: 2.4, rot: [10, 0, 0] },
    ]));

    // Left Arm (Ball Toss high into the air)
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [-25, -20, 35] },
      { time: 0.6, rot: [-150, -10, 30] },
      { time: 1.0, rot: [-130, -5, 20] },
      { time: 1.4, rot: [-10, 0, 15] },
      { time: 2.4, rot: [-25, -20, 35] },
    ]));

    // Right Arm (Trophy Pose -> Apex Smash -> Follow-through)
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [-25, 20, -35] },
      { time: 0.6, rot: [-70, 70, -30] },
      { time: 0.9, rot: [-40, 85, -20] },
      { time: 1.15, rot: [-160, 15, -15] },
      { time: 1.5, rot: [-40, -45, -70] },
      { time: 2.4, rot: [-25, 20, -35] },
    ]));

    // Right ForeArm
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 80, 0] },
      { time: 0.6, rot: [0, 95, 0] },
      { time: 0.9, rot: [0, 125, 0] },
      { time: 1.15, rot: [0, 15, 0] },
      { time: 1.5, rot: [0, 100, 0] },
      { time: 2.4, rot: [0, 80, 0] },
    ]));

    // Leg drive
    addTrack(tracks, createRelativeQuatTrack(rightLeg, [
      { time: 0.0, rot: [20, 0, 0] },
      { time: 0.6, rot: [60, 0, 0] },
      { time: 1.15, rot: [5, 0, 0] },
      { time: 1.6, rot: [35, 0, 0] },
      { time: 2.4, rot: [20, 0, 0] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Service', duration, tracks);
    clip.displayName = '🎾 Service (Serve)';
    clips.push(clip);
  }

  // =========================================================================
  // 5. VOLLEY FOREHAND (Quick Punch at Net)
  // =========================================================================
  {
    const duration = 1.2;
    const tracks = [];

    // Hips
    addTrack(tracks, createRelativeQuatTrack(hips, [
      { time: 0.0, rot: [0, 0, 0] },
      { time: 0.25, rot: [0, 20, 0] },
      { time: 0.5, rot: [0, -10, 0] },
      { time: 1.2, rot: [0, 0, 0] },
    ]));

    // Right Arm
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [-25, 20, -35] },
      { time: 0.25, rot: [-45, 35, -40] },
      { time: 0.5, rot: [-65, 0, -60] },
      { time: 0.8, rot: [-60, -5, -55] },
      { time: 1.2, rot: [-25, 20, -35] },
    ]));

    // Right ForeArm
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 80, 0] },
      { time: 0.25, rot: [0, 95, 0] },
      { time: 0.5, rot: [0, 75, 0] },
      { time: 0.8, rot: [0, 80, 0] },
      { time: 1.2, rot: [0, 80, 0] },
    ]));

    // Left Arm
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [-25, -20, 35] },
      { time: 0.35, rot: [-10, -40, 45] },
      { time: 0.8, rot: [-15, -25, 30] },
      { time: 1.2, rot: [-25, -20, 35] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Volley_Forehand', duration, tracks);
    clip.displayName = '🎾 Volley Forehand';
    clips.push(clip);
  }

  // =========================================================================
  // 6. VOLLEY BACKHAND (Quick Block at Net)
  // =========================================================================
  {
    const duration = 1.2;
    const tracks = [];

    // Hips
    addTrack(tracks, createRelativeQuatTrack(hips, [
      { time: 0.0, rot: [0, 0, 0] },
      { time: 0.25, rot: [0, -25, 0] },
      { time: 0.5, rot: [0, 15, 0] },
      { time: 1.2, rot: [0, 0, 0] },
    ]));

    // Right Arm
    addTrack(tracks, createRelativeQuatTrack(rightArm, [
      { time: 0.0, rot: [-25, 20, -35] },
      { time: 0.25, rot: [-40, -30, -35] },
      { time: 0.5, rot: [-55, 15, -45] },
      { time: 0.8, rot: [-50, 20, -40] },
      { time: 1.2, rot: [-25, 20, -35] },
    ]));

    // Right ForeArm
    addTrack(tracks, createRelativeQuatTrack(rightForeArm, [
      { time: 0.0, rot: [0, 80, 0] },
      { time: 0.25, rot: [0, 95, 0] },
      { time: 0.5, rot: [0, 70, 0] },
      { time: 0.8, rot: [0, 75, 0] },
      { time: 1.2, rot: [0, 80, 0] },
    ]));

    // Left Arm
    addTrack(tracks, createRelativeQuatTrack(leftArm, [
      { time: 0.0, rot: [-25, -20, 35] },
      { time: 0.25, rot: [-35, -45, 30] },
      { time: 0.5, rot: [10, -25, 45] },
      { time: 1.2, rot: [-25, -20, 35] },
    ]));

    const clip = new THREE.AnimationClip('Tennis_Volley_Backhand', duration, tracks);
    clip.displayName = '🎾 Volley Backhand';
    clips.push(clip);
  }

  console.log(`[3D Debug] Created ${clips.length} procedural tennis clips successfully:`, clips.map(c => ({
    name: c.name,
    displayName: c.displayName,
    tracksCount: c.tracks.length,
    sampleTrack: c.tracks[0]?.name
  })));
  console.groupEnd();

  return clips;
}
