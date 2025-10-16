/**
 * Load the game and render the board in 3D using Three.js
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CheckersGame } from '../Model/CheckersGame.js';
import woodTextureUrl from '../../assets/Red_Oak_1200x1200_2cb4d3b7-b287-43df-a575-fb629a6914cd_1200x.jpeg';

window.addEventListener('load', () => {
    const textureLoader = new THREE.TextureLoader();
    const woodTexture = textureLoader.load(woodTextureUrl, texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    function createTable() {
        const topWidth = 10;
        const topDepth = 10;
        const topThickness = 1;
        const legThickness = 0.6;
        const legHeight = 4;

        const tableGroup = new THREE.Group();

        const topTexture = woodTexture.clone();
        topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;
        topTexture.colorSpace = THREE.SRGBColorSpace;
        topTexture.repeat.set(1.5, 1.5);
        topTexture.needsUpdate = true;

        const legTexture = woodTexture.clone();
        legTexture.wrapS = legTexture.wrapT = THREE.RepeatWrapping;
        legTexture.colorSpace = THREE.SRGBColorSpace;
        legTexture.repeat.set(0.8, 3.5);
        legTexture.rotation = Math.PI / 2;
        legTexture.center.set(0.5, 0.5);
        legTexture.needsUpdate = true;

        const tableMaterial = new THREE.MeshStandardMaterial({
            map: topTexture,
            roughness: 0.6,
            metalness: 0.1
        });
        const legMaterial = new THREE.MeshStandardMaterial({
            map: legTexture,
            roughness: 0.7,
            metalness: 0.1
        });

        const tableTopGeometry = new THREE.BoxGeometry(topWidth, topThickness, topDepth);
        const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
        tableTop.position.y = -topThickness / 2;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        tableGroup.add(tableTop);

        const legGeometry = new THREE.BoxGeometry(legThickness, legHeight, legThickness);
        const legOffsetX = topWidth / 2 - legThickness;
        const legOffsetZ = topDepth / 2 - legThickness;
        const legY = -(topThickness + legHeight) / 2 - topThickness / 2;

        const legPositions = [
            [legOffsetX, legY, legOffsetZ],
            [-legOffsetX, legY, legOffsetZ],
            [legOffsetX, legY, -legOffsetZ],
            [-legOffsetX, legY, -legOffsetZ]
        ];

        for (const [x, y, z] of legPositions) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            tableGroup.add(leg);
        }

        return tableGroup;
    }

    function createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        return floor;
    }

    function createCheckersBoard() {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;

        const boardGroup = new THREE.Group();
        boardGroup.userData.squares = [];

        const boardBaseGeometry = new THREE.BoxGeometry(boardSize, boardThickness, boardSize);
        const boardBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
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

        const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
        const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
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

        return boardGroup;
    }

    const basePieceMaterials = {
        red: new THREE.MeshStandardMaterial({ color: 0xb22222, roughness: 0.5, metalness: 0.5 }),
        black: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.5 })
    };

    const selectedPieceMaterials = {
        red: new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.5, metalness: 0.5 }),
        black: new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.5 })
    };

    function createCheckerPieces(gameBoard, pieceMeshes) {
        const boardSize = 8;
        const squareCount = 8;
        const squareSize = boardSize / squareCount;
        const boardThickness = 0.15;
        const pieceGroup = new THREE.Group();

        for (let row = 0; row < squareCount; row++) {
            pieceMeshes[row] = [];
            for (let col = 0; col < squareCount; col++) {
                if ((row + col) % 2 === 1) {
                    const logicalPiece = gameBoard[row][col];
                    const material = logicalPiece && logicalPiece.color === 'red' ? basePieceMaterials.red : basePieceMaterials.black;
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

    const pieceGeometryCache = new Map();

    function getPieceGeometryData(squareSize) {
        if (pieceGeometryCache.has(squareSize)) {
            return pieceGeometryCache.get(squareSize);
        }
    
        // Core dimensions for a classic "puck" shape
        const pieceRadius = squareSize * 0.45;
        const pieceHeight = squareSize * 0.25; // Much shorter and wider now
    
        // 1. The main body of the checker (CylinderGeometry)
        const mainCylinder = new THREE.CylinderGeometry(pieceRadius, pieceRadius, pieceHeight, 64);
    
        // 2. A torus to create smooth, beveled edges (TorusGeometry)
        const edgeBevelTorus = new THREE.TorusGeometry(pieceRadius, squareSize * 0.02, 16, 64);
    
        // 3. A box for the ridges on the side (BoxGeometry)
        const ridgeBox = new THREE.BoxGeometry(squareSize * 0.04, pieceHeight * 1.2, squareSize * 0.03);
        const ridgeCount = 24; // More ridges for a finer look
        const ridgeRadius = pieceRadius - squareSize * 0.01;
    
        // --- King's Crown Geometries (Unchanged from before) ---
        const kingCrownRadius = squareSize * 0.25;
        const crownHeight = squareSize * 0.06;
        const kingBaseCylinder = new THREE.CylinderGeometry(kingCrownRadius, kingCrownRadius * 0.8, crownHeight * 0.6, 32);
        const kingCrownTorus = new THREE.TorusGeometry(kingCrownRadius * 0.7, squareSize * 0.015, 16, 64);
        const kingSpike = new THREE.CylinderGeometry(squareSize * 0.01, squareSize * 0.03, crownHeight * 0.8, 8);
        const kingSpikeCount = 8;
        const kingSpikeRadius = kingCrownRadius * 0.8;
    
        const data = {
            pieceHeight,
            mainCylinder,
            edgeBevelTorus,
            ridgeBox,
            ridgeCount,
            ridgeRadius,
            // King data
            crownHeight,
            kingBaseCylinder,
            kingCrownTorus,
            kingSpike,
            kingSpikeCount,
            kingSpikeRadius
        };
    
        pieceGeometryCache.set(squareSize, data);
        return data;
    }
    
    /**
     * NEW: Builds the checker piece using the classic "puck" shape.
     */
    function createDetailedCheckerPiece(material, squareSize) {
        const pieceGroup = new THREE.Group();
        const geometryData = getPieceGeometryData(squareSize);
        const {
            pieceHeight,
            mainCylinder,
            edgeBevelTorus,
            ridgeBox,
            ridgeCount,
            ridgeRadius,
            crownHeight,
            kingBaseCylinder,
            kingCrownTorus,
            kingSpike,
            kingSpikeCount,
            kingSpikeRadius
        } = geometryData;
    
        // The main body of the piece
        const mainPiece = new THREE.Mesh(mainCylinder, material);
        mainPiece.position.y = pieceHeight / 2; // Center it vertically
        pieceGroup.add(mainPiece);
    
        // Add ridges around the side
        for (let i = 0; i < ridgeCount; i++) {
            const angle = (i / ridgeCount) * Math.PI * 2;
            const ridge = new THREE.Mesh(ridgeBox, material);
            ridge.position.set(
                Math.cos(angle) * ridgeRadius,
                pieceHeight / 2,
                Math.sin(angle) * ridgeRadius
            );
            ridge.rotation.y = angle;
            pieceGroup.add(ridge);
        }
    
        // Add a single decorative Torus ring in a slight inset on the top surface
        const topRing = new THREE.Mesh(
            new THREE.TorusGeometry(ridgeRadius * 0.7, squareSize * 0.015, 16, 64),
            material
        );
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = pieceHeight; // Sit it on the top face
        pieceGroup.add(topRing);
    
        // --- King's Crown Group (Same as before, just re-positioned) ---
        const crownGroup = new THREE.Group();
        const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x333300, roughness: 0.3, metalness: 0.7 });
        const kingBase = new THREE.Mesh(kingBaseCylinder, crownMaterial);
        kingBase.position.y = crownHeight * 0.3;
        crownGroup.add(kingBase);
        const kingRing = new THREE.Mesh(kingCrownTorus, crownMaterial);
        kingRing.rotation.x = Math.PI / 2;
        kingRing.position.y = crownHeight * 0.7;
        crownGroup.add(kingRing);
        for (let i = 0; i < kingSpikeCount; i++) {
            const angle = (i / kingSpikeCount) * Math.PI * 2;
            const spike = new THREE.Mesh(kingSpike, crownMaterial);
            spike.position.set(Math.cos(angle) * kingSpikeRadius, crownHeight * 0.8, Math.sin(angle) * kingSpikeRadius);
            crownGroup.add(spike);
        }
        
        // Position the whole crown on top of the checker piece
        crownGroup.position.y = pieceHeight;
        crownGroup.visible = false;
        pieceGroup.add(crownGroup);
        pieceGroup.userData.crown = crownGroup;
    
        // Set the height for positioning on the board
        pieceGroup.userData.height = pieceHeight;
        return pieceGroup;
    }
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
                    marker.userData.crown.visible = false;
                    markerGroup.add(marker);
                    markerMeshes[row][col] = marker;
                } else {
                    markerMeshes[row][col] = null;
                }
            }
        }

        return markerGroup;
    }

    document.getElementById('resetButton').addEventListener('click', () => {
        window.location.reload();
    });

    function main() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        const playerRedPosition = new THREE.Vector3(0, 8, 8);
        const playerBlackPosition = new THREE.Vector3(0, 8, -8);
        camera.position.copy(playerRedPosition);
        camera.lookAt(0, 0, 0);

        const topCameraSize = 6;
        const topCamera = new THREE.OrthographicCamera(-topCameraSize, topCameraSize, topCameraSize, -topCameraSize, 0.1, 50);
        topCamera.position.set(0, 20, 0);
        topCamera.up.set(0, 0, -1);
        topCamera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.autoClear = false;
        document.body.appendChild(renderer.domElement);

        const insetViewport = { x: 0, y: 0, width: 0, height: 0 };
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 125, 25, Math.PI / 2, 0.5, 2);
        spotLight.position.set(0, 8, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.set(2048, 2048);
        scene.add(spotLight);
        scene.add(spotLight.target);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enablePan = false;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        let isCameraAnimating = false;

        controls.addEventListener('start', () => {
            isCameraAnimating = false;
        });

        controls.update();

        const floor = createFloor();
        scene.add(floor);

        const table = createTable();
        scene.add(table);

        const board = createCheckersBoard();
        scene.add(board);

        const game = new CheckersGame();
        let previousPlayer = game.currentPlayer;

        const pieceMeshes = [];
        const markerMeshes = [];
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const pieces = createCheckerPieces(game.board, pieceMeshes);
        board.add(pieces);
        const markers = createMoveMarkers(markerMeshes);
        board.add(markers);
        refreshPieceMaterials();

        function switchCameraToCurrentPlayer() {
            if (game.currentPlayer === 'red') {
                return playerRedPosition.clone();
            }
            return playerBlackPosition.clone();
        }

        const targetCameraPosition = switchCameraToCurrentPlayer();

        function refreshPieceMaterials() {
            const selected = game.selectedPiece;
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const mesh = pieceMeshes[row][col];
                    if (!mesh) continue;
                    const pieceData = game.board[row][col];
                    if (!pieceData || !mesh.visible) continue;

                    const isSelected = selected && selected.row === row && selected.col === col;
                    const material =
                        pieceData.color === 'red'
                            ? isSelected
                                ? selectedPieceMaterials.red
                                : basePieceMaterials.red
                            : isSelected
                                ? selectedPieceMaterials.black
                                : basePieceMaterials.black;

                    mesh.traverse(child => {
                        if (child.isMesh && child !== mesh.userData.crown) {
                            child.material = material;
                        }
                    });
                }
            }
        }

        function updateBoardFromModel() {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const mesh = pieceMeshes[row][col];
                    if (!mesh) continue;
                    const pieceData = game.board[row][col];

                    if (pieceData) {
                        mesh.visible = true;
                        mesh.userData.crown.visible = pieceData.isKing;
                    } else {
                        mesh.visible = false;
                    }
                }
            }
            refreshPieceMaterials();
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

            const canvas = renderer.domElement;
            const rect = canvas.getBoundingClientRect();
            const canvasWidth = rect.width;
            const canvasHeight = rect.height;
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;

            const viewportLeft = insetViewport.x;
            const viewportRight = insetViewport.x + insetViewport.width;
            const viewportTop = canvasHeight - (insetViewport.y + insetViewport.height);
            const viewportBottom = canvasHeight - insetViewport.y;
            const isInTopView =
                insetViewport.width > 0 &&
                insetViewport.height > 0 &&
                relativeX >= viewportLeft &&
                relativeX <= viewportRight &&
                relativeY >= viewportTop &&
                relativeY <= viewportBottom;

            if (isInTopView) {
                const normalizedX = (relativeX - viewportLeft) / insetViewport.width;
                const normalizedY = (relativeY - viewportTop) / insetViewport.height;
                mouse.x = normalizedX * 2 - 1;
                mouse.y = -(normalizedY * 2 - 1);
                raycaster.setFromCamera(mouse, topCamera);
            } else {
                const normalizedX = relativeX / canvasWidth;
                const normalizedY = relativeY / canvasHeight;
                mouse.x = normalizedX * 2 - 1;
                mouse.y = -(normalizedY * 2 - 1);
                raycaster.setFromCamera(mouse, camera);
            }

            const intersects = raycaster.intersectObjects(
                [...pieces.children, ...board.userData.squares, ...markers.children],
                true
            );

            if (intersects.length === 0) return;

            let clickedObject = intersects[0].object;
            while (clickedObject.parent && !clickedObject.userData.type) {
                clickedObject = clickedObject.parent;
            }

            const { row, col } = clickedObject.userData;

            if (game.selectedPiece) {
                const isMoveSuccessful = game.makeMove(row, col);
                if (isMoveSuccessful) {
                    updateBoardFromModel();

                    if (previousPlayer !== game.currentPlayer) {
                        targetCameraPosition.copy(switchCameraToCurrentPlayer());
                        previousPlayer = game.currentPlayer;
                        isCameraAnimating = true;
                    }

                    if (game.selectedPiece) {
                        showValidMoves();
                    } else {
                        hideValidMoves();
                    }
                } else {
                    game.deselectPiece();
                    hideValidMoves();
                    refreshPieceMaterials();
                    if (game.selectPiece(row, col)) {
                        showValidMoves();
                        refreshPieceMaterials();
                    }
                }
            } else {
                if (game.selectPiece(row, col)) {
                    showValidMoves();
                    refreshPieceMaterials();
                } else {
                    refreshPieceMaterials();
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            if (isCameraAnimating) {
                camera.position.lerp(targetCameraPosition, 0.05);
        
                // Stop animating when the camera is very close to the target
                if (camera.position.distanceTo(targetCameraPosition) < 0.01) {
                    isCameraAnimating = false;
                }
            }
  
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

            insetViewport.x = insetX;
            insetViewport.y = insetY;
            insetViewport.width = insetWidth;
            insetViewport.height = insetHeight;
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
