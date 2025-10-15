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
            [legOffsetX, legY, legOffsetZ],
            [-legOffsetX, legY, legOffsetZ],
            [legOffsetX, legY, -legOffsetZ],
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

// Creates a floor plane
function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    // A dark, slightly reflective material works well with the spotlight
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // Rotate the plane to be horizontal
    floor.rotation.x = -Math.PI / 2;
    // Position it at the bottom of the table legs (calculated from your createTable function)
    floor.position.y = -5;
    
    // The floor must be set to receive shadows
    floor.receiveShadow = true;
    
    return floor;
}

    // Build an 8x8 checkers board and place it on top of the table
    function createCheckersBoard() {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;

        const boardGroup = new THREE.Group();
        boardGroup.userData.squares = []; // To store square meshes for raycasting

        const boardBaseGeometry = new THREE.BoxGeometry(boardSize, boardThickness, boardSize);
        const boardBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
        const boardBase = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
        boardBase.position.y = boardThickness / 2;
        boardBase.castShadow = true;
        boardBase.receiveShadow = true;
        boardGroup.add(boardBase);

        const boardBorderGeometry = new THREE.BoxGeometry(boardSize + 0.4, boardThickness * 0.85, boardSize + 0.4);
        const boardBorderMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const boardBorder = new THREE.Mesh(boardBorderGeometry, boardBorderMaterial);
        boardBorder.position.y = boardThickness / 2;
        boardBorder.castShadow = true;
        boardBorder.receiveShadow = true;
        boardGroup.add(boardBorder);


        const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
        const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);

        for (let row = 0; row < squareCount; row++) {
            for (let col = 0; col < squareCount; col++) {
                const isDark = (row + col) % 2 === 1;
                const squareMaterial = isDark ? darkSquareMaterial : lightSquareMaterial;
                const square = new THREE.Mesh(squareGeometry, squareMaterial);
                square.rotation.x = -Math.PI / 2;
                square.position.x = (col - squareCount / 2) * squareSize + squareSize / 2;
                square.position.y = boardThickness + 0.001;
                square.position.z = (row - squareCount / 2) * squareSize + squareSize / 2;
                square.receiveShadow = true;

                square.userData = { type: 'square', row, col };

                if (isDark) {
                    boardGroup.userData.squares.push(square);
                }

                boardGroup.add(square);
            }
        }

        boardGroup.position.y = 0;
        return boardGroup;
    }

    // Creates pieces for EVERY playable square, then hides the ones that are empty.
    function createCheckerPieces(gameBoard, pieceMeshes) {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;
        const pieceGroup = new THREE.Group();

        const darkPieceMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.5 });
        const lightPieceMaterial = new THREE.MeshStandardMaterial({ color: 0xB22222, roughness: 0.5, metalness: 0.5 });

        for (let row = 0; row < squareCount; row++) {
            pieceMeshes[row] = []; // Initialize inner array
            for (let col = 0; col < squareCount; col++) {
                if ((row + col) % 2 === 1) {
                    const logicalPiece = gameBoard[row][col];
                    const material = logicalPiece && logicalPiece.color === 'red' ? lightPieceMaterial : darkPieceMaterial;

                    const piece = createDetailedCheckerPiece(material, squareSize);
                    const pieceHeight = piece.userData.height;
                    piece.position.x = (col - squareCount / 2) * squareSize + squareSize / 2;
                    piece.position.y = boardThickness + pieceHeight - 0.2;
                    piece.position.z = (row - squareCount / 2) * squareSize + squareSize / 2;
                    piece.castShadow = true;
                    piece.receiveShadow = true;

                    piece.userData.row = row;
                    piece.userData.col = col;
                    piece.userData.type = 'piece';

                    piece.visible = !!logicalPiece;

                    pieceGroup.add(piece);
                    pieceMeshes[row][col] = piece;
                } else {
                    pieceMeshes[row][col] = null;
                }
            }
        }
        return pieceGroup;
    }

    // make detailed checker pieces with at least 3 geometric shapes using three.JS
    function createDetailedCheckerPiece(material, squareSize) {
        const pieceGroup = new THREE.Group();

        const baseHeight = squareSize * 0.1;
        const baseRadius = squareSize * 0.4;
        const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
        const base = new THREE.Mesh(baseGeometry, material);
        base.position.y = baseHeight / 2;
        pieceGroup.add(base);

        const midHeight = squareSize * 0.05;
        const midRadiusTop = squareSize * 0.35;
        const midRadiusBottom = squareSize * 0.4;
        const midGeometry = new THREE.CylinderGeometry(midRadiusTop, midRadiusBottom, midHeight, 32);
        const mid = new THREE.Mesh(midGeometry, material);
        mid.position.y = baseHeight + midHeight / 2;
        pieceGroup.add(mid);

        const topHeight = squareSize * 0.05;
        const topRadius = squareSize * 0.3;
        const topGeometry = new THREE.CylinderGeometry(topRadius, topRadius, topHeight, 32);
        const top = new THREE.Mesh(topGeometry, material);
        top.position.y = baseHeight + midHeight + topHeight / 2;
        pieceGroup.add(top);

        const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0x333300 });
        const crownGeometry = new THREE.TorusGeometry(squareSize * 0.2, squareSize * 0.03, 8, 32);
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = baseHeight + midHeight + topHeight + 0.05;
        crown.rotation.x = Math.PI / 2;
        crown.visible = false;
        pieceGroup.add(crown);
        pieceGroup.userData.crown = crown;

        pieceGroup.userData.height = baseHeight + midHeight + topHeight;
        return pieceGroup;
    }

    // Creates transparent green markers that look like real pieces
    function createMoveMarkers(markerMeshes) {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;
        const markerGroup = new THREE.Group();

        const markerMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6,
            roughness: 0.3
        });

        for (let row = 0; row < squareCount; row++) {
            markerMeshes[row] = [];
            for (let col = 0; col < squareCount; col++) {
                if ((row + col) % 2 === 1) {
                    const marker = createDetailedCheckerPiece(markerMaterial, squareSize);
                    
                    const pieceHeight = marker.userData.height;
                    marker.position.x = (col - squareCount / 2) * squareSize + squareSize / 2;
                    marker.position.y = boardThickness + pieceHeight - 0.2;
                    marker.position.z = (row - squareCount / 2) * squareSize + squareSize / 2;
                    
                    marker.visible = false; 
                    marker.userData.crown.visible = false; // Markers should never have crowns

                    markerGroup.add(marker);
                    markerMeshes[row][col] = marker;
                } else {
                    markerMeshes[row][col] = null;
                }
            }
        }
        return markerGroup;
    }
  // Reset the game
  document.getElementById('resetButton').addEventListener('click', () => {
        window.location.reload();
});

// Main function to set up the scene
function main() {
    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    
    
    // Define camera positions for each player
    const playerRedPosition = new THREE.Vector3(0, 8, 8); // Player at the "bottom"
    const playerBlackPosition = new THREE.Vector3(0, 8, -8); // Player at the "top"

    // Set the initial camera position for the starting player (assuming red starts)
    camera.position.copy(playerRedPosition);
    let targetCameraPosition = new THREE.Vector3().copy(camera.position);
   

    camera.lookAt(0, 0, 0);

    const topCameraSize = 6;
    const topCamera = new THREE.OrthographicCamera(
        -topCameraSize, topCameraSize, topCameraSize, -topCameraSize, 0.1, 50
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
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, .5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 125, 25, Math.PI / 2, 0.5, 2);
    spotLight.position.set(0, 8, 0);
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    scene.add(spotLight);
    scene.add(spotLight.target);
  

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false; // Optional: Disabling pan can provide a better experience
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Optional: prevent camera from going below board
    controls.update();

    // Add the floor
    const floor = createFloor();
    scene.add(floor);

    // Create table and board
    const table = createTable();
    scene.add(table);
    const board = createCheckersBoard();
    scene.add(board);

    // Initialize game and 3D object references
    const game = new CheckersGame();

    let previousPlayer = game.currentPlayer; // Track player changes
   
    const pieceMeshes = [];
    const markerMeshes = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Create the pieces and markers based on the initial game state
    const pieces = createCheckerPieces(game.board, pieceMeshes);
    board.add(pieces);
    const markers = createMoveMarkers(markerMeshes);
    board.add(markers);
    

    // Function to switch the camera's target position
    function switchCameraToCurrentPlayer() {
        if (game.currentPlayer === 'red') {
            targetCameraPosition.copy(playerRedPosition);
        } else {
            targetCameraPosition.copy(playerBlackPosition);
        }
    }
 

    function updateBoardFromModel() {
        const darkPieceMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.5 });
        const lightPieceMaterial = new THREE.MeshStandardMaterial({ color: 0xB22222, roughness: 0.5, metalness: 0.5 });

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const mesh = pieceMeshes[row][col];
                if (!mesh) continue;

                const pieceData = game.board[row][col];
                
                if (pieceData) {
                    mesh.visible = true;
                    const newMaterial = pieceData.color === 'red' ? lightPieceMaterial : darkPieceMaterial;
                    
                    mesh.children.forEach(child => {
                        if (child.isMesh && child !== mesh.userData.crown) {
                            child.material = newMaterial;
                        }
                    });
                    
                    mesh.userData.crown.visible = pieceData.isKing;
                } else {
                    mesh.visible = false;
                }
            }
        }
    }
    
    function hideValidMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (markerMeshes[row][col]) {
                    markerMeshes[row][col].visible = false;
                }
            }
        }
    }

    function showValidMoves() {
        hideValidMoves();
        game.validMoves.forEach(move => {
            markerMeshes[move.row][move.col].visible = true;
        });
    }
    
    function onDocumentMouseDown(event) {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([...pieces.children, ...board.userData.squares, ...markers.children], true);

        if (intersects.length > 0) {
            let clickedObject = intersects[0].object;

            while (clickedObject.parent && !clickedObject.userData.type) {
                clickedObject = clickedObject.parent;
            }

            const { row, col } = clickedObject.userData;

            if (game.selectedPiece) {
                const isMoveSuccessful = game.makeMove(row, col);
                if (isMoveSuccessful) {
                    updateBoardFromModel();
                    
                    // --- CHANGE START ---
                    // Check if the player has changed and trigger the camera switch
                    if (previousPlayer !== game.currentPlayer) {
                        switchCameraToCurrentPlayer();
                        previousPlayer = game.currentPlayer;
                    }
                    // --- CHANGE END ---

                    if (game.selectedPiece) {
                       showValidMoves();
                    } else {
                       hideValidMoves();
                    }
                } else {
                    game.deselectPiece();
                    hideValidMoves();
                    if (game.selectPiece(row, col)) {
                       showValidMoves();
                    }
                }
            } else {
                if (game.selectPiece(row, col)) {
                    showValidMoves();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        
        // Smoothly move the camera towards its target position
        // The second argument (alpha) controls the speed; smaller is slower.
        camera.position.lerp(targetCameraPosition, 0.05);
     

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

    animate();
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

    main();
});