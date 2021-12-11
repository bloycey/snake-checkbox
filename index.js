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

window.addEventListener('DOMContentLoaded', (event) => {
	loadCheckboxes()
		.then(() => {
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
		})
});


const loadCheckboxes = async () => new Promise((resolve, reject) => {
	const createCheckbox = (rowIndex, colIndex, isChecked) => {
		let checkbox = document.createElement("input")
		checkbox.setAttribute("type", "checkbox");
		checkbox.dataset.x = colIndex;
		checkbox.dataset.y = rowIndex;
		checkbox.checked = isChecked;
		checkbox.id = `${colIndex}-${rowIndex}`;
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
				document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
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
	const potentialSnackSpots = document.querySelectorAll("input[type='checkbox']:not(:checked)");
	const randomSnack = potentialSnackSpots[Math.floor(Math.random() * potentialSnackSpots.length)];
	randomSnack.checked = true;
	randomSnack.classList.add("snack");
	GAME_DATA.snack = randomSnack;
}

const gameLoop = () => {
	moveSnake(GAME_DATA.direction);
}
