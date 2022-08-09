
function init() {
  //* Variables
  const grid = document.querySelector('.grid') //selecciona el div
  const audio = document.querySelector('#audio') //Selecciona el audio
  const resetBtn = document.querySelector('.face-button') //Selecciona el boton de reset 
  const flagsMonitor = document.querySelector('#flags-monitor') //Selecciona el monitor de banderas
  const timerMonitor = document.querySelector('#timer-monitor')// Seleccciona el monitor del tiempo
  const newGame = document.querySelector('.new-game')
  const levels = document.querySelectorAll('.content')
  const gameWrapper = document.querySelector('.game-wrapper')

  //Nivel fácil
  let width = 9
  let height = 9
  let cellCount = width * height
  let nBombs = 4
  let nFlags = nBombs
  flagsMonitor.innerHTML = nFlags
  let cellsStatusInfo = []
  let firstClick = true
  let timerId = null
  let cellsOpened = 0

  // Clase para producir al objeto que almacena información de la celda (si tiene una bomba, si está cubierta, etc)
  
  class CellInfo {
    constructor(idCell, cell, column, row, isCovered, haveBomb, haveFlag, nBombsClose,haveQuestion) {
      this.idCell = idCell           
      this.cell = cell                //almacena el div en el sistema
      this.column = column            //columna
      this.row = row                    // fila
      this.isCovered = isCovered            
      this.haveBomb = haveBomb             
      this.haveFlag = haveFlag 
      this.haveQuestion= haveQuestion           
      this.nBombsClose = nBombsClose      //cuenta el número de bombas alrededor

    }
  }

  //* Funciones

  function changeLevel(event) {        // esta funcion cambia la UI y la lógica del juego en cada nivel
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
      grid.style.width = '325px'
      gameWrapper.style.width = '325px'
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
    } else if (event.target.innerHTML === '') {
      width = 
      height = 
      cellCount = width * height
      nBombs = 
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(5, 1fr)'
      grid.style.gridTemplateRows = 'repeat(5, 1fr)'
      grid.style.width = '300px'
      gameWrapper.style.width = '300px'
      reset()
    }else {
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

  function createGrid() {                   //esta función crea las celdas en la grilla con estado "cubierto"   
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

  function revealCellsAround(index) {         //para abrir las celdas alrededor de una    
    const cellsAround = whoIsCloseToMe(parseInt(index))
    for (let i = 0; i < cellsAround.length; i++) {
      if (cellsStatusInfo[cellsAround[i]].isCovered === true) {
        uncoverCell(cellsAround[i])
      }

    }
  }

  function uncoverCell(selected) {  //esta función cambia la clase de una celda clickeada de cubierta a descubierta  
    /*if (cellsStatusInfo[selected].haveFlag === true) {*/
    if (cellsStatusInfo[selected].haveQuestion === true) {
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

  function removeAllBombs() {            // Esta función remueve todas las bombas
    for (let i = 0; i < cellCount; i++) {
      cellsStatusInfo[i].nBombsClose = 0
      if (cellsStatusInfo[i].haveBomb === true) {
        cellsStatusInfo[i].haveBomb = false
        cellsStatusInfo[i].cell.classList.remove('bomb')
      }
    }

  }

  function randomBombPosition() {      //esta función ubica de forma random las bombas en el tablero
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


  function bombsCloseToMe(indexOfTheBomb) { // esta funcion encuentra cuántas bombas hay cerca de cada celda
    const nearby = whoIsCloseToMe(indexOfTheBomb)
    for (let i = 0; i < nearby.length; i++) {
      cellsStatusInfo[nearby[i]].nBombsClose++
    }

  }

  function whoIsCloseToMe(index) {         // esta funcion retorna un array de celdas cercanas a la seleccionada
    const column = cellsStatusInfo[index].column    //retorna la columna
    const row = cellsStatusInfo[index].row        //retorna la fila
    let cellDistance
    const closeToMe = []
    // superior izquierda
    if (row > 0 && column > 0) {
      cellDistance = -(width + 1)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    // superior
    if (row > 0) {
      cellDistance = -(width)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //superior derecha 
    if (row > 0 && column < width - 1) {
      cellDistance = -(width - 1)
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //izquierda
    if (column > 0) {
      cellDistance = - 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //derecha
    if (column < width - 1) {
      cellDistance = + 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //inferior izquierda
    if (row < height - 1 && column > 0) {
      cellDistance = width - 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //inferior
    if (row < height - 1) {
      cellDistance = width
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    //inferior derecha
    if (row < height - 1 && column < width - 1) {
      cellDistance = width + 1
      closeToMe.push(cellsStatusInfo[index + cellDistance].idCell)
    }
    return closeToMe
  }


  function addFlag(event) {            //este evento agrega o quita banderas
    event.preventDefault()
    const selected = event.target.dataset.id

    if(nFlags>0){
      console.log(nFlags)
      if (cellsStatusInfo[selected].isCovered === true) {
        if (cellsStatusInfo[selected].haveFlag === false) {
          cellsStatusInfo[selected].cell.classList.add('flagged')
          cellsStatusInfo[selected].haveFlag = true
          nFlags-=1
          console.log(nFlags)
          console.log(cellsStatusInfo[selected].cell.classList)
        } else {
          
          cellsStatusInfo[selected].cell.classList.remove('flagged')
          cellsStatusInfo[selected].haveFlag = false
          nFlags+2
          //interrogación
          cellsStatusInfo[selected].cell.classList.add('question')
          cellsStatusInfo[selected].haveQuestion = true
          //nFlags++ funciona pero sima despues de la bandera
          console.log(cellsStatusInfo[selected].cell.classList)
          
        }
        // remover interrogación
        if (cellsStatusInfo[selected].isCovered === true 
          && cellsStatusInfo[selected].haveFlag === true 
          && cellsStatusInfo[selected].haveQuestion == true) {
            
            console.log(nFlags)
            cellsStatusInfo[selected].cell.classList.remove('question')
            cellsStatusInfo[selected].haveQuestion = false
            cellsStatusInfo[selected].cell.classList.remove('flagged')
            cellsStatusInfo[selected].haveFlag = false
            cellsStatusInfo[selected].cell.classList.add('covered')
            cellsStatusInfo[selected].isCovered = true;
            console.log("asd")
            console.log(cellsStatusInfo[selected].cell.classList)
            nFlags+=2
        }
        
      }
      flagsMonitor.innerHTML = nFlags

    }
  }

  
  function misflagged(selected) {      // retiro de bandera
    cellsStatusInfo[selected].cell.classList.remove('flagged')
    cellsStatusInfo[selected].cell.classList.remove('covered')
    cellsStatusInfo[selected].cell.classList.add('misflagged')
  }

  function numbersAndEmptySpaces() {      // esta función maneja lo que pasa cuando se hace click en una celda vacia   
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

  function clickedOnBomb(selected) {         //esta función maneja lo que sucede cuando se encuentra una bomba   
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
      //todas las celdas se convierten a no clickeables
      cellsStatusInfo[i].cell.classList.add('disabled')

    }
    // prar el temporizador
    timerStop()
    // cambiar cara
    resetBtn.classList.remove('face-button')
    resetBtn.classList.add('face-dead')
    alert("Perdiste")
  }

  function timerStart() {     //inicio del contador
    timerId = setInterval(() => {
      timerMonitor.innerHTML++
    }, 1000)
  }
  function timerStop() {  //detención del contador
    clearInterval(timerId)
    timerId = null
  }
  function timerReset() {    //reset el timer
    timerStop()
    timerMonitor.innerHTML = 0
  }
  function reset() {         // resetea el juego (solo la grilla)
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
      document.getElementById("scores").style.display = "none"
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

  function game(event) {            //esta función maneja cada click en el juego
    const selected = event.target.dataset.id
    uncoverCell(selected)
    numbersAndEmptySpaces()
    if (cellsStatusInfo[selected].haveBomb === true) {
      clickedOnBomb(selected)
    }
    if (cellsOpened === cellCount - nBombs) {
      timerStop()
      //alert('Ganaste /n tiempo: '+timerMonitor.innerHTML)   // Mensaje juego ganado
      //document.getElementById("juego").style.display = "none"

      document.getElementById("scores").style.display = "block"

      /* movimiento del div "ganaste"*/
      window.onload = addListeners();
      function addListeners(){
        document.getElementById('scores').addEventListener('mousedown', mouseDown, false);
        window.addEventListener('mouseup', mouseUp, false);
    
    }
    
    function mouseUp()
    {
        window.removeEventListener('mousemove', divMove, true);
    }
    
    function mouseDown(e){
      window.addEventListener('mousemove', divMove, true);
    }
    
    function divMove(e){
        var div = document.getElementById('scores');
      div.style.position = 'absolute';
      div.style.top = e.clientY + 'px';
      div.style.left = e.clientX + 'px';
    }

/* fin movimiento de div*/

      document.getElementById("score").innerHTML = timerMonitor.innerHTML
      //let name= prompt("Ingresá tu nombre: ")
      document.getElementById("submit").addEventListener("click", 
        function tomarDatos(){
          var name=document.getElementById('myForm-Name').value;
          let tiempo= document.getElementById("score").innerHTML = timerMonitor.innerHTML;
          enviarPuntaje(tiempo,name);
        });
      for (let i = 0; i < cellCount; i++) {  //todas las celdas se convierten a no clickeables
        cellsStatusInfo[i].cell.classList.add('disabled')
      }
      resetBtn.classList.remove('face-button')
      resetBtn.classList.add('face-win')
      
    }
  }
  function oohFaceDown(event) {
    event.preventDefault()
    resetBtn.classList.remove('face-button')
    resetBtn.classList.add('face-ooh')
    event.target.classList.remove('covered')
    event.target.classList.add('clicked')

    resetBtn.classList.add('face-button')
    event.target.classList.remove('clicked')
    event.target.classList.add('covered')


  }
  function oohFaceUp(event) {
    resetBtn.classList.remove('face-ooh')
  }



  //*Event listeners

  createGrid()
  randomBombPosition()


  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('click', game))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mousedown', oohFaceDown))//
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mouseup', oohFaceUp))  //
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('contextmenu', addFlag))
  resetBtn.addEventListener('click', reset)
  newGame.addEventListener('click', reset)
  levels.forEach(level =>
    level.addEventListener('click', changeLevel))

}

window.addEventListener('DOMContentLoaded', init)





/**
 * Envia puntaje
 */
 function enviarPuntaje(score, name)
 {
   
  console.log(name)
  console.log(score)
   var xhr = new XMLHttpRequest();
           xhr.open('POST', 'http://10.128.20.20/inforunner/insertar.php?name='+name+'&score='+score+'&pc='+0, true);
           xhr.withCredentials = true;
           xhr.onreadystatechange = function() {
             if (xhr.readyState === 2) {
               console.log(name + " , partida guardada con "+score + " puntos!");
             }
           }
           xhr.setRequestHeader('Content-Type', 'application/text');
           xhr.send(name);
           
   $('#myForm').hide();
   $('.enviar').hide();
  
 }
 


 /*
 

 * Envia puntaje
 
function enviarPuntaje(score, preguntascorrectas)
{
  var name=document.getElementById('myForm-Name').value;

  var xhr = new XMLHttpRequest();
          xhr.open('POST', 'http://10.128.20.20/inforunner/insertar.php?name='+name+'&score='+score+'&pc='+preguntascorrectas, true);
          xhr.withCredentials = true;
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 2) {
              console.log(name + " , partida guardada con "+score + " puntos!");
            }
          }
          xhr.setRequestHeader('Content-Type', 'application/text');
          xhr.send(name);

  $('#myForm').hide();
  $('.enviar').hide();
  document.getElementById('myForm-Name').value="";
}
*/



 //http://10.128.20.20/inforunner/tv/