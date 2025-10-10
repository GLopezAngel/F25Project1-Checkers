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
        const topWidth = 10;
        const topDepth = 10;
        const topThickness = 1;
        const legThickness = 0.6;
        const legHeight = 4;

        const tableGroup = new THREE.Group();

        const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        const tableTopGeometry = new THREE.BoxGeometry(topWidth, topThickness, topDepth);
        const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
        tableTop.position.y = -topThickness / 2;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        tableGroup.add(tableTop);

        const legGeometry = new THREE.BoxGeometry(legThickness, legHeight, legThickness);
        const legOffsetX = (topWidth / 2) - legThickness;
        const legOffsetZ = (topDepth / 2) - legThickness;
        const legY = -(topThickness + legHeight) / 2 - (topThickness / 2);

        const legPositions = [
            [ legOffsetX, legY,  legOffsetZ],
            [-legOffsetX, legY,  legOffsetZ],
            [ legOffsetX, legY, -legOffsetZ],
            [-legOffsetX, legY, -legOffsetZ],
        ];

        for (const [x, y, z] of legPositions) {
            const leg = new THREE.Mesh(legGeometry, tableMaterial);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            tableGroup.add(leg);
        }

        return tableGroup;
    }

    // Build an 8x8 checkers board and place it on top of the table
    function createCheckersBoard() {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;

        const boardGroup = new THREE.Group();

        const boardBaseGeometry = new THREE.BoxGeometry(boardSize, boardThickness, boardSize);
        const boardBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
        const boardBase = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
        boardBase.position.y = boardThickness / 2;
        boardBase.castShadow = true;
        boardBase.receiveShadow = true;
        boardGroup.add(boardBase);

        const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
        const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);

        for (let row = 0; row < squareCount; row++) {
            for (let col = 0; col < squareCount; col++) {
                const squareMaterial = (row + col) % 2 === 0 ? lightSquareMaterial : darkSquareMaterial;
                const square = new THREE.Mesh(squareGeometry, squareMaterial);
                square.rotation.x = -Math.PI / 2;
                square.position.x = (col - squareCount / 2) * squareSize + squareSize / 2;
                square.position.y = boardThickness + 0.001;
                square.position.z = (row - squareCount / 2) * squareSize + squareSize / 2;
                square.receiveShadow = true;
                square.castShadow = false;
                boardGroup.add(square);
            }
        }

        boardGroup.position.y = 0;

        return boardGroup;
    }

    // Place checker pieces in their standard starting configuration
    function createCheckerPieces() {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;
        const pieceGroup = new THREE.Group();

        const darkPieceMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const lightPieceMaterial = new THREE.MeshStandardMaterial({ color: 0xB22222 });

        const startingRowsPerSide = 3;

        for (let row = 0; row < squareCount; row++) {
            for (let col = 0; col < squareCount; col++) {
                if ((row + col) % 2 === 1) {
                    const isTopPlayer = row < startingRowsPerSide;
                    const isBottomPlayer = row >= squareCount - startingRowsPerSide;

                    if (!isTopPlayer && !isBottomPlayer) {
                        continue;
                    }

                    const piece = createDetailedCheckerPiece(isTopPlayer ? darkPieceMaterial : lightPieceMaterial, squareSize);
                    const pieceHeight = piece.userData.height;
                    piece.position.x = (col - squareCount / 2) * squareSize + squareSize / 2;
                    piece.position.y = boardThickness + pieceHeight / 2 + 0.01;
                    piece.position.z = (row - squareCount / 2) * squareSize + squareSize / 2;
                    piece.castShadow = true;
                    piece.receiveShadow = true;

                    pieceGroup.add(piece);
                }
            }
        }

        return pieceGroup;
    }

    // Craft a single checker piece with detailed contours and top inlay
    function createDetailedCheckerPiece(material, squareSize) {
        const radius = squareSize * 0.35;
        const baseHeight = radius * 0.28;
        const midHeight = radius * 0.3;
        const rimHeight = radius * 0.14;
        const totalHeight = baseHeight + midHeight + rimHeight;

        const pieceGroup = new THREE.Group();

        const profile = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(radius * 0.98, 0),
            new THREE.Vector2(radius, baseHeight * 0.15),
            new THREE.Vector2(radius * 0.92, baseHeight * 0.55),
            new THREE.Vector2(radius * 0.9, baseHeight),
            new THREE.Vector2(radius * 0.92, baseHeight + midHeight * 0.2),
            new THREE.Vector2(radius * 0.82, baseHeight + midHeight * 0.9),
            new THREE.Vector2(radius * 0.78, baseHeight + midHeight),
            new THREE.Vector2(radius * 0.88, baseHeight + midHeight + rimHeight * 0.2),
            new THREE.Vector2(radius * 0.85, totalHeight - rimHeight * 0.1),
            new THREE.Vector2(radius * 0.75, totalHeight),
            new THREE.Vector2(0, totalHeight),
        ];

        const bodyGeometry = new THREE.LatheGeometry(profile, 64);
        bodyGeometry.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        pieceGroup.add(body);

        const topInsetGeometry = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, rimHeight * 0.25, 48);
        const topInset = new THREE.Mesh(topInsetGeometry, material.clone());
        topInset.position.y = totalHeight - rimHeight * 0.12;
        topInset.castShadow = true;
        topInset.receiveShadow = true;
        pieceGroup.add(topInset);

        const topRingGeometry = new THREE.TorusGeometry(radius * 0.68, radius * 0.05, 28, 80);
        const topRing = new THREE.Mesh(topRingGeometry, material.clone());
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = totalHeight - rimHeight * 0.25;
        topRing.castShadow = true;
        topRing.receiveShadow = true;
        pieceGroup.add(topRing);

        const bottomChamferGeometry = new THREE.CylinderGeometry(radius * 0.96, radius, baseHeight * 0.2, 48);
        const bottomChamfer = new THREE.Mesh(bottomChamferGeometry, material.clone());
        bottomChamfer.position.y = baseHeight * 0.1;
        bottomChamfer.castShadow = true;
        bottomChamfer.receiveShadow = true;
        pieceGroup.add(bottomChamfer);

        pieceGroup.userData.height = totalHeight;

        return pieceGroup;
    }

  

    // Main function to set up the scene
    function main() {
        // Set up scene, camera, and renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa0a0a0);
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(5, 10, 10);
        camera.lookAt(0, 0, 0);

        const topCameraSize = 6;
        const topCamera = new THREE.OrthographicCamera(
            -topCameraSize,
            topCameraSize,
            topCameraSize,
            -topCameraSize,
            0.1,
            50
        );
        topCamera.position.set(0, 20, 0);
        topCamera.up.set(0, 0, -1);
        topCamera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.autoClear = false;
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
        const board = createCheckersBoard();
        scene.add(board);
        const pieces = createCheckerPieces();
        board.add(pieces);

    
        // Initialize game state
        // const game = new CheckersGame();
        // let selectedPiece = null;
        // let validMoves = [];

        // Function to continuously render the scene
        function animate() {
            requestAnimationFrame(animate);

            controls.update(); 

            renderer.clear();
            renderer.setScissorTest(true);

            const canvas = renderer.domElement;
            const mainWidth = canvas.clientWidth;
            const mainHeight = canvas.clientHeight;

            renderer.setViewport(0, 0, mainWidth, mainHeight);
            renderer.setScissor(0, 0, mainWidth, mainHeight);
            renderer.render(scene, camera);

            const insetScale = 0.2;
            const insetWidth = mainWidth * insetScale;
            const insetHeight = insetWidth;
            const insetMargin = 20;
            const insetX = mainWidth - insetWidth - insetMargin;
            const insetY = mainHeight - insetHeight - insetMargin;

            renderer.setViewport(insetX, insetY, insetWidth, insetHeight);
            renderer.setScissor(insetX, insetY, insetWidth, insetHeight);
            renderer.render(scene, topCamera);
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
