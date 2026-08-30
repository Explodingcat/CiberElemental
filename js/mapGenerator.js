// mapGenerator.js

let fullMap = []; // Array de 10 pisos

function generateFullMap() {
    fullMap = [];
    const numLanes = 3;

    // 1er Mercado: Garantizado exactamente 1 mercado entre los pisos 2, 3 o 4
    const shopFloor1 = Math.floor(Math.random() * 3) + 2; // 2, 3 o 4
    const shopLane1 = Math.floor(Math.random() * numLanes);

    // 2do Mercado: Garantizado exactamente 1 mercado entre los pisos 6, 7, 8 o 9
    const shopFloor2 = Math.floor(Math.random() * 4) + 6; // 6, 7, 8 o 9
    const shopLane2 = Math.floor(Math.random() * numLanes);

    // Taller de Reparación (Campamento): Piso 6, 7 u 8
    let possibleRepairFloors = [6, 7, 8].filter(f => f !== shopFloor2);
    if (possibleRepairFloors.length === 0) possibleRepairFloors = [6, 7, 8];
    const repairShopFloor = possibleRepairFloors[Math.floor(Math.random() * possibleRepairFloors.length)];
    const repairShopLane = (repairShopFloor === shopFloor2) ? ((shopLane2 + 1) % numLanes) : 1;

    // Generar Nodos
    for (let floor = 1; floor <= 10; floor++) {
        let floorNodes = [];
        let nodesInThisFloor = (floor === 10) ? 1 : numLanes;

        for (let i = 0; i < nodesInThisFloor; i++) {
            let type;
            if (floor === 10) {
                type = NODE_TYPES.BOSS;
            } else if (floor === 5) {
                // Piso 5: Siempre son puros tesoros (el jugador escoge 1 en su ruta)
                type = NODE_TYPES.CHEST;
            } else if (floor === shopFloor1 && i === shopLane1) {
                type = NODE_TYPES.SHOP;
            } else if (floor === shopFloor2 && i === shopLane2) {
                type = NODE_TYPES.SHOP;
            } else if (floor === repairShopFloor && i === repairShopLane) {
                type = NODE_TYPES.REPAIR_SHOP;
            } else if (floor === 1) {
                // Piso 1: Combates iniciales o misterio
                type = (Math.random() < 0.8) ? NODE_TYPES.COMBAT : NODE_TYPES.MYSTERY;
            } else {
                let rand = Math.random();
                if (rand < 0.45) {
                    type = NODE_TYPES.COMBAT;
                } else if (rand < 0.75) {
                    // Élite disponible desde piso 3
                    if (floor >= 3) {
                        type = NODE_TYPES.ELITE;
                    } else {
                        type = NODE_TYPES.COMBAT;
                    }
                } else {
                    type = NODE_TYPES.MYSTERY;
                }
            }
            floorNodes.push({ 
                id: `f${floor}-n${i}`, 
                floor: floor,
                lane: i,
                type: type,
                nextNodes: []
            });
        }
        fullMap.push(floorNodes);
    }

    // Generar Conexiones
    for (let floor = 1; floor < 10; floor++) {
        const currentFloorNodes = fullMap[floor - 1];
        const nextFloorNodes = fullMap[floor];

        if (floor === 9) {
            // Todos al jefe
            currentFloorNodes.forEach(node => {
                node.nextNodes.push(nextFloorNodes[0].id);
            });
        } else {
            // Conectar a la siguiente capa
            currentFloorNodes.forEach((node, i) => {
                // Siempre conecta de frente
                node.nextNodes.push(nextFloorNodes[i].id);
                // 30% chance de cruzar a la izquierda
                if (i > 0 && Math.random() < 0.3) {
                    node.nextNodes.push(nextFloorNodes[i - 1].id);
                }
                // 30% chance de cruzar a la derecha
                if (i < numLanes - 1 && Math.random() < 0.3) {
                    node.nextNodes.push(nextFloorNodes[i + 1].id);
                }
            });
            // Garantizar que todos los nodos de la siguiente capa tengan al menos un padre
            nextFloorNodes.forEach((nextNode, j) => {
                const hasParent = currentFloorNodes.some(n => n.nextNodes.includes(nextNode.id));
                if (!hasParent) {
                    currentFloorNodes[j].nextNodes.push(nextNode.id);
                }
            });
        }
    }
}

function renderMap() {
    const container = document.getElementById('map-container');
    container.innerHTML = '';
    
    // Crear contenedor para las líneas SVG
    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.id = 'map-svg-lines';
    container.appendChild(svgContainer);
    
    // Renderizamos de arriba hacia abajo (Piso 10 primero, Piso 1 último)
    for (let f = 9; f >= 0; f--) {
        const floorData = fullMap[f];
        const floorNum = f + 1;
        const isCurrentFloor = floorNum === GAME_STATE.floor;
        const isPastFloor = floorNum < GAME_STATE.floor;
        const isBossFloor = floorNum === 10;
        
        const floorRow = document.createElement('div');
        let rowClass = 'map-floor-row';
        if (isBossFloor) rowClass += ' floor-boss-chamber';
        else if (isCurrentFloor) rowClass += ' floor-current';
        else if (isPastFloor) rowClass += ' floor-passed';
        else rowClass += ' floor-future';
        
        floorRow.className = rowClass;
        
        // Etiqueta táctica del piso
        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-label-box';
        
        if (isBossFloor) {
            floorLabel.innerHTML = `
                <span class="floor-badge-boss">👑 PISO 10</span>
                <span class="floor-sub-label boss-sub">NÚCLEO FINAL</span>
            `;
        } else if (isCurrentFloor) {
            floorLabel.innerHTML = `
                <span class="floor-badge-current">PISO ${floorNum}</span>
                <span class="floor-sub-label active-sub">▶ ACTIVO</span>
            `;
        } else if (isPastFloor) {
            floorLabel.innerHTML = `
                <span class="floor-badge-passed">PISO ${floorNum}</span>
                <span class="floor-sub-label passed-sub">✔ SUPERADO</span>
            `;
        } else {
            floorLabel.innerHTML = `
                <span class="floor-badge-future">PISO ${floorNum}</span>
                <span class="floor-sub-label future-sub">BLOQUEADO</span>
            `;
        }
        floorRow.appendChild(floorLabel);

        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'nodes-container';
        if (floorNum === 10) nodesContainer.style.justifyContent = 'center';

        floorData.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `map-node node-type-${node.type}`;
            nodeDiv.id = `node-ui-${node.id}`;
            
            // Lógica de si se puede seleccionar
            let isSelectable = false;
            let isPast = floorNum < GAME_STATE.floor;
            let isVisited = node.id === GAME_STATE.currentNodeId;
            
            if (floorNum === GAME_STATE.floor) {
                if (floorNum === 1) {
                    isSelectable = true;
                } else {
                    const prevFloorData = fullMap[floorNum - 2];
                    const parentNode = prevFloorData.find(n => n.id === GAME_STATE.currentNodeId);
                    if (parentNode && parentNode.nextNodes.includes(node.id)) {
                        isSelectable = true;
                    }
                }
            }
            
            if (isPast) {
                nodeDiv.classList.add('node-disabled');
                if (isVisited) {
                    nodeDiv.classList.add('node-visited');
                }
            } else if (isSelectable) {
                nodeDiv.classList.add('node-selectable');
                nodeDiv.onclick = () => handleNodeSelection(node);
            } else {
                nodeDiv.classList.add('node-locked');
            }
            
            const nodeName = NODE_LABELS[node.type] || node.type;
            const visitedBadge = isVisited ? '<span class="node-visited-check">✔</span>' : '';
            const pulseRing = isSelectable ? '<div class="node-pulse-ring"></div>' : '';
            
            nodeDiv.innerHTML = `
                <div class="node-icon-wrapper">
                    <span class="node-emoji">${NODE_EMOJIS[node.type]}</span>
                    ${visitedBadge}
                </div>
                <span class="node-name">${nodeName}</span>
                ${pulseRing}
            `;
            nodesContainer.appendChild(nodeDiv);
        });
        
        floorRow.appendChild(nodesContainer);
        container.appendChild(floorRow);
    }
    
    const floorIndicator = document.getElementById('current-floor');
    if (floorIndicator) floorIndicator.innerText = GAME_STATE.floor;
    
    // Auto-scroll al piso actual y dibujar líneas
    setTimeout(() => {
        drawLines();
        const currentFloorElem = container.querySelector('.floor-current');
        if (currentFloorElem) {
            currentFloorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 150);
}

function drawLines() {
    const svg = document.getElementById('map-svg-lines');
    const container = document.getElementById('map-container');
    if (!svg || !container) return;
    svg.innerHTML = '';
    
    const containerRect = container.getBoundingClientRect();
    
    for (let f = 0; f < 9; f++) {
        const floorNodes = fullMap[f];
        floorNodes.forEach(node => {
            const el1 = document.getElementById(`node-ui-${node.id}`);
            if (!el1) return;
            
            node.nextNodes.forEach(nextId => {
                const el2 = document.getElementById(`node-ui-${nextId}`);
                if (!el2) return;
                
                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();
                
                // Calcular centros relativos al contenedor (sumando el scroll)
                const x1 = rect1.left - containerRect.left + rect1.width / 2;
                const y1 = rect1.top - containerRect.top + rect1.height / 2 + container.scrollTop;
                
                const x2 = rect2.left - containerRect.left + rect2.width / 2;
                const y2 = rect2.top - containerRect.top + rect2.height / 2 + container.scrollTop;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                
                const isPathFromCurrent = (f + 1 === GAME_STATE.floor - 1 && node.id === GAME_STATE.currentNodeId);
                const isPathActiveLevel1 = (GAME_STATE.floor === 1 && f === 0);
                
                if (isPathFromCurrent) {
                    line.setAttribute('stroke', '#66fcf1');
                    line.setAttribute('stroke-width', '4');
                    line.setAttribute('stroke-dasharray', '6,4');
                    line.setAttribute('class', 'map-line-active');
                } else if (f + 1 < GAME_STATE.floor && node.id === GAME_STATE.currentNodeId) {
                    line.setAttribute('stroke', '#feca57');
                    line.setAttribute('stroke-width', '3');
                } else {
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
                    line.setAttribute('stroke-width', '2');
                }
                
                svg.appendChild(line);
            });
        });
    }
}

function handleNodeSelection(node) {
    GAME_STATE.currentNodeId = node.id;
    
    switch(node.type) {
        case NODE_TYPES.COMBAT:
        case NODE_TYPES.ELITE:
        case NODE_TYPES.BOSS:
            startCombat(node.type);
            break;
        case NODE_TYPES.REPAIR_SHOP:
        case NODE_TYPES.CHEST:
        case NODE_TYPES.SHOP:
        case NODE_TYPES.MYSTERY:
            startEvent(node.type);
            break;
    }
}

// Redibujar conexiones SVG automáticamente cuando cambia el tamaño de la ventana o la orientación del móvil
let mapResizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(mapResizeTimeout);
    mapResizeTimeout = setTimeout(() => {
        const mapScreen = document.getElementById('screen-map');
        if (mapScreen && mapScreen.classList.contains('active')) {
            drawLines();
        }
    }, 100);
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        const mapScreen = document.getElementById('screen-map');
        if (mapScreen && mapScreen.classList.contains('active')) {
            drawLines();
        }
    }, 200);
});

