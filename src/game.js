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
    (placeObject("beer", x, y, objects));
  }
}


function placeObject(type, x, y, force) {
  // Ensure not already taken
  const taken = objects.some(pos => pos.x === x && pos.y === y)
  if (!taken || force) {
      objects.push({ type: "beer", x, y });
      if (taken) {
        // TODO : remove existing object
      }        
      return true;
  }
  return false;
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
    "c": { dx:  0, dy:  0 },
    "v": { dx:  0, dy:  0 }
  },
  // Player 2: ; ' [ / , .
  {
    "l": { dx: -1, dy:  0 },
    ";": { dx:  1, dy:  0 },
    "p": { dx:  0, dy: -1 },
    ".": { dx:  0, dy:  1 },
    "m": { dx:  0, dy:  0 },
    ",": { dx:  0, dy:  0 }
  }
];

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
  objDiv.style.gridRowStart = gy;
  objDiv.style.gridColumnStart = gx;
  objDiv.style.zIndex = spec.zIndex;
  return objDiv;
}

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

  // Player sprite (centered)
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

  console.log(player);
  
  return true;
}

// --- Keyboard Event Listener ---
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  // Player 1
  if (controls[0][key]) {
    if (movePlayer(playerStates[0], key, controls[0])) {
      render(playerStates[0].area, playerStates[0]);
    }
  }
  // Player 2
  if (controls[1][key]) {
    if (movePlayer(playerStates[1], key, controls[1])) {
      render(playerStates[1].area, playerStates[1]);
    }
  }
});
