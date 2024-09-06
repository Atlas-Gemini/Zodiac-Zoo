let scene, camera, renderer, door, gears = [], nodes = [], matrixLines = [], dashboard, clock, doorMove = false, doorPositionY = 0, treeExpanded = false, matrixWorld = false, zoomToDashboard = false;

init();
animate();

function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // black background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // soft light
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create Vault Door (cylinder)
    const doorGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.rotation.x = Math.PI / 2; // Rotate it to face the camera
    scene.add(door);

    // Create Gears (as cylinders for simplicity)
    for (let i = 0; i < 4; i++) {
        const gearGeometry = new THREE.CylinderGeometry(1, 1, 0.3, 32);
        const gearMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const gear = new THREE.Mesh(gearGeometry, gearMaterial);
        gear.position.set(6 * Math.cos(i * Math.PI / 2), 6 * Math.sin(i * Math.PI / 2), 0);
        gear.rotation.x = Math.PI / 2;
        gears.push(gear);
        scene.add(gear);
    }

    // Set up clock to track time for animations
    clock = new THREE.Clock();

    // Create the Dashboard (a simple plane)
    const dashboardGeometry = new THREE.PlaneGeometry(10, 6);
    const dashboardMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial);

    // Position the dashboard far away initially
    dashboard.position.set(0, 0, -50); // Far in front of the camera
    scene.add(dashboard);
}

function createTreeNodes() {
    // Create 10 spheres representing "family tree" nodes
    for (let i = 0; i < 10; i++) {
        const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const nodeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // Green spheres
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        
        // Place them at the door position initially
        node.position.set(0, doorPositionY, 0);
        
        // Store random target positions for expansion
        node.userData.targetPosition = {
            x: (Math.random() - 0.5) * 20, // Random x in range [-10, 10]
            y: (Math.random() - 0.5) * 20, // Random y in range [-10, 10]
            z: (Math.random() - 0.5) * 20  // Random z in range [-10, 10]
        };
        
        nodes.push(node);
        scene.add(node);
    }
}

function createMatrixGrid() {
    // Create a grid of 3D lines
    const gridSize = 30; // Adjust size of the grid
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green lines
    const spacing = 2; // Spacing between grid lines

    for (let i = -gridSize; i <= gridSize; i += spacing) {
        for (let j = -gridSize; j <= gridSize; j += spacing) {
            const points = [];
            // Line from bottom to top along Y-axis
            points.push(new THREE.Vector3(i, -gridSize, j));
            points.push(new THREE.Vector3(i, gridSize, j));

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);

            matrixLines.push(line);
            scene.add(line);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Time elapsed since animation started
    const elapsedTime = clock.getElapsedTime();

    // Spin the door initially for 5 seconds
    if (elapsedTime < 5) {
        door.rotation.z += 0.05; // Faster spin for the first 5 seconds
    } else if (!doorMove) {
        // Start moving the door after 5 seconds
        doorMove = true;
    }

    // Move the door away after 5 seconds (simulate vault opening)
    if (doorMove && doorPositionY > -12) {
        doorPositionY -= 0.1; // Slide door upwards (out of the way)
        door.position.y = doorPositionY;
    }

    // Start expanding the "family tree" after the door has moved away
    if (doorPositionY <= -12 && !treeExpanded) {
        createTreeNodes();
        treeExpanded = true;
    }

    // Animate nodes to spread outwards
    if (treeExpanded && !matrixWorld) {
        nodes.forEach((node) => {
            const target = node.userData.targetPosition;
            node.position.x += (target.x - node.position.x) * 0.02; // Lerp towards target
            node.position.y += (target.y - node.position.y) * 0.02;
            node.position.z += (target.z - node.position.z) * 0.02;
        });

        // Transition to matrix world after nodes expand
        if (elapsedTime > 10) {
            matrixWorld = true;
            createMatrixGrid(); // Trigger Matrix World creation
        }
    }

    // Animate the matrix world lines (scroll downward)
    if (matrixWorld && !zoomToDashboard) {
        matrixLines.forEach((line) => {
            line.position.y -= 0.1; // Move lines downward
            if (line.position.y < -30) {
                line.position.y = 30; // Loop back when off screen
            }
        });

        // Start zooming towards the dashboard after 15 seconds
        if (elapsedTime > 15) {
            zoomToDashboard = true;
        }
    }

    // Zoom in towards the dashboard
    if (zoomToDashboard) {
        camera.position.z -= 0.1; // Move the camera forward (zoom in)
        if (camera.position.z < -50) {
            camera.position.z = -50; // Stop at the dashboard
        }
    }

    // Spin the gears in alternating directions
    gears.forEach((gear, index) => {
        gear.rotation.y += index % 2 === 0 ? 0.02 : -0.02;
    });

    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});


