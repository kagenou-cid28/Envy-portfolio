/* ===== THREE.JS SCENE ===== */
(function() {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  let scene, camera, renderer;
  let particles, orb, shards = [];
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let scrollProgress = 0;
  let animationId = null;
  let isReduced = false;

  // Check reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  isReduced = mq.matches;

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050507);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      sizes[i] = 0.3 + Math.random() * 0.9;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Central orb with custom shader
    const orbGeo = new THREE.SphereGeometry(2, 64, 64);
    const orbMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
          rim = smoothstep(0.4, 1.0, rim);

          vec3 innerColor = vec3(0.02, 0.008, 0.04);
          vec3 rimColor = vec3(0.42, 0.25, 0.80);
          vec3 glowColor = vec3(0.60, 0.37, 1.0);

          float pulse = 0.85 + 0.15 * sin(uTime * 0.5);

          vec3 color = mix(innerColor, rimColor, rim);
          color = mix(color, glowColor, rim * 0.5);
          color *= pulse;

          float alpha = 0.6 + 0.4 * rim;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    orb = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orb);

    // Glow aura (larger transparent sphere)
    const auraGeo = new THREE.SphereGeometry(2.6, 32, 32);
    const auraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
          rim = smoothstep(0.3, 0.9, rim);

          float pulse = 0.8 + 0.2 * sin(uTime * 0.3 + 1.0);
          float alpha = rim * 0.12 * pulse;
          vec3 color = vec3(0.50, 0.30, 0.85);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    orb.add(aura);

    // Floating shards
    const shardColors = [0x6c3fc8, 0x9b5de5, 0x7c4dd4, 0x8b5cf6];
    for (let i = 0; i < 7; i++) {
      const geo = i % 2 === 0
        ? new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.4, 0)
        : new THREE.OctahedronGeometry(0.6 + Math.random() * 0.4, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: shardColors[i % shardColors.length],
        wireframe: true,
        transparent: true,
        opacity: 0.15 + Math.random() * 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / 7) * Math.PI * 2;
      const radius = 3.5 + Math.random() * 2;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3 - 1
      );
      mesh.userData = {
        rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.005 },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.3,
        floatAmp: 0.2 + Math.random() * 0.3,
        origY: mesh.position.y,
      };
      scene.add(mesh);
      shards.push(mesh);
    }

    // Events
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);

    if (!isReduced) {
      animate();
    }

    // Show canvas after init
    requestAnimationFrame(() => {
      canvas.classList.add('visible');
    });
  }

  function animate() {
    if (isReduced) return;
    animationId = requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // Update orb shader
    if (orb.material.uniforms) {
      orb.material.uniforms.uTime.value = time;
    }

    // Orb slow rotation
    orb.rotation.x += 0.001;
    orb.rotation.y += 0.002;

    // Scroll scaling
    const scale = 1 + scrollProgress * 1.5;
    orb.scale.set(scale, scale, scale);

    // Particles slow drift
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.sin(time * 0.05 + pos[i] * 0.1) * 0.0003;
      if (pos[i + 1] > 10) pos[i + 1] = -10;
      if (pos[i + 1] < -10) pos[i + 1] = 10;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Shards rotation and float
    shards.forEach((shard) => {
      shard.rotation.x += shard.userData.rotSpeed.x;
      shard.rotation.y += shard.userData.rotSpeed.y;
      shard.rotation.z += shard.userData.rotSpeed.z;
      shard.position.y = shard.userData.origY + Math.sin(time * shard.userData.floatSpeed + shard.userData.floatOffset) * shard.userData.floatAmp;
    });

    // Mouse parallax (lerp)
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;
    camera.position.x = targetX * 0.05;
    camera.position.y = targetY * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  // Expose scroll progress updater
  window.__updateScrollProgress = function(progress) {
    scrollProgress = Math.min(Math.max(progress, 0), 1);
  };

  // Handle reduced motion changes
  mq.addEventListener('change', (e) => {
    isReduced = e.matches;
    if (isReduced && animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (!isReduced && !animationId) {
      animate();
    }
  });

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
