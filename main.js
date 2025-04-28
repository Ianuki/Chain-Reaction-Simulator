const NEUTRON_SIZE = 2.5;
const ATOM_SIZE = 12;
const WATER_CELL_SIZE = 40;

const lerp = (x, y, a) => x * (1 - a) + y * a;

let is_mouse_pressed = false;
let mouse_x = 0;
let mouse_y = 0;

let water_absorbed_atoms = 0;
let reactor_temperature = 0;
let generated_power = 0;

class neutron {
    constructor(x, y, direction, speed) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
    }

    move(speed) {
        if (speed === undefined) {
            this.x += Math.cos(this.direction * Math.PI / 180) * this.speed;
            this.y += Math.sin(this.direction * Math.PI / 180) * this.speed;
        }
        else {
            this.x += Math.cos(this.direction * Math.PI / 180) * speed;
            this.y += Math.sin(this.direction * Math.PI / 180) * speed;
        }
    }

    update() {
        this.move(undefined);
    }
}

class water {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.temperature = 0
    }

    update(neutron_list) {
        this.temperature -= 0.05;
        if (this.temperature < 0) { this.temperature = 0; }

        for (let neutron_index = 0; neutron_index < neutron_list.length; neutron_index++) {
            let neutron = neutron_list[neutron_index];
            if (neutron === undefined) { continue; }

            let x_collision = neutron.x + WATER_CELL_SIZE / 2 >= this.x && neutron.x <= this.x + WATER_CELL_SIZE / 2;
            let y_collision = neutron.y + WATER_CELL_SIZE / 2 >= this.y && neutron.y <= this.y + WATER_CELL_SIZE / 2;

            if (x_collision && y_collision) { 
                this.temperature += 0.2 ; 
                
                if (this.temperature < 100) {
                    if (Math.floor(Math.random() * 1000) == 0) {
                        neutron_list.splice(neutron_index, 1);
                        water_absorbed_atoms++;
                    }
                }
            }
        }
    }
}

class atom {
    constructor(x, y, neutrons) {
        this.x = x;
        this.y = y;
        this.neutrons = neutrons;
    }

    update(neutron_list) {
        let distance_from_mouse = Math.sqrt(
            ((this.x - mouse_x) ** 2) + ((this.y - mouse_y) ** 2)
        )

        if (
            is_mouse_pressed == true &&
            distance_from_mouse <= ATOM_SIZE
        ) {
            if (this.splitted == true || this.type == "other") {
                this.type = "uranium";
                this.splitted = false;
            }
        }

        if (this.type == "other") { return; }
        if (this.splitted) {
            return true;
        }

        for (let neutron_index = 0; neutron_index < neutron_list.length; neutron_index++) {
            let neutron = neutron_list[neutron_index];
            if (neutron === undefined) { continue; }

            let distance_from_atom = Math.sqrt(
                ((this.x - neutron.x) ** 2) + ((this.y - neutron.y) ** 2)
            )

            if (distance_from_atom <= ATOM_SIZE + NEUTRON_SIZE) {
                if (this.type == "uranium") {
                    this.split(neutron_list);
                    neutron_list.splice(neutron_index, 1);

                    break;
                }
                else if (this.type == "xenon") {
                    this.type = "uranium";
                    this.splitted = true;
                    this.regen_time = 500 * Math.random() + 500;
                    neutron_list.splice(neutron_index, 1);

                    break;
                }
            }
        }
    }

    split(neutron_list) {
        for (let neutron_index = 0; neutron_index < this.neutrons; neutron_index++) {
            let _neutron = new neutron(
                this.x,
                this.y,
                Math.random() * 360,
                1 + Math.floor(Math.random()),
            );

            _neutron.move(ATOM_SIZE + NEUTRON_SIZE);

            neutron_list[neutron_index + neutron_list.length] = _neutron;
        }

        if (Math.floor(Math.random() * 10) == 0) {
            this.type = "xenon";
        }
        else {
            this.type = "uranium"
            this.splitted = true;
        }
    }
} 

let neutrons = [];
let atoms = [];
let water_cells = [];

const BOARD = document.getElementById("board");
const START_BUTTON = document.getElementById("start-button");
const MENU = document.getElementById("menu");
const CONTEXT = BOARD.getContext("2d");
CONTEXT.font = "12px sans-serif";

let rows = (BOARD.width) / (WATER_CELL_SIZE);
let columns = (BOARD.height) / (WATER_CELL_SIZE);

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
        if ((i + 1) % 8 != 0) {
            let _atom = new atom(
                i * WATER_CELL_SIZE + WATER_CELL_SIZE / 2,
                j * WATER_CELL_SIZE + WATER_CELL_SIZE / 2,
                3
            )
            _atom.type = "other";

            atoms.push(_atom);
        }
    }
}

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
        water_cells.push(new water(
            i * WATER_CELL_SIZE + WATER_CELL_SIZE / 2,
            j * WATER_CELL_SIZE + WATER_CELL_SIZE / 2,
        ))
    }
}



const update_simulation = async () => {
    CONTEXT.clearRect(0, 0, BOARD.width, BOARD.height);

    let reactor_temperature = 0;
    for (let water_index = 0; water_index < water_cells.length; water_index++) {
        let water_cell = water_cells[water_index];
        if (water_cell === undefined) { continue; }
        water_cell.update(neutrons);

        reactor_temperature += water_cell.temperature / water_cells.length;
        document.getElementById("temperature").innerText = reactor_temperature;

        if (water_cell.temperature <= 100) {
            let color = "rgb({red}, {green}, {blue})"
            let blue = lerp(247, 77,  water_cell.temperature / 100);
            let green = lerp(255, 88,  water_cell.temperature / 100);
            let red = lerp(184, 255,  water_cell.temperature / 100);

            CONTEXT.fillStyle = color.replace("{red}", red).replace("{blue}", blue).replace("{green}", green);
        }
        else {
            CONTEXT.fillStyle = "white";
        }
        CONTEXT.fillRect(water_cell.x - WATER_CELL_SIZE / 2 + 1, water_cell.y - WATER_CELL_SIZE / 2 + 1, WATER_CELL_SIZE - 2, WATER_CELL_SIZE - 2);
    }
    console.log(reactor_temperature, water_cells.length);

    for (let atom_index = 0; atom_index < atoms.length; atom_index++) {
        let atom = atoms[atom_index];
        if (atom === undefined) { continue; }
        let atom_character = "U";

        atom.update(neutrons);

        CONTEXT.beginPath();
        CONTEXT.arc(atom.x, atom.y, ATOM_SIZE, 0, 2 * Math.PI, false);
        CONTEXT.fillStyle = "rgb(63, 153, 88)";
        if (atom.splitted == true || atom.type == "other") {CONTEXT.fillStyle = "grey"; atom_character = ""; }
        if (atom.type == "xenon") { CONTEXT.fillStyle = "rgb(147, 98, 217)"; atom_character = "X"; }
        CONTEXT.fill();
        CONTEXT.fillStyle = "rgb(255, 255, 255)";
        CONTEXT.fillText(atom_character, atom.x - 4, atom.y + 4);
    }

    for (let neutron_index = 0; neutron_index < neutrons.length; neutron_index++) {
        let neutron = neutrons[neutron_index];
        if (neutron === undefined) { continue; }
        neutron.update(neutrons);
        if (
            neutron.x > BOARD.width ||
            neutron.y > BOARD.height ||
            neutron.x < 0 ||
            neutron.y < 0
        ) {
            neutrons.splice(neutron_index, 1);
        }

        if (neutron.speed <= 0) { neutrons.splice(neutron_index, 1); }

        CONTEXT.beginPath();
        CONTEXT.arc(neutron.x, neutron.y, NEUTRON_SIZE, 0, 2 * Math.PI, false);
        CONTEXT.fillStyle = "rgb(46, 46, 46)";
        CONTEXT.fill();
    }

    requestAnimationFrame(update_simulation);
}

const SPLIT_BUTTON = document.getElementById("split");
const REPLACE_BUTTON = document.getElementById("replace-uranium");

REPLACE_BUTTON.addEventListener("click", () => {
    for (let i = 0; i < atoms.length; i++) {
        let atom = atoms[i];

        if (atom === undefined) { continue; }
        if (atom.type != "xanon") {
            atoms[i].type = "uranium";
            atoms[i].splitted = false;
        }
    }
})

SPLIT_BUTTON.addEventListener("click", () => {
    let uranium_atoms = [];
    for (let i = 0; i < atoms.length; i++) {
        let atom = atoms[i];

        if (atom === undefined) { continue; }
        if (atom.type == "uranium" && atom.splitted == false) {
            uranium_atoms.push(atom);
        }
    }

    let chosen_atom = uranium_atoms[Math.floor(Math.random() * (uranium_atoms.length - 1))];
    if (chosen_atom !== undefined) { chosen_atom.split(neutrons); }
})


function start_simulation() {
    MENU.remove();
    requestAnimationFrame(update_simulation);
}

document.addEventListener("mousemove", function(event) {
    let board_rectangle = BOARD.getBoundingClientRect();
    mouse_x = Math.floor(event.clientX - board_rectangle.x);
    mouse_y = Math.floor(event.clientY - board_rectangle.y);
});

document.addEventListener("mousemove", function(event) {
    let board_rectangle = BOARD.getBoundingClientRect();
    mouse_x = Math.floor(event.clientX - board_rectangle.x);
    mouse_y = Math.floor(event.clientY - board_rectangle.y);
});

window.onmousedown = () => {
    is_mouse_pressed = true;
  }
window.onmouseup = () => {
    is_mouse_pressed = false;
}  

START_BUTTON.addEventListener("click", () => {
    BOARD.style.display = "block";
    start_simulation();
})

