// --- Game Constants ---
const GRID_SIZE = 22;
const TILE_SIZE = 40; // px
const POS_FACTOR = 16; // sub-tile positions

const PLAYER_SPRITE_POSITION = "-70px -70px";


const BEER = 'BEER'; 
const EGG = 'EGG'; 

const TILES = [
  { name: "floor", friction: 0, sprite: "-10px -10px", opaque: false },
  { name: "mud", friction: 0.5, sprite: "-70px -10px", opaque: false },
  { name: "bush", friction: 1, sprite: "-10px -70px", opaque: true }
];

const OBJECT_SPRITES = {
  beer: { className: "beer-bottle", background: "-130px -70px", width: "40px", height: "40px", zIndex: 2 },
  egg:  { className: "egg",         background: "-130px -10px", width: "40px", height: "40px", zIndex: 2 }
};

function generateMap(size) {
  const map = [];
  const objects = [];
  const openMin = Math.floor(size / 2) - 8;
  const openMax = Math.floor(size / 2) + 8;
  for (let y = 0; y < size; y++) {
    map[y] = [];
    for (let x = 0; x < size; x++) {
      // Only open a 5x5 area in the center; rest is wall
      if (x >= openMin && x <= openMax && y >= openMin && y <= openMax) {
        map[y][x] = 0; // floor
      } else {
        map[y][x] = 2; // wall
      }
    }
  }
  return map;
}

function placeBeerBottles(count, newMap = map, area = { xMin: 0, xMax: GRID_SIZE-1, yMin: 0, yMax: GRID_SIZE-1 } ) {
// function placeBeerBottles(count, newMap = map, area = { xMin: 8, xMax: 12, yMin: 8, yMax: 12 } ) {
  while (count--) {
    const x = area.xMin + Math.floor(Math.random() * (area.xMax - area.xMin + 1));
    const y = area.yMin + Math.floor(Math.random() * (area.yMax - area.yMin + 1));
    
    // don't fail if spot already used
    (placeObject("beer", x, y ));
  }
}

// --- Game States ---
// map is immutable and shared. 
// objects mutable shared.
const map = generateMap(GRID_SIZE);
console.log(map);

const objects = [];
placeBeerBottles(2);

const playerStates = [
  {
    map,
    player: { x: 10 * POS_FACTOR, y: 10 * POS_FACTOR },
    area: "player1-area",
    pockets: { beer: 0 }
  },
  {
    map,
    player: { x: 10 * POS_FACTOR, y: 10 * POS_FACTOR },
    area: "player2-area",
    pockets: { beer: 0 }
  }
];

// --- Controls Mapping ---
const controls = [
  // Player 1: A S W Z C V
  {
    "a": { dx: -1, dy:  0 },
    "s": { dx:  1, dy:  0 },
    "w": { dx:  0, dy: -1 },
    "z": { dx:  0, dy:  1 },
    "c": { drop: true },
    "v": { dx:  0, dy:  0 }
  },
  // Player 2: L ; P . M ,
  {
    "l": { dx: -1, dy:  0 },
    ";": { dx:  1, dy:  0 },
    "p": { dx:  0, dy: -1 },
    ".": { dx:  0, dy:  1 },
    "m": { drop: true },
    ",": { dx:  0, dy:  0 }
  }
];



function placeObject(type, x, y, force) {
  // Ensure not already taken
  const taken = objects.some(pos => pos.x === x && pos.y === y)
  if (!taken || force) {
      objects.push({ type, x, y });
      if (taken) {
        // TODO : remove existing object
      }        
      return true;
  }
  return false;
}

// --- Rendering Functions ---


function renderTile(mx, my, x, y, map) {
  const tileType = TILES[map[my][mx]];
  const tileDiv = document.createElement("div");
  tileDiv.className = "tile";
  tileDiv.style.backgroundPosition = tileType.sprite;
  tileDiv.title = `(${mx},${my}) :${tileType.name} friction: ${tileType.friction})`;
  tileDiv.style.gridRowStart = y + 12;
  tileDiv.style.gridColumnStart = x + 12;
  return tileDiv;
}

function renderObject(obj, gx, gy) {
  const spec = OBJECT_SPRITES[obj.type.toLowerCase()];
  const objDiv = document.createElement("div");
  objDiv.className = `object ${spec.className}`;
  objDiv.style.backgroundPosition = spec.background;
  objDiv.style.gridRowStart = gy;
  objDiv.style.gridColumnStart = gx;
  objDiv.style.zIndex = spec.zIndex;
  return objDiv;
}

function placeAndRenderObject(type, playerState, renderFn) {
  const px = Math.floor(playerState.player.x / POS_FACTOR);
  const py = Math.floor(playerState.player.y / POS_FACTOR);
  const placed = placeObject(type, px, py);
  if (placed) {
    renderFn(playerState.area, playerState);
  }
}


// Main render
function render(areaId, playerState) {
  const area = document.getElementById(areaId);
  area.innerHTML = "";

  const { map, player } = playerState;
  const px = Math.floor(player.x / POS_FACTOR);
  const py = Math.floor(player.y / POS_FACTOR);

  const grid = document.createElement("div");
  grid.className = "grid";

  // Render tiles
  for (let y = -11; y < 11; y++) {
    for (let x = -11; x < 11; x++) {
      const mx = px + x;
      const my = py + y;
      if (map[my] && map[my][mx] !== undefined) {
        grid.appendChild(renderTile(mx, my, x, y, map));
      }
    }
  }

  // Render objects
  for (const obj of objects) {
    const gx = obj.x - px + 12;
    const gy = obj.y - py + 12;
    if (
      gx >= 1 && gx <= 22 &&
      gy >= 1 && gy <= 22 &&
      OBJECT_SPRITES[obj.type.toLowerCase()]
    ) {
      grid.appendChild(renderObject(obj, gx, gy));
    }
  }

  // Render player sprite (centered)
  const playerDiv = document.createElement("div");
  playerDiv.style.backgroundPosition = PLAYER_SPRITE_POSITION;
  playerDiv.className = "player";
  playerDiv.style.gridRowStart = 12;
  playerDiv.style.gridColumnStart = 12;
  grid.appendChild(playerDiv);

  area.appendChild(grid);
}

// --- Initial Render ---
render(playerStates[0].area, playerStates[0]);
render(playerStates[1].area, playerStates[1]);

console.log(playerStates[0], playerStates[1]);
console.log(objects);



// --- Movement Logic ---
function movePlayer(playerState, dir, controlMap) {
  const move = controlMap[dir];
  if (!move) return false;

  let { dx, dy } = move;
  const { map, player } = playerState;

  const nx = Math.floor((player.x + dx * POS_FACTOR) / POS_FACTOR);
  const ny = Math.floor((player.y + dy * POS_FACTOR) / POS_FACTOR);

  if (!map[ny] || map[ny][nx] === undefined) return false;

  const friction = TILES[map[ny][nx]].friction;
  if (friction >= 1) return false; // impassable

  // Move by friction
  player.x += dx * POS_FACTOR * (1 - friction);
  player.y += dy * POS_FACTOR * (1 - friction);

  // --- Collision detection here ---
  const collisions = checkObjectCollision(player);

  
  const shouldRerender = collisions.filter(collision => {
    switch (collision.type.toLowerCase()) {
      case 'egg':
        console.log(`Bruce found an EGG at (${collision.x}, ${collision.y})!`);
        // Remove the egg from the objects array
        removeObject(collision);
        return true; // This collision requires rerender
      case 'beer':
        console.log(`Bruce picked up a BEER at (${collision.x}, ${collision.y})!`);
        // Handle beer logic here (e.g., increment inventory)
        removeObject(collision);
        return true; // This collision requires rerender
      default:
        console.log(`Bruce collided with ${collision.type} at (${collision.x}, ${collision.y})`);
        return false;
    }
  });

  shouldRerender.forEach (col => {console.log(col)});
  
  if (shouldRerender.length) {
    playerStates.forEach(playerState=> {
      render(playerState.area, playerState)
    });
  }
  return true;
}



function checkObjectCollision(player) {
  // Bruce's position in tile coordinates (can be fractional)
  const px = player.x / POS_FACTOR;
  const py = player.y / POS_FACTOR;

  const collisions = [];

  for (const obj of objects) {
    const dx = Math.max(0, 1 - Math.abs(obj.x + 0.499 - px));
    const dy = Math.max(0, 1 - Math.abs(obj.y + 0.499 - py));
    // If Bruce is 50% or more within the tile in both axes
    if (dx >= 0.5 && dy >= 0.5) {
      collisions.push(obj);
    }
  }
  return collisions;
}

function removeObject(toRemove) {
  console.log({objects}, {toRemove});
  
  const idx = objects.findIndex(
    obj => obj.x === toRemove.x && obj.y === toRemove.y && obj.type === toRemove.type
  );
  if (idx !== -1) objects.splice(idx, 1);
}

// --- Keyboard Event Listener ---
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  // Player 1
  if (controls[0][key]) {
    if (movePlayer(playerStates[0], key, controls[0])) {
      render(playerStates[0].area, playerStates[0]);
    } else if (controls[0][key].drop) {
      placeAndRenderObject("egg", playerStates[0], render);
    }
  }
  // Player 2
  if (controls[1][key]) {
    if (movePlayer(playerStates[1], key, controls[1])) {
      render(playerStates[1].area, playerStates[1]);
    } else if (controls[1][key].drop) {
      placeAndRenderObject("egg", playerStates[1], render);
    }
  }
});
