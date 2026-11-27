import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeNetworkEdges, generateOrbNodes } from '../utils/quantumOrbNetwork';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

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

export function QuantumBackgroundEffects() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

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
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;

    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;
    renderer.setSize(width, height, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070e, 0.055);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 80);
    camera.position.set(0, 0, 9.2);

    const hemiLight = new THREE.HemisphereLight(0x00ffff, 0x0f172a, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xbae6fd, 1.4);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    const violetRim = new THREE.PointLight(0x7c3aed, 4.2, 22);
    violetRim.position.set(-5.5, -2.5, 2.5);
    scene.add(violetRim);

    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    const nodes = generateOrbNodes(28);
    const edges = computeNetworkEdges(nodes, 3.8, 3);

    const disposables: Array<{ dispose: () => void }> = [];

    // Core floating orbs
    const orbGeo = new THREE.SphereGeometry(1, 18, 18);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x0a2540,
      emissiveIntensity: 0.55,
      metalness: 0.35,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.65,
    });
    const orbMesh = new THREE.InstancedMesh(orbGeo, orbMat, nodes.length);

    // Subtle outer glow halos around each orb
    const haloGeo = new THREE.SphereGeometry(1, 14, 14);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
    });
    const haloMesh = new THREE.InstancedMesh(haloGeo, haloMat, nodes.length);

    nodes.forEach((node, idx) => {
      _dummy.position.set(node.x, node.y, node.z);
      _dummy.scale.setScalar(node.radius);
      _dummy.updateMatrix();
      orbMesh.setMatrixAt(idx, _dummy.matrix);

      _dummy.scale.setScalar(node.radius * 2.15);
      _dummy.updateMatrix();
      haloMesh.setMatrixAt(idx, _dummy.matrix);

      _color.setHex(node.colorHex);
      orbMesh.setColorAt(idx, _color);
      haloMesh.setColorAt(idx, _color);
    });

    orbMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;
    if (orbMesh.instanceColor) orbMesh.instanceColor.needsUpdate = true;
    if (haloMesh.instanceColor) haloMesh.instanceColor.needsUpdate = true;
    orbMesh.computeBoundingSphere();
    haloMesh.computeBoundingSphere();

    networkGroup.add(orbMesh);
    networkGroup.add(haloMesh);
    disposables.push(orbGeo, orbMat, haloGeo, haloMat);

    // Connecting orb network filaments
    const lineCoords = new Float32Array(edges.length * 6);
    edges.forEach((edge, idx) => {
      const a = nodes[edge.fromIndex];
      const b = nodes[edge.toIndex];
      const offset = idx * 6;
      lineCoords[offset] = a.x;
      lineCoords[offset + 1] = a.y;
      lineCoords[offset + 2] = a.z;
      lineCoords[offset + 3] = b.x;
      lineCoords[offset + 4] = b.y;
      lineCoords[offset + 5] = b.z;
    });

    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(lineCoords, 3);
    lineGeo.setAttribute('position', linePosAttr);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2d7ff9,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    networkGroup.add(lineSegments);
    disposables.push(lineGeo, lineMat);

    const handleResize = () => {
      const nextW = container.clientWidth || 1280;
      const nextH = container.clientHeight || 720;
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

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      setWebglUnavailable(true);
    };
    const handleContextRestored = () => {
      contextLost = false;
      setWebglUnavailable(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 90);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 90);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const renderLoop = () => {
      if (disposed || contextLost) return;
      const elapsed = (performance.now() - startMs) / 1000;

      if (!prefersReduced) {
        networkGroup.rotation.y = elapsed * 0.045;
        networkGroup.rotation.x = Math.sin(elapsed * 0.14) * 0.055;

        // Subtle individual orb float + edge sync
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const floatY = n.y + Math.sin(elapsed * 0.55 + n.phase) * 0.12;
          _dummy.position.set(n.x, floatY, n.z);
          _dummy.scale.setScalar(n.radius);
          _dummy.updateMatrix();
          orbMesh.setMatrixAt(i, _dummy.matrix);

          _dummy.scale.setScalar(n.radius * 2.15);
          _dummy.updateMatrix();
          haloMesh.setMatrixAt(i, _dummy.matrix);
        }
        orbMesh.instanceMatrix.needsUpdate = true;
        haloMesh.instanceMatrix.needsUpdate = true;

        for (let eIdx = 0; eIdx < edges.length; eIdx++) {
          const edge = edges[eIdx];
          const a = nodes[edge.fromIndex];
          const b = nodes[edge.toIndex];
          const offset = eIdx * 6;
          lineCoords[offset + 1] = a.y + Math.sin(elapsed * 0.55 + a.phase) * 0.12;
          lineCoords[offset + 4] = b.y + Math.sin(elapsed * 0.55 + b.phase) * 0.12;
        }
        linePosAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (!prefersReduced) {
        if (isSoftwareGl) {
          afterDraw(renderLoop);
        } else {
          frameId = requestAnimationFrame(renderLoop);
        }
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    renderLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      disposables.forEach((d) => d.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnavailable) {
    return null;
  }

  return (
    <div
      ref={mountRef}
      data-testid="quantum-background-effects"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-85"
    />
  );
}
