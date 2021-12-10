const GAME_DATA = {
	gameLoopInterval: null,
	loopSpeed: 500,
	gridGap: 2,
	checkboxWidth: 0,
	checkboxHeight: 0,
	checkboxesPerRow: 0,
	checkboxesPerCol: 0,
	direction: null,
	snake: [] //Array of DOM Nodes
}

window.addEventListener('DOMContentLoaded', (event) => {
	loadCheckboxes()
		.then(() => {
			setStartingCheck();
			document.addEventListener('keydown', keyWatcher);
			if (!GAME_DATA.gameLoopInterval) {
				GAME_DATA.gameLoopInterval = setInterval(gameLoop, GAME_DATA.loopSpeed)
			}
		})
});


const loadCheckboxes = async () => new Promise((resolve, reject) => {
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;

	document.querySelector(".checkbox-wrapper").innerHTML = `
	<input type="checkbox" checked>
	`
	const initialCheckbox = document.querySelector("input[type='checkbox']");
	GAME_DATA.checkboxWidth = initialCheckbox.clientWidth + GAME_DATA.gridGap;
	GAME_DATA.checkboxHeight = initialCheckbox.clientHeight + GAME_DATA.gridGap;

	GAME_DATA.checkboxesPerRow = Math.floor(screenWidth / GAME_DATA.checkboxWidth);
	GAME_DATA.checkboxesPerCol = Math.floor(screenHeight / GAME_DATA.checkboxHeight);

	const createCheckbox = (rowIndex, colIndex, isChecked) => {
		let checkbox = document.createElement("input")
		checkbox.setAttribute("type", "checkbox");
		checkbox.dataset.x = colIndex;
		checkbox.dataset.y = rowIndex;
		checkbox.checked = isChecked;
		checkbox.id = `${colIndex}-${rowIndex}`;
		return checkbox;
	}

	document.querySelector(".checkbox-wrapper").innerHTML = "";
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

const keyWatcher = (e) => {
	switch (e.code) {
		case "ArrowUp":
			GAME_DATA.direction = "up"
			break;
		case "ArrowRight":
			GAME_DATA.direction = "right"
			break;
		case "ArrowDown":
			GAME_DATA.direction = "down"
			break;
		case "ArrowLeft":
			GAME_DATA.direction = "left"
	}
}

const moveSnake = (direction) => {
	if (!direction) {
		return;
	}

	const simpleMove = (direction) => {
		GAME_DATA.snake[0].checked = false;
		const oldSnake = {
			x: GAME_DATA.snake[0].dataset.x,
			y: GAME_DATA.snake[0].dataset.y
		}
		let newSnakeHead;
		switch (direction) {
			case "up":
				newSnakeHead = document.getElementById(`${oldSnake.x}-${parseInt(oldSnake.y) - 1}`);
				break;
			case "down":
				newSnakeHead = document.getElementById(`${oldSnake.x}-${parseInt(oldSnake.y) + 1}`);
				break;
			case "left":
				newSnakeHead = document.getElementById(`${parseInt(oldSnake.x) - 1}-${oldSnake.y}`);
				break;
			case "right":
				newSnakeHead = document.getElementById(`${parseInt(oldSnake.x) + 1}-${oldSnake.y}`)
		}
		if (!newSnakeHead || newSnakeHead.checked === true) {
			// HIT THE EDGE or Own snake
			// STOP THE LOOP!
			console.log("Hit the edge or own snake!");
			clearInterval(GAME_DATA.gameLoopInterval);
			return;
		}
		newSnakeHead.checked = true;
		GAME_DATA.snake = [newSnakeHead]
	}

	switch (direction) {
		case "up":
			simpleMove("up");
			break;
		case "down":
			simpleMove("down");
			break;
		case "right":
			simpleMove("right");
			break;
		case "left":
			simpleMove("left")
	}
}

const gameLoop = () => {
	moveSnake(GAME_DATA.direction)
}
