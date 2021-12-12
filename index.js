const STARTING_LOOP_SPEED = 125;
const GAME_DATA = {
	gameLoopInterval: null,
	loopSpeed: STARTING_LOOP_SPEED,
	gridGap: 2,
	checkboxWidth: 0,
	checkboxHeight: 0,
	checkboxesPerRow: 0,
	checkboxesPerCol: 0,
	direction: null,
	snake: [], //Array of DOM Nodes,
	snack: null,
	score: 0,
	onStartScreen: true,
	bestScore: 0
}

// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
	let vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
});

window.addEventListener('DOMContentLoaded', (event) => {
	loadCheckboxes()
		.then(() => {
			if (window.innerWidth >= 1024) {
				setStartingCheck();
				setSnack();
				const bestScore = localStorage.getItem("bestScore");
				if (bestScore) {
					GAME_DATA.bestScore = bestScore;
					document.querySelector(".best-score").innerHTML = bestScore;
				}
				document.addEventListener('keydown', keyWatcher);
				if (!GAME_DATA.gameLoopInterval) {
					GAME_DATA.gameLoopInterval = setInterval(gameLoop, GAME_DATA.loopSpeed)
				}
			} else {
				document.querySelectorAll(".game-wrapper input").forEach(input => {
					input.addEventListener("change", (e) => {
						spiral(e.target);
					})
				})
			}
		})
})

const loadCheckboxes = async () => new Promise((resolve, reject) => {
	const createCheckbox = (rowIndex, colIndex, isChecked) => {
		let checkbox = document.createElement("input")
		checkbox.setAttribute("type", "checkbox");
		checkbox.dataset.x = colIndex;
		checkbox.dataset.y = rowIndex;
		checkbox.checked = isChecked;
		checkbox.id = `${colIndex}-${rowIndex}`;
		if (window.innerWidth <= 1024) {
			checkbox.style.accentColor = `hsl(${colIndex * 360 / GAME_DATA.checkboxesPerCol}, 100%, 50%)`
		}
		return checkbox;
	}

	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;

	const checkboxWrapper = document.querySelector(".checkbox-wrapper");
	const testWrapper = document.querySelector(".test")
	testWrapper.appendChild(createCheckbox(0, 0, false));

	const initialCheckbox = document.querySelector("input[type='checkbox']");

	GAME_DATA.checkboxHeight = initialCheckbox.offsetHeight + GAME_DATA.gridGap;

	GAME_DATA.checkboxesPerRow = Math.floor(checkboxWrapper.clientWidth / GAME_DATA.checkboxHeight);
	GAME_DATA.checkboxesPerCol = Math.floor(checkboxWrapper.clientHeight / GAME_DATA.checkboxHeight);

	checkboxWrapper.style.gridTemplateColumns = `repeat(${GAME_DATA.checkboxesPerRow}, 1fr)`
	checkboxWrapper.style.gridTemplateRows = `repeat(${GAME_DATA.checkboxesPerCol}, 1fr)`

	document.querySelector(".checkbox-wrapper").innerHTML = "";
	document.querySelector(".test").remove();
	Array(GAME_DATA.checkboxesPerCol).fill().forEach((checkbox, rowIndex) => {
		Array(GAME_DATA.checkboxesPerRow).fill().forEach((checkbox, colIndex) => {
			const newCheckbox = createCheckbox(rowIndex, colIndex, false)
			document.querySelector(".checkbox-wrapper").appendChild(newCheckbox);
			if (colIndex + 1 === GAME_DATA.checkboxesPerRow && rowIndex + 1 === GAME_DATA.checkboxesPerCol) {
				resolve()
			}
		})
	})
})

const getCheckByCoords = (x, y) => document.getElementById(`${x}-${y}`);

const setStartingCheck = () => {
	const startingX = Math.floor(GAME_DATA.checkboxesPerRow / 2);
	const startingY = Math.floor(GAME_DATA.checkboxesPerCol / 2);
	const startingCheck = getCheckByCoords(startingX, startingY);
	startingCheck.checked = true;

	GAME_DATA.snake = [startingCheck]
}

const fadeOutKeys = () => {
	if (GAME_DATA.onStartScreen) {
		document.querySelector(".arrow-img").classList.add("no-opacity");
		GAME_DATA.onStartScreen = false;
	}
}

const keyWatcher = (e) => {
	switch (e.code) {
		case "ArrowUp":
			e.preventDefault();
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "down") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "up"
			break;
		case "ArrowRight":
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "left") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "right"
			break;
		case "ArrowDown":
			e.preventDefault();
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "up") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "down"
			break;
		case "ArrowLeft":
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "right") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "left"
	}
}

const moveSnake = (direction) => {
	if (!direction) {
		return;
	}

	const oldPositions = [...GAME_DATA.snake];
	let snackEaten = false;
	const newPositions = GAME_DATA.snake.forEach((snakePosition, index) => {
		if (index === 0) {
			snakePosition.checked = false;
			const snakePositionOld = {
				x: snakePosition.dataset.x,
				y: snakePosition.dataset.y
			}
			let newSnakeHead;
			switch (direction) {
				case "up":
					newSnakeHead = getCheckByCoords(snakePositionOld.x, parseInt(snakePositionOld.y) - 1)
					break;
				case "down":
					newSnakeHead = getCheckByCoords(snakePositionOld.x, parseInt(snakePositionOld.y) + 1)
					break;
				case "left":
					newSnakeHead = getCheckByCoords(parseInt(snakePositionOld.x) - 1, snakePositionOld.y)
					break;
				case "right":
					newSnakeHead = getCheckByCoords(parseInt(snakePositionOld.x) + 1, snakePositionOld.y)
			}
			// If hit the edge OR hit the snake
			if (!newSnakeHead || (newSnakeHead.checked === true && (!newSnakeHead.classList.contains("snack")))) {
				clearInterval(GAME_DATA.gameLoopInterval);
				document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
					checkbox.classList.remove("snack");
					checkbox.checked = false;
				})

				if (GAME_DATA.score > GAME_DATA.bestScore) {
					GAME_DATA.bestScore = GAME_DATA.score;
					localStorage.setItem("bestScore", GAME_DATA.score);
					document.querySelector(".best-score").innerHTML = GAME_DATA.score;
				}

				GAME_DATA.score = 0;
				document.querySelector(".score").innerHTML = GAME_DATA.score;
				GAME_DATA.loopSpeed = STARTING_LOOP_SPEED;
				GAME_DATA.direction = null;
				GAME_DATA.snake = [];

				setStartingCheck();
				setSnack();
				document.querySelector(".arrow-img").classList.remove("no-opacity");
				GAME_DATA.onStartScreen = true;
				GAME_DATA.gameLoopInterval = setInterval(gameLoop, GAME_DATA.loopSpeed);
				return;
			}

			if (newSnakeHead.classList.contains("snack")) {
				newSnakeHead.classList.remove("snack")
				snackEaten = true;
			}
			newSnakeHead.checked = true;
			GAME_DATA.snake[index] = newSnakeHead;
		}
		if (index !== 0) {
			GAME_DATA.snake[index].checked = false;
			GAME_DATA.snake[index] = oldPositions[index - 1];
			GAME_DATA.snake[index].checked = true;
		}
	})

	if (snackEaten) {
		// Snake grows
		const snakeGrowth = oldPositions[oldPositions.length - 1];
		snakeGrowth.checked = true;
		GAME_DATA.snake = [...GAME_DATA.snake, snakeGrowth];

		// Increment score
		GAME_DATA.score++;
		document.querySelector(".score").innerHTML = GAME_DATA.score;

		// Set new snack
		setSnack();

		// Make it a lil faster
		const determineNewLoopSpeed = () => {
			if (GAME_DATA.snake.length > 10) {
				return 100;
			}
			if (GAME_DATA.snake.length > 15) {
				return 75;
			}
			if (GAME_DATA.snake.length > 25) {
				return 65;
			}
			if (GAME_DATA.snake.length > 30) {
				return 60;
			}
			if (GAME_DATA.snake.length > 40) {
				return 58;
			}
			if (GAME_DATA.snake.length > 50) {
				return 56;
			}
			if (GAME_DATA.snake.length > 60) {
				return 54;
			}
			if (GAME_DATA.snake.length > 70) {
				return 52;
			}
			return GAME_DATA.loopSpeed;
		}

		const newLoopSpeed = determineNewLoopSpeed();
		if (newLoopSpeed !== GAME_DATA.loopSpeed) {
			GAME_DATA.loopSpeed = newLoopSpeed;
			clearInterval(GAME_DATA.gameLoopInterval);
			GAME_DATA.gameLoopInterval = setInterval(gameLoop, GAME_DATA.loopSpeed);
		}
	}
}

const setSnack = () => {
	const potentialSnackSpots = document.querySelectorAll(".game-wrapper input[type='checkbox']:not(:checked)");
	const randomSnack = potentialSnackSpots[Math.floor(Math.random() * potentialSnackSpots.length)];
	randomSnack.checked = true;
	randomSnack.classList.add("snack");
	GAME_DATA.snack = randomSnack;
}

const spiral = (firstNode) => {
	const delay = 5;
	const up = (startingNode) => {
		startingNode.checked = true;
		const upNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) - 1);
		const leftNode = getCheckByCoords(parseInt(startingNode.dataset.x) - 1, startingNode.dataset.y);

		if (checkNode(leftNode)) {
			setTimeout(() => {
				left(leftNode)
			}, delay)
		} else if (checkNode(upNode)) {
			setTimeout(() => {
				up(upNode)
			}, delay)
		} else {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
	}

	const left = (startingNode) => {
		startingNode.checked = true;
		const leftNode = getCheckByCoords(parseInt(startingNode.dataset.x) - 1, startingNode.dataset.y);
		const downNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) + 1);

		if (checkNode(downNode)) {
			setTimeout(() => {
				down(downNode)
			}, delay)
		} else if (checkNode(leftNode)) {
			setTimeout(() => {
				left(leftNode)
			}, delay)
		} else {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
	}

	const down = (startingNode) => {
		startingNode.checked = true;
		const downNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) + 1);
		const rightNode = getCheckByCoords(parseInt(startingNode.dataset.x) + 1, startingNode.dataset.y);

		if (checkNode(rightNode)) {
			setTimeout(() => {
				right(rightNode)
			}, delay)
		} else if (checkNode(downNode)) {
			setTimeout(() => {
				down(downNode)
			}, delay)
		} else {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
	}

	const right = (startingNode) => {
		startingNode.checked = true;
		const rightNode = getCheckByCoords(parseInt(startingNode.dataset.x) + 1, startingNode.dataset.y);
		const upNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) - 1);

		if (checkNode(upNode)) {
			setTimeout(() => {
				up(upNode)
			}, delay)
		} else if (checkNode(rightNode)) {
			setTimeout(() => {
				right(rightNode)
			}, delay)
		} else {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
	}

	const checkNode = (checkNode) => {
		if (!checkNode) {
			return false
		}
		if (checkNode.checked) {
			return false
		}
		return true;
	}

	up(firstNode);
}

const gameLoop = () => {
	moveSnake(GAME_DATA.direction);
}


const isVisible = (elem) => {
	let coords = elem.getBoundingClientRect();
	let windowHeight = document.documentElement.clientHeight;
	// top elem edge is visible?
	let topVisible = coords.top > 0 && coords.top < windowHeight;
	// bottom elem edge is visible?
	let bottomVisible = coords.bottom < windowHeight && coords.bottom > 0;
	return topVisible || bottomVisible;
}

// MATTER JS

const { Engine, Render, Bodies, Runner, World, MouseConstraint, Composites } = Matter;
const matterWrapper = document.querySelector(".decorative-checkboxes");
// create an engine
const engine = Engine.create();
const height = document.querySelector(".about-me").clientHeight;
const width = document.querySelector(".about-decoration").clientWidth;

// create a renderer
const renderer = Render.create({
	element: matterWrapper,
	engine,
	options: {
		background: "#ffffff",
		wireframes: false,
		height,
		width,
		pixelRatio: window.devicePixelRatio
	}
});

const createShape = (x, y) => {
	return Bodies.circle(x, y, 20 + 20 * Math.random(), {
		restitution: 0.6,
		friction: 0.1,
		render: {
			fillStyle: "red"
		}
	});
}

const wallOptions = {
	isStatic: true,
	render: {
		visible: false
	}
}

const ground = Bodies.rectangle(width / 2, height, width, 1, wallOptions);
const ceiling = Bodies.rectangle(width / 2, 0, width, 1, wallOptions);
const leftWall = Bodies.rectangle(0, height / 2, 1, height, wallOptions);
const rightWall = Bodies.rectangle(width, height / 2, 1, height, wallOptions);

console.log(MouseConstraint);


const mouseControl = MouseConstraint.create(engine, {
	element: matterWrapper,
	constraint: {
		stiffness: 0.2,
		render: {
			visible: false
		}
	}
})

const initialShapes = Composites.stack(50, 50, 15, 5, 40, 40, (x, y) => {
	return createShape(x, y)
})
let INITIAL_SHAPES_ADDED = false;

World.add(engine.world, [ground, ceiling, leftWall, rightWall, mouseControl]);
mouseControl.mouse.element.removeEventListener("mousewheel", mouseControl.mouse.mousewheel);
mouseControl.mouse.element.removeEventListener("DOMMouseScroll", mouseControl.mouse.mousewheel);
window.addEventListener("scroll", () => {
	if (!INITIAL_SHAPES_ADDED && isVisible(matterWrapper)) {
		World.add(engine.world, initialShapes);
		INITIAL_SHAPES_ADDED = true;
	}
})

matterWrapper.addEventListener("click", (event) => {
	const shape = createShape(event.layerX, event.layerY);
	World.add(engine.world, shape);
})

Runner.run(engine);
Render.run(renderer);

