import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createShieldShape(scale: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.38 * scale);
  shape.lineTo(1.06 * scale, 0.96 * scale);
  shape.lineTo(0.92 * scale, -0.26 * scale);
  shape.quadraticCurveTo(0.68 * scale, -1.04 * scale, 0, -1.48 * scale);
  shape.quadraticCurveTo(-0.68 * scale, -1.04 * scale, -0.92 * scale, -0.26 * scale);
  shape.lineTo(-1.06 * scale, 0.96 * scale);
  shape.closePath();
  return shape;
}

export function QuantumShield3DCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 300;
    renderer.setSize(width, height, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070e, 0.048);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 7.6);

    // 3-point lighting with warm/cool contrast
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x7c3aed, 6.5, 18);
    rimLight.position.set(-4.2, -1.8, 3.4);
    scene.add(rimLight);

    const cyanAccentLight = new THREE.PointLight(0x00ffff, 5.5, 16);
    cyanAccentLight.position.set(3.8, 1.6, 3.2);
    scene.add(cyanAccentLight);

    // Composite 3D Holographic Shield Group (multi-part procedural geometry)
    const shieldGroup = new THREE.Group();
    scene.add(shieldGroup);

    const disposables: Array<{ dispose: () => void }> = [];

    // Part 1: Outer beveled metallic frame (extruded shield contour minus inner cutout)
    const outerShape = createShieldShape(1.0);
    const innerHole = createShieldShape(0.84);
    outerShape.holes.push(innerHole);

    const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    frameGeo.center();
    const frameMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      emissive: 0x082f49,
      emissiveIntensity: 0.65,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    shieldGroup.add(frameMesh);
    disposables.push(frameGeo, frameMat);

    // Part 2: Inner holographic crystal pane
    const corePlateShape = createShieldShape(0.82);
    const corePlateGeo = new THREE.ExtrudeGeometry(corePlateShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
    });
    corePlateGeo.center();
    const corePlateMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x00ffff,
      emissiveIntensity: 0.22,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 0.42,
      depthWrite: false,
    });
    const corePlateMesh = new THREE.Mesh(corePlateGeo, corePlateMat);
    corePlateMesh.renderOrder = 2;
    shieldGroup.add(corePlateMesh);
    disposables.push(corePlateGeo, corePlateMat);

    // Part 3: Central Quantum Core Octahedron + Wireframe Shell
    const coreGeo = new THREE.OctahedronGeometry(0.46, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x2d7ff9,
      emissiveIntensity: 0.9,
      metalness: 0.65,
      roughness: 0.18,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.z = 0.08;
    shieldGroup.add(coreMesh);
    disposables.push(coreGeo, coreMat);

    const cageGeo = new THREE.IcosahedronGeometry(0.68, 1);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.55,
    });
    const cageLines = new THREE.LineSegments(cageEdges, cageMat);
    cageLines.position.z = 0.08;
    shieldGroup.add(cageLines);
    disposables.push(cageGeo, cageEdges, cageMat);

    // Part 4-6: Three concentric orbital gyro rings
    const ringConfigs = [
      { radius: 1.75, tube: 0.022, color: 0x00ffff, tiltX: 0.48, tiltY: 0.2 },
      { radius: 2.15, tube: 0.018, color: 0x2d7ff9, tiltX: -0.58, tiltY: -0.42 },
      { radius: 2.55, tube: 0.016, color: 0x7c3aed, tiltX: 0.28, tiltY: 0.68 },
    ];
    const gyroRings: THREE.Mesh[] = [];
    ringConfigs.forEach((cfg) => {
      const rGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 12, 72);
      const rMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.75,
        metalness: 0.75,
        roughness: 0.25,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.set(cfg.tiltX, cfg.tiltY, 0);
      shieldGroup.add(rMesh);
      gyroRings.push(rMesh);
      disposables.push(rGeo, rMat);
    });

    // Quantum nodes (InstancedMesh) + connecting lattice lines
    const NODE_COUNT = 32;
    const nodeGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x2d7ff9,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.2,
    });
    const nodeInstances = new THREE.InstancedMesh(nodeGeo, nodeMat, NODE_COUNT);
    const nodePositions: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 2.85 + (i % 3) * 0.35;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.82;
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.72;
      nodePositions.push(new THREE.Vector3(x, y, z));

      dummy.position.set(x, y, z);
      const s = 0.75 + (i % 4) * 0.16;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      nodeInstances.setMatrixAt(i, dummy.matrix);

      if (i % 3 === 0) tmpColor.setHex(0x00ffff);
      else if (i % 3 === 1) tmpColor.setHex(0x2d7ff9);
      else tmpColor.setHex(0x7c3aed);
      nodeInstances.setColorAt(i, tmpColor);
    }
    nodeInstances.instanceMatrix.needsUpdate = true;
    if (nodeInstances.instanceColor) nodeInstances.instanceColor.needsUpdate = true;
    nodeInstances.computeBoundingSphere();
    shieldGroup.add(nodeInstances);
    disposables.push(nodeGeo, nodeMat);

    // Connecting lines between nearby quantum nodes
    const lineCoords: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 2.25) {
          lineCoords.push(
            nodePositions[i].x,
            nodePositions[i].y,
            nodePositions[i].z,
            nodePositions[j].x,
            nodePositions[j].y,
            nodePositions[j].z
          );
        }
      }
    }
    const netGeo = new THREE.BufferGeometry();
    netGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const netMat = new THREE.LineBasicMaterial({
      color: 0x2d7ff9,
      transparent: true,
      opacity: 0.28,
    });
    const netLines = new THREE.LineSegments(netGeo, netMat);
    shieldGroup.add(netLines);
    disposables.push(netGeo, netMat);

    // Ambient quantum particle starfield
    const PARTICLE_COUNT = 160;
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);
    const palette = [new THREE.Color(0x00ffff), new THREE.Color(0x2d7ff9), new THREE.Color(0x7c3aed)];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      pPositions[idx] = (Math.random() - 0.5) * 14;
      pPositions[idx + 1] = (Math.random() - 0.5) * 9;
      pPositions[idx + 2] = (Math.random() - 0.5) * 8 - 1.5;
      const c = palette[i % palette.length];
      pColors[idx] = c.r;
      pColors[idx + 1] = c.g;
      pColors[idx + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    disposables.push(particleGeo, particleMat);

    // Subtle pointer parallax without React re-renders
    let targetPointerX = 0;
    let targetPointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetPointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.42;
      targetPointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.28;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      const nextW = container.clientWidth || 340;
      const nextH = container.clientHeight || 300;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH, false);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let disposed = false;
    let contextLost = false;
    const startMs = performance.now();
    let prevMs = startMs;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      setWebglFailed(true);
    };
    const handleContextRestored = () => {
      contextLost = false;
      setWebglFailed(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const renderSceneFrame = () => {
      if (disposed || contextLost) return;
      const nowMs = performance.now();
      const delta = Math.min((nowMs - prevMs) / 1000, 0.1);
      prevMs = nowMs;
      const elapsed = (nowMs - startMs) / 1000;

      if (!prefersReduced) {
        shieldGroup.rotation.y = THREE.MathUtils.damp(
          shieldGroup.rotation.y,
          Math.sin(elapsed * 0.35) * 0.28 + targetPointerX,
          3.5,
          delta
        );
        shieldGroup.rotation.x = THREE.MathUtils.damp(
          shieldGroup.rotation.x,
          Math.cos(elapsed * 0.28) * 0.1 + targetPointerY,
          3.5,
          delta
        );
        shieldGroup.position.y = Math.sin(elapsed * 0.9) * 0.12;

        coreMesh.rotation.y += delta * 0.85;
        coreMesh.rotation.x += delta * 0.45;
        cageLines.rotation.y -= delta * 0.38;

        gyroRings[0].rotation.z += delta * 0.34;
        gyroRings[1].rotation.z -= delta * 0.27;
        gyroRings[2].rotation.x += delta * 0.22;

        particles.rotation.y = elapsed * 0.04;
      }

      renderer.render(scene, camera);

      if (!prefersReduced) {
        if (isSoftwareGl) {
          afterDraw(renderSceneFrame);
        } else {
          frameId = requestAnimationFrame(renderSceneFrame);
        }
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    renderSceneFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      disposables.forEach((item) => item.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        data-testid="quantum-shield-fallback"
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#05070E] via-[#0B142B] to-[#05070E]"
      >
        <svg viewBox="0 0 200 200" className="h-56 w-56 opacity-80" aria-hidden="true">
          <circle cx="100" cy="100" r="82" fill="none" stroke="#2D7FF9" strokeWidth="1.2" strokeDasharray="6 6" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#00FFFF" strokeWidth="1.5" />
          <path
            d="M100 32 L152 54 L144 114 C138 144 120 164 100 174 C80 164 62 144 56 114 L48 54 Z"
            fill="rgba(6, 182, 212, 0.14)"
            stroke="#00FFFF"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="quantum-shield-canvas"
      aria-label="Interactive 3D holographic quantum security shield and particle network"
      className="h-full w-full min-w-0 overflow-hidden"
    />
  );
}
