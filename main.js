const NEUTRON_SIZE = 5;
const ATOM_SIZE = 10;

class neutron {
    constructor(x, y, direction, speed) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
    }

    move() {
        this.x += Math.cos(this.direction * Math.PI / 180) * this.speed;
        this.y += Math.sin(this.direction * Math.PI / 180) * this.speed;
    }

    update(neutron_list) {
        this.move();
    }
}

class atom {
    constructor(x, y, neutrons) {
        this.x = x;
        this.y = y;
        this.neutrons = neutrons;
    }

    update(neutron_list) {
        if (this.splitted) {
            this.regen_time -= 1;

            if (this.regen_time <= 0) {
                this.splitted = false;
            }

            return true;
        }

        for (let neutron_index = 0; neutron_index < neutron_list.length; neutron_index++) {
            let neutron = neutron_list[neutron_index];
            if (neutron === undefined) { continue; }

            let distance_from_atom = Math.sqrt(
                ((this.x - neutron.x) ** 2) + ((this.y - neutron.y) ** 2)
            )

            if (distance_from_atom <= ATOM_SIZE + NEUTRON_SIZE) {
                this.split(neutron_list);
                neutron_list.splice(neutron_index, 1);

                break;
            }
        }
    }

    split(neutron_list) {
        for (let neutron_index = 0; neutron_index < this.neutrons; neutron_index++) {
            let _neutron = new neutron(
                this.x,
                this.y,
                Math.random() * 360,
                1.5
            );

            neutron_list[neutron_index + neutron_list.length] = _neutron;

            this.splitted = true;
            this.regen_time = 600;
        }
    }
} 

let neutrons = [
    new neutron(
        200,
        300,
        0,
        1
    )
];

let atoms = [];

for (let i = 0; i < 40; i++) {
    for (let j = 0; j < 30; j++) {
        if (Math.floor(Math.random() * 2) == 0) {
            atoms[atoms.length + i] = new atom(
                i * 20 + ATOM_SIZE,
                j * 20 + ATOM_SIZE,
                2
            )
        }
    }
}

const BOARD = document.getElementById("board");
const START_BUTTON = document.getElementById("start-button");
const MENU = document.getElementById("menu");
const CONTEXT = BOARD.getContext("2d");

const update_simulation = async () => {
    CONTEXT.clearRect(0, 0, BOARD.width, BOARD.height);

    for (let atom_index = 0; atom_index < atoms.length; atom_index++) {
        let atom = atoms[atom_index];
        if (atom === undefined) { continue; }

        CONTEXT.beginPath();
        CONTEXT.arc(atom.x, atom.y, ATOM_SIZE, 0, 2 * Math.PI, false);
        CONTEXT.fillStyle = "green";
        if (atom.splitted == true) {CONTEXT.fillStyle = "grey"; }
        CONTEXT.fill();

        atom.update(neutrons);
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
            console.log(neutrons.length)
        }

        CONTEXT.beginPath();
        CONTEXT.arc(neutron.x, neutron.y, NEUTRON_SIZE, 0, 2 * Math.PI, false);
        CONTEXT.fillStyle = "blue";
        CONTEXT.fill();
    }

    requestAnimationFrame(update_simulation);
}


function start_simulation() {
    MENU.remove();
    requestAnimationFrame(update_simulation);
}

START_BUTTON.addEventListener("click", () => {
    start_simulation();
})

