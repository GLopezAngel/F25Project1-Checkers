/**
 * Load the game and render the board in 3D using Three.js
 * */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CheckersGame } from '../Model/CheckersGame.js';

// The entire game setup is wrapped in the 'load' event listener
window.addEventListener('load', () => { 
    // make a table
    function createTable() {
        const tableGeometry = new THREE.BoxGeometry(10, 1, 10);
        const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = -0.5;
        table.receiveShadow = true;
        return table;
    }

  

    // Main function to set up the scene
    function main() {
        // Set up scene, camera, and renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa0a0a0);
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(5, 10, 10);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        scene.add(directionalLight);

        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();

        // Create table and board
        const table = createTable();
        scene.add(table);

    
        // Initialize game state
        const game = new CheckersGame();
        let selectedPiece = null;
        let validMoves = [];

        // Function to continuously render the scene
        function animate() {
            requestAnimationFrame(animate);

            controls.update(); 

            renderer.render(scene, camera);
        }

        // Start the animation loop
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Call the main function to start the application
    main();

// THIS IS THE CORRECTED CLOSING SYNTAX:
});