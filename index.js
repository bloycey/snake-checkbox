const STARTING_LOOP_SPEED = 125;
let windowResized = false;
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

const chompSound = new Audio("./assets/chomp-mp3.mp3");
const dieSound = new Audio("./assets/die.mp3");

window.addEventListener('DOMContentLoaded', (event) => {
	loadAllContent();
})

const resizedw = () => {
	windowResized = false;
}
let doit;

window.addEventListener('resize', (event) => {
	windowResized = true;
	clearTimeout(doit);
	doit = setTimeout(resizedw, 100);
	loadAllContent();
})

const loadAllContent = () => {
	document.querySelector('.about-decoration-inner').innerHTML = "";
	loadCheckboxes()
		.then(() => {
			if (window.innerWidth >= 1024) {
				loadMatter();
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
}

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
	document.querySelector('.test').innerHTML = "";

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
		case "KeyW":
			e.preventDefault();
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "down") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "up"
			break;
		case "KeyD":
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "left") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "right"
			break;
		case "KeyS":
			e.preventDefault();
			if (GAME_DATA.snake.length > 1 && GAME_DATA.direction === "up") {
				return;
			}
			fadeOutKeys()
			GAME_DATA.direction = "down"
			break;
		case "KeyA":
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
				dieSound.play();
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
		chompSound.play();
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
				return 56;
			}
			if (GAME_DATA.snake.length > 50) {
				return 52;
			}
			if (GAME_DATA.snake.length > 60) {
				return 48;
			}
			if (GAME_DATA.snake.length > 70) {
				return 45;
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
	let up_left_to;
	let up_up_to;
	let left_down_to;
	let left_left_to;
	let down_right_to;
	let down_down_to;
	let right_up_to;
	let right_right_to;
	const delay = 5;
	const up = (startingNode) => {
		const clear = () => {
			clearInterval(up_left_to);
			clearInterval(up_up_to);
			clearInterval(left_down_to);
			clearInterval(left_left_to);
			clearInterval(down_right_to);
			clearInterval(down_down_to);
			clearInterval(right_up_to);
			clearInterval(right_right_to);
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
		}

		if (windowResized) {
			clear();
			return;
		}
		startingNode.checked = true;
		const upNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) - 1);
		const leftNode = getCheckByCoords(parseInt(startingNode.dataset.x) - 1, startingNode.dataset.y);

		if (checkNode(leftNode)) {
			up_left_to = setTimeout(() => {
				left(leftNode)
			}, delay)
		} else if (checkNode(upNode)) {
			up_up_to = setTimeout(() => {
				up(upNode)
			}, delay)
		} else {
			clear();
			return;
		}
	}

	const left = (startingNode) => {
		if (windowResized) {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
		startingNode.checked = true;
		const leftNode = getCheckByCoords(parseInt(startingNode.dataset.x) - 1, startingNode.dataset.y);
		const downNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) + 1);

		if (checkNode(downNode)) {
			left_down_to = setTimeout(() => {
				down(downNode)
			}, delay)
		} else if (checkNode(leftNode)) {
			left_left_to = setTimeout(() => {
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
		if (windowResized) {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
		startingNode.checked = true;
		const downNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) + 1);
		const rightNode = getCheckByCoords(parseInt(startingNode.dataset.x) + 1, startingNode.dataset.y);

		if (checkNode(rightNode)) {
			down_right_to = setTimeout(() => {
				right(rightNode)
			}, delay)
		} else if (checkNode(downNode)) {
			down_down_to = setTimeout(() => {
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
		if (windowResized) {
			document.querySelectorAll(".game-wrapper input[type='checkbox']").forEach(checkbox => {
				checkbox.checked = false;
			})
			return;
		}
		startingNode.checked = true;
		const rightNode = getCheckByCoords(parseInt(startingNode.dataset.x) + 1, startingNode.dataset.y);
		const upNode = getCheckByCoords(startingNode.dataset.x, parseInt(startingNode.dataset.y) - 1);

		if (checkNode(upNode)) {
			right_up_to = setTimeout(() => {
				up(upNode)
			}, delay)
		} else if (checkNode(rightNode)) {
			right_right_to = setTimeout(() => {
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
	let topVisible = coords.top > 0 && coords.top < windowHeight;
	let bottomVisible = coords.bottom < windowHeight && coords.bottom > 0;
	return topVisible || bottomVisible;
}

// MATTER JS

const loadMatter = () => {
	const { Engine, Render, Bodies, Runner, World, Mouse, MouseConstraint, Composite, Composites, Common } = Matter;
	Matter.use('matter-wrap');

	const matterWrapper = document.querySelector(".about-decoration-inner");

	const engine = Engine.create({
		gravity: {
			x: 0.05,
			y: 0.05,
		}
	});
	const height = document.querySelector(".about-text").clientHeight;
	const width = document.querySelector(".about-decoration").clientWidth;
	const world = engine.world;
	// create a renderer
	const render = Render.create({
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

	Render.run(render);

	// create runner
	const runner = Runner.create();
	Runner.run(runner, engine);

	// add bodies
	Composite.add(world, [
		Bodies.circle(width / 2, height / 2, 75, {
			isStatic: true, render: {
				fillStyle: "#ffc31d"
			}
		})
	]);

	const stack = Composites.stack(0, 0, width / 13, 12, 8, 0, (x, y) => {
		return Bodies.rectangle(x, y, 13, 13, {
			angularVelocity: Math.random() * 100,
			angularSpeed: Math.random() * 100,
			angle: Math.random() * 360,
			restitution: 0.6,
			friction: 0.5,
			render: {
				sprite: {
					texture: "./assets/checkbox-100.png",
					xScale: 0.13,
					yScale: 0.13
				}
			}
		})
	});

	Composite.add(world, [
		stack,
		Bodies.rectangle(width / 3, height / 2, 50, 50, {
			density: 0.01,
			friction: 0.1,
			render: {
				sprite: {
					texture: "./assets/checkbox-100.png",
					xScale: 0.5,
					yScale: 0.5
				}
			}
		}),
		Bodies.rectangle(width, 0, 50, 50, {
			density: 0.01,
			friction: 0.1,
			render: {
				sprite: {
					texture: "./assets/checkbox-100.png",
					xScale: 0.5,
					yScale: 0.5
				}
			}
		}),
		Bodies.rectangle(width / 2, height / 2, 75, 75, {
			density: 0.01,
			friction: 0.1,
			render: {
				sprite: {
					texture: "./assets/checkbox-100.png",
					xScale: 0.75,
					yScale: 0.75
				}
			}
		})
	]);

	// add mouse control
	const mouse = Mouse.create(render.canvas),
		mouseConstraint = MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				stiffness: 0.2,
				render: {
					visible: false
				}
			}
		});

	mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
	mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);

	Composite.add(world, mouseConstraint);

	// keep the mouse in sync with rendering
	render.mouse = mouse;

	// wrapping using matter-wrap plugin
	let allBodies = Composite.allBodies(world);

	for (let i = 0; i < allBodies.length; i += 1) {
		allBodies[i].plugin.wrap = {
			min: { x: render.bounds.min.x - 100, y: render.bounds.min.y },
			max: { x: render.bounds.max.x + 100, y: render.bounds.max.y }
		};
	}
}
