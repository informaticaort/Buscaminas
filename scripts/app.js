
function init() {
  //* Variables
  const grid = document.querySelector('.grid') //Selecting the div
  const audio = document.querySelector('#audio') //Selecting the audio
  const resetBtn = document.querySelector('.face-button') //Selecting reset button
  const flagsMonitor = document.querySelector('#flags-monitor') //Selecting flag monitor
  const timerMonitor = document.querySelector('#timer-monitor')// Selecting timer monitor
  const newGame = document.querySelector('.new-game')
  const levels = document.querySelectorAll('.content')
  const gameWrapper = document.querySelector('.game-wrapper')

  //*Testing with easy level
  let width = 9
  let height = 9
  let cellCount = width * height
  let nBombs = 10
  let nFlags = nBombs
  flagsMonitor.innerHTML = nFlags
  let cellsStatusInfo = []
  let firstClick = true
  let timerId = null
  let cellsOpened = 0

  //* Creating a Class to produce Object where I store info about the cell (if there is a bomb? or covered? etc)

  class CellInfo {
    constructor(idCell, cell, column, row, isCovered, haveBomb, haveFlag, nBombsClose) {
      this.idCell = idCell           //same as i in createGrid
      this.cell = cell                //this store the div in the system
      this.column = column            //this track the column
      this.row = row                    // this track the row
      this.isCovered = isCovered            //t||f
      this.haveBomb = haveBomb             //t||f
      this.haveFlag = haveFlag            //t||f
      this.nBombsClose = nBombsClose      //this will count the n of bombs around

    }
  }

  //* Functions

  function changeLevel(event) {        //this function change the UI and the logic of the game for every level
    if (event === null) {
      return
    } else if (event.target.innerHTML === 'Intermedio') {
      width = 16
      height = 16
      cellCount = width * height
      nBombs = 40
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(16, 1fr)'
      grid.style.gridTemplateRows = 'repeat(16, 1fr)'
      grid.style.width = '300px'
      gameWrapper.style.width = '300px'
      reset()
    } else if (event.target.innerHTML === 'Avanzado') {
      width = 30
      height = 16
      cellCount = width * height
      nBombs = 99
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(30, 1fr)'
      grid.style.gridTemplateRows = 'repeat(16, 1fr)'
      grid.style.width = '600px'
      gameWrapper.style.width = '600px'
      reset()
    } else {
      width = 9
      height = 9
      cellCount = width * height
      nBombs = 10
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(9, 1fr)'
      grid.style.gridTemplateRows = 'repeat(9, 1fr)'
      grid.style.width = '300px'
      gameWrapper.style.width = '300px'
      reset()
    }

  }

  function createGrid() {                   //This function create the cells in the grid with status of covered
    changeLevel(null)
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('div')
      cell.dataset.id = i
      cell.classList.add('covered')
      cell.setAttribute('draggable', false)
      grid.appendChild(cell)
      const column = i % width
      const row = Math.floor(i / width)
      cellsStatusInfo.push(new CellInfo(i, cell, column, row, true, false, false, 0))
    }
  }

  function revealCellsAround(index) {         //To open the cells that are around one
    const cellsAround = whoIsCloseToMe(parseInt(index))
    for (let i = 0; i < cellsAround.length; i++) {
      if (cellsStatusInfo[cellsAround[i]].isCovered === true) {
        uncoverCell(cellsAround[i])
      }

    }
  }

  function uncoverCell(selected) {  //This function change the class of the clicked cell from covered to uncovered
    if (cellsStatusInfo[selected].haveFlag === true) {
      return
    }
      
    cellsStatusInfo[selected].isCovered = false
    cellsStatusInfo[selected].cell.classList.remove('covered')
    //deshabilitado del evento que vuelve a tapar la celda
    cellsStatusInfo[selected].cell.classList.add('disabled')
    if (firstClick === true) {

      timerStart()
      firstClick = false
      while (cellsStatusInfo[selected].haveBomb === true || cellsStatusInfo[selected].nBombsClose !== 0) {
        removeAllBombs()
        randomBombPosition()
      }


    }
    if (cellsStatusInfo[selected].nBombsClose === 0) {
      revealCellsAround(selected)
    }
    cellsOpened++
  }

  function removeAllBombs() {            // This function removes all the bombs
    for (let i = 0; i < cellCount; i++) {
      cellsStatusInfo[i].nBombsClose = 0
      if (cellsStatusInfo[i].haveBomb === true) {
        cellsStatusInfo[i].haveBomb = false
        cellsStatusInfo[i].cell.classList.remove('bomb')
      }
    }

  }

  function randomBombPosition() {      //This function allocate randomly the bombs in the field
    let bombsPlaced = 0
    while (bombsPlaced < nBombs) {
      const randomIndex = Math.floor(Math.random() * cellCount)
      if (cellsStatusInfo[randomIndex].haveBomb === false) {
        cellsStatusInfo[randomIndex].haveBomb = true
        cellsStatusInfo[randomIndex].cell.classList.add('bomb')
        bombsCloseToMe(randomIndex)
        bombsPlaced++
      }
    }
  }


  function bombsCloseToMe(indexOfTheBomb) { // this function find how many bombs are close to every cell
    const nearby = whoIsCloseToMe(indexOfTheBomb)
    for (let i = 0; i < nearby.length; i++) {
      cellsStatusInfo[nearby[i]].nBombsClose++
    }

  }

  function whoIsCloseToMe(index) {         // this function returns an array of cell close to the given index
    const column = cellsStatusInfo[index].column    //these return me the column 
    const row = cellsStatusInfo[index].row        //these return me the row 
    let cellDistance
    const closeToMe = []
    // up-left corner
    if (row > 0 && column > 0) {
      cellDistance = -(width + 1)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    // up-center
    if (row > 0) {
      cellDistance = -(width)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //up-right
    if (row > 0 && column < width - 1) {
      cellDistance = -(width - 1)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //left
    if (column > 0) {
      cellDistance = - 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //right
    if (column < width - 1) {
      cellDistance = + 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //down-left
    if (row < height - 1 && column > 0) {
      cellDistance = width - 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //down-center
    if (row < height - 1) {
      cellDistance = width
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //down-right
    if (row < height - 1 && column < width - 1) {
      cellDistance = width + 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    return closeToMe
  }

  function addFlag(event) {            //this event add and remove flags
    event.preventDefault()
    const selected = event.target.dataset.id
    if (cellsStatusInfo[selected].isCovered === true) {
      if (cellsStatusInfo[selected].haveFlag === false) {
        cellsStatusInfo[selected].cell.classList.add('flagged')
        cellsStatusInfo[selected].haveFlag = true
        nFlags--

      } else {
        cellsStatusInfo[selected].cell.classList.remove('flagged')
        cellsStatusInfo[selected].haveFlag = false
        nFlags++
      }
      flagsMonitor.innerHTML = nFlags
    }
  }
  function misflagged(selected) {      // set UI to misflagged
    cellsStatusInfo[selected].cell.classList.remove('flagged')
    cellsStatusInfo[selected].cell.classList.remove('covered')
    cellsStatusInfo[selected].cell.classList.add('misflagged')
  }

  function numbersAndEmptySpaces() {      //this manage the UI of the empty cells bombs and numbers 
    for (let i = 0; i < cellCount; i++) {
      switch (cellsStatusInfo[i].nBombsClose) {
        case 0:
          if (cellsStatusInfo[i].haveBomb === true) {
            cellsStatusInfo[i].cell.classList.add('bomb')
          } else {
            cellsStatusInfo[i].cell.classList.add('uncovered')
          }
          break
        case 1:
          cellsStatusInfo[i].cell.classList.add('uncoveredOne')
          break
        case 2:
          cellsStatusInfo[i].cell.classList.add('uncoveredTwo')
          break
        case 3:
          cellsStatusInfo[i].cell.classList.add('uncoveredThree')
          break
        case 4:
          cellsStatusInfo[i].cell.classList.add('uncoveredFour')
          break
        case 5:
          cellsStatusInfo[i].cell.classList.add('uncoveredFive')
          break
        case 6:
          cellsStatusInfo[i].cell.classList.add('uncoveredSix')
          break
        case 7:
          cellsStatusInfo[i].cell.classList.add('uncoveredSeven')
          break
        case 8:
          cellsStatusInfo[i].cell.classList.add('uncoveredEight')
          break
        default:
          cellsStatusInfo[i].cell.classList.add('uncovered')
          break
      }
    }


  }

  function clickedOnBomb(selected) {         //this manage when the user click on a bomb
    cellsStatusInfo[selected].cell.classList.remove('bomb')
    cellsStatusInfo[selected].cell.classList.add('death')
    audio.volume = 0.08
    audio.play()
    for (let i = 0; i < cellCount; i++) {
      if (cellsStatusInfo[i].haveBomb === false && cellsStatusInfo[i].haveFlag === true) {
        misflagged(i)
      }
      if (cellsStatusInfo[i].haveBomb === true && cellsStatusInfo[i].isCovered === true) {
        cellsStatusInfo[i].cell.classList.remove('flagged')
        cellsStatusInfo[i].isCovered = false
        cellsStatusInfo[i].cell.classList.remove('covered')
      }
      //all the cells became not clickable
      cellsStatusInfo[i].cell.classList.add('disabled')

    }
    // stop the timer
    timerStop()
    // change face
    resetBtn.classList.remove('face-button')
    resetBtn.classList.add('face-dead')
  }

  function timerStart() {     //handle the timer when start
    timerId = setInterval(() => {
      timerMonitor.innerHTML++
    }, 1000)
  }
  function timerStop() {  //handle the timer when stop
    clearInterval(timerId)
    timerId = null
  }
  function timerReset() {    //to reset the timer
    timerStop()
    timerMonitor.innerHTML = 0
  }
  function reset() {         //to reset the game (only the grid)
    timerReset()
    nFlags = nBombs
    flagsMonitor.innerHTML = nFlags
    cellsStatusInfo = []
    firstClick = true
    timerId = null
    cellsOpened = 0
    if (resetBtn.classList.value === 'face-win') {
      resetBtn.classList.remove('face-win')
      resetBtn.classList.add('face-button')
    }
    if (resetBtn.classList.value === 'face-dead') {
      resetBtn.classList.remove('face-dead')
      resetBtn.classList.add('face-button')
    }

    while (grid.firstChild) {
      grid.removeChild(grid.lastChild)
    }
    createGrid()
    randomBombPosition()
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('click', game))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('mousedown', oohFaceDown))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('mouseup', oohFaceUp))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('contextmenu', addFlag))
    resetBtn.addEventListener('click', reset)
    newGame.addEventListener('click', reset)

  }

  function game(event) {            //this handle each click of the game
    const selected = event.target.dataset.id
    uncoverCell(selected)
    numbersAndEmptySpaces()
    if (cellsStatusInfo[selected].haveBomb === true) {
      clickedOnBomb(selected)
    }
    if (cellsOpened === cellCount - nBombs) {
      timerStop()
      resetBtn.classList.remove('face-button')
      resetBtn.classList.add('face-win')
    }
  }
  //! to implement better UI with shadows in the box
  function oohFaceDown(event) {
    event.preventDefault()
    resetBtn.classList.remove('face-button')
    resetBtn.classList.add('face-ooh')
    event.target.classList.remove('covered')
    event.target.classList.add('clicked')

  }
  function oohFaceUp(event) {
    resetBtn.classList.remove('face-ooh')
    resetBtn.classList.add('face-button')
    event.target.classList.remove('clicked')
    event.target.classList.add('covered')

  }



  //*Event listeners

  createGrid()
  randomBombPosition()


  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('click', game))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mousedown', oohFaceDown))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mouseup', oohFaceUp))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('contextmenu', addFlag))
  resetBtn.addEventListener('click', reset)
  newGame.addEventListener('click', reset)
  levels.forEach(level =>
    level.addEventListener('click', changeLevel))

}

window.addEventListener('DOMContentLoaded', init)