/**
 * Modular HUD View Cube Component
 * Creates a 2D HUD view cube overlay, fully synced with A-Frame camera.
 * Usage: Just import this script after A-Frame in your HTML.
 */
(function() {
  // Wait for A-Frame scene and camera to be ready
  function onAFrameReady(cb) {
    const scene = document.querySelector('a-scene');
    if (!scene || !scene.hasLoaded) {
      setTimeout(() => onAFrameReady(cb), 100);
      return;
    }
    const aframeCam = document.querySelector('[camera]');
    if (!aframeCam || !aframeCam.object3D) {
      setTimeout(() => onAFrameReady(cb), 100);
      return;
    }
    cb();
  }

  // Create HUD container if not present
  function ensureHUDContainer() {
    let container = document.getElementById('viewcube-hud');
    if (!container) {
      container = document.createElement('div');
      container.id = 'viewcube-hud';
      container.style.position = 'fixed';
      container.style.right = '24px';
      container.style.bottom = '24px';
      container.style.width = '96px';
      container.style.height = '96px';
      container.style.zIndex = '1000';
      container.style.background = 'none';
      container.style.pointerEvents = 'auto';
      document.body.appendChild(container);
    }
    return container;
  }

  onAFrameReady(function() {
    const THREE = window.THREE;
    const container = ensureHUDContainer();
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 10);
    camera.position.set(0, 0, 3);

    // Cube with colored faces
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xff6666 }), // right
      new THREE.MeshBasicMaterial({ color: 0x66ff66 }), // left
      new THREE.MeshBasicMaterial({ color: 0xff66ff }), // top
      new THREE.MeshBasicMaterial({ color: 0x66ffff }), // bottom
      new THREE.MeshBasicMaterial({ color: 0x6699ff }), // front
      new THREE.MeshBasicMaterial({ color: 0xffff66 })  // back
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    // Face labels
    const faceLabels = ['R', 'L', 'T', 'B', 'F', 'B'];
    const labelDivs = [];
    for (let i = 0; i < 6; i++) {
      const div = document.createElement('div');
      div.textContent = faceLabels[i];
      div.style.position = 'absolute';
      div.style.color = '#222';
      div.style.fontWeight = 'bold';
      div.style.fontSize = '18px';
      div.style.pointerEvents = 'none';
      div.style.textShadow = '0 0 4px #fff, 0 0 2px #fff';
      container.appendChild(div);
      labelDivs.push(div);
    }

    // --- Sync with A-Frame camera ---
    function getMainCameraQuaternion() {
      const aframeCam = document.querySelector('[camera]');
      if (!aframeCam || !aframeCam.object3D) return null;
      return aframeCam.object3D.quaternion;
    }

    // --- Drag interaction ---
    let isDragging = false, lastX = 0, lastY = 0, cubeQuat = new THREE.Quaternion();
    renderer.domElement.addEventListener('mousedown', e => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = (e.clientX - lastX) / width * Math.PI;
      const dy = (e.clientY - lastY) / height * Math.PI;
      lastX = e.clientX;
      lastY = e.clientY;
      // Rotate cube
      const qx = new THREE.Quaternion();
      const qy = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -dx);
      qy.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -dy);
      cube.quaternion.multiplyQuaternions(qx, cube.quaternion);
      cube.quaternion.multiplyQuaternions(cube.quaternion, qy);
      cubeQuat.copy(cube.quaternion);
      // Update A-Frame camera
      syncCubeToAFrame();
    });
    window.addEventListener('mouseup', () => { isDragging = false; });

    // --- Face click interaction ---
    renderer.domElement.addEventListener('click', function(e) {
      // Raycast to find face
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -((e.clientY - rect.top) / height) * 2 + 1;
      const mouse = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(cube);
      if (intersects.length > 0) {
        const faceIndex = Math.floor(intersects[0].faceIndex / 2);
        // Snap camera to face
        snapAFrameCameraToFace(faceIndex);
      }
    });

    // --- Sync cube orientation with A-Frame camera ---
    function syncAFrameToCube() {
      const q = getMainCameraQuaternion();
      if (q && !isDragging) {
        cube.quaternion.slerp(q, 0.25); // 0.25 = slower, smoother rotation
        cubeQuat.copy(cube.quaternion);
      }
    }

    // --- Sync A-Frame camera with cube orientation (on drag) ---
    function syncCubeToAFrame() {
      const aframeCam = document.querySelector('[camera]');
      if (!aframeCam || !aframeCam.object3D) return;
      aframeCam.object3D.quaternion.copy(cubeQuat);
      // Defensive: Only update orbit-controls if available and valid
      const oc = aframeCam.components['orbit-controls'];
      if (oc && oc.controls && oc.controls.object) {
        oc.controls.object.quaternion.copy(cubeQuat);
        if (typeof oc.controls.update === 'function') oc.controls.update();
      }
    }

    // --- Snap camera to face ---
    function snapAFrameCameraToFace(faceIndex) {
      // Map face index to polar/azimuthal angles
      const faceAngles = [
        { polar: 90, azimuthal: -90 },  // right
        { polar: 90, azimuthal: 90 },   // left
        { polar: 0, azimuthal: 0 },     // top
        { polar: 180, azimuthal: 0 },   // bottom
        { polar: 90, azimuthal: 0 },    // front
        { polar: 90, azimuthal: 180 }   // back
      ];
      const aframeWin = window;
      if (aframeWin.ResetCameraAllValues) {
        const a = faceAngles[faceIndex];
        aframeWin.ResetCameraAllValues(a.polar, a.azimuthal);
      }
    }

    // --- Animate and render ---
    function animate() {
      requestAnimationFrame(animate);
      syncAFrameToCube();
      renderer.render(scene, camera);

      // Update label positions
      const labelOffsets = [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
      ];
      for (let i = 0; i < 6; i++) {
        const v = new THREE.Vector3(...labelOffsets[i]).multiplyScalar(0.55);
        v.applyQuaternion(cube.quaternion);
        v.project(camera);
        labelDivs[i].style.left = ((v.x + 1) / 2 * width - 9) + 'px';
        labelDivs[i].style.top = ((-v.y + 1) / 2 * height - 12) + 'px';
      }
    }
    animate();
  });
})(); 