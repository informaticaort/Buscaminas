 /*  función cambio de hojas de estilo*/
 function cambioEstilos(event){
  if (event.target.innerHTML === 'Windows'){
   document.getElementById('estilos').href = './styles/main.css';
 }else if (event.target.innerHTML === 'Messi'){
   document.getElementById('estilos').href = './styles/main2.css';
 }
 else if (event.target.innerHTML === 'Comida'){
  document.getElementById('estilos').href = './styles/main-comidas.css';
}
else if (event.target.innerHTML === 'Stranger Things'){
  document.getElementById('estilos').href = './styles/main-strangers.css';
}
}

/* función que da inicio al juego*/
function inicio() {
  document.getElementById('estilos').href= './styles/main.css';
  //* Variables
  const grid = document.querySelector('.grid') //selecciona el div
  const audio = document.querySelector('#audio') //Selecciona el audio
  const resetBtn = document.querySelector('.face-button') //Selecciona el boton de reset 
  const flagsMonitor = document.querySelector('#flags-monitor') //Selecciona el monitor de banderas
  const timerMonitor = document.querySelector('#timer-monitor')// Seleccciona el monitor del tiempo
  const newGame = document.querySelector('.new-game')
  const levels = document.querySelectorAll('.content')
  const gameWrapper = document.querySelector('.game-wrapper')
  const estilos= document.querySelectorAll('.content')

  //Nivel inicial
  let width = 9
  let height = 9
  let cellCount = width * height
  let nBombs = 6
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
  function cambiarNivel(event) {        // esta funcion cambia la UI y la lógica del juego en cada nivel
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
      grid.style.width = '425px'  //325
      grid.style.height = '425px'  //325
      gameWrapper.style.width = '425px'
      reset()
    } else if (event.target.innerHTML === 'Avanzado') {
      width = 30
      height = 16
      cellCount = width * height
      nBombs = 99
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(30, 2fr)'
      grid.style.gridTemplateRows = 'repeat(16, 2fr)'
      grid.style.width = '777px'
      grid.style.height = '378px'
      gameWrapper.style.width = '777px'
      reset()
    } else if (event.target.innerHTML === 'Super Fácil') {
      width = 5
      height = 5
      cellCount = width * height
      nBombs = 3
      nFlags = nBombs
      flagsMonitor.innerHTML = nFlags
      grid.style.gridTemplateColumns = 'repeat(5, 1fr)'
      grid.style.gridTemplateRows = 'repeat(5, 1fr)'
      grid.style.width = '300px'
      grid.style.height = grid.style.width
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
      grid.style.height = grid.style.width
      gameWrapper.style.width = '300px'
      reset()
    }
  }

  function crearGrid() {                   //esta función crea las celdas en la grilla con estado "cubierto"   
    cambiarNivel(null)
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
        descubrirCeldas(cellsAround[i])
      }

    }
  }

  function descubrirCeldas(selected) {  //esta función cambia la clase de una celda clickeada de cubierta a descubierta  

    if (cellsStatusInfo[selected].haveQuestion === true) {
      return
    }
      
    cellsStatusInfo[selected].isCovered = false
    cellsStatusInfo[selected].cell.classList.remove('covered')
    //deshabilitado del evento que vuelve a tapar la celda
    cellsStatusInfo[selected].cell.classList.add('disabled')
    if (firstClick === true) {

      inicioTiempo()
      firstClick = false
      while (cellsStatusInfo[selected].haveBomb === true || cellsStatusInfo[selected].nBombsClose !== 0) {
        removerTodasLasBombas()
        randomBombPosition()
      }


    }
    if (cellsStatusInfo[selected].nBombsClose === 0) {
      revealCellsAround(selected)
    }
    cellsOpened++
  }

  function removerTodasLasBombas() {            // Esta función remueve todas las bombas
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


  function agregarQuitarBandera(event) {            //este evento agrega o quita banderas
    event.preventDefault()
    const selected = event.target.dataset.id

    if(nFlags>0){
      if (cellsStatusInfo[selected].isCovered === true) {
        if (cellsStatusInfo[selected].haveFlag === false) {
          cellsStatusInfo[selected].cell.classList.add('flagged')
          cellsStatusInfo[selected].haveFlag = true
          nFlags-=1
          console.log(cellsStatusInfo[selected].cell.classList)
        } else {
          cellsStatusInfo[selected].cell.classList.remove('flagged')
          cellsStatusInfo[selected].haveFlag = false
          nFlags+2
          //interrogación
          cellsStatusInfo[selected].cell.classList.add('question')
          cellsStatusInfo[selected].haveQuestion = true
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
            console.log(cellsStatusInfo[selected].cell.classList)
            nFlags+=2
        }
      }
      flagsMonitor.innerHTML = nFlags

    }
  }

  function retiroBandera(selected) {      // retiro de bandera
    cellsStatusInfo[selected].cell.classList.remove('flagged')
    cellsStatusInfo[selected].cell.classList.remove('covered')
    cellsStatusInfo[selected].cell.classList.add('misflagged')
  }

  function numerosYEspaciosBacios() {      // esta función maneja lo que pasa cuando se hace click en una celda vacia   
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

  function clickEnBomba(selected) {         //esta función maneja lo que sucede cuando se encuentra una bomba   
    cellsStatusInfo[selected].cell.classList.remove('bomb')
    cellsStatusInfo[selected].cell.classList.add('death')
    audio.volume = 0.08
    audio.play()
    for (let i = 0; i < cellCount; i++) {
      if (cellsStatusInfo[i].haveBomb === false && cellsStatusInfo[i].haveFlag === true) {
        retiroBandera(i)
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
    document.getElementById("loss").style.display = "block"
    document.getElementById("scores").style.display = "none"
    
    /* movimiento del div "perdiste"*/
    window.onload = addListeners();
    function addListeners(){
      document.getElementById('boto').addEventListener('mousedown', mouseDown, false);
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
        var div = document.getElementById('loss');
      div.style.position = 'absolute';
      div.style.top = e.clientY + 'px';
      div.style.left = e.clientX + 'px';
    }

/* fin movimiento de div*/
  estilo= document.getElementById('estilos').href
  }
  
  function inicioTiempo() {     //inicio del contador
    timerId = setInterval(() => {
      timerMonitor.innerHTML++
    }, 1000)
  }
  function timerStop() {  //detención del contador
    clearInterval(timerId)
    timerId = null
  }
  function timerReset() {    //resetear el tiempo
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
      document.getElementById("loss").style.display = "none"
    }

    while (grid.firstChild) {
      grid.removeChild(grid.lastChild)
    }
    crearGrid()
    randomBombPosition()
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('click', juego))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('mousedown', oohFaceDown))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('mouseup', oohFaceUp))
    cellsStatusInfo.forEach(cells =>
      cells.cell.addEventListener('contextmenu', agregarQuitarBandera))
    resetBtn.addEventListener('click', reset)
    newGame.addEventListener('click', reset)

  }

  function juego(event) {            //esta función maneja cada click en el juego
    const selected = event.target.dataset.id
   descubrirCeldas(selected)
      numerosYEspaciosBacios()
    if (cellsStatusInfo[selected].haveBomb === true) {
      clickEnBomba(selected)
    }
    if (cellsOpened === cellCount - nBombs && cellsStatusInfo[selected].haveBomb === false) {
      timerStop()
      document.getElementById("scores").style.display = "block"


      /* movimiento del div "ganaste"*/
      window.onload = addListeners1();
      function addListeners1(){
        document.getElementById('botonn').addEventListener('mousedown', mouseDown, false);
        window.addEventListener('mouseup', mouseUp, false);
    
    }
    
    function mouseUp(){   // cuando suelto el click del mouse
        window.removeEventListener('mousemove', divMove, true);
    }
    
    function mouseDown(e){   // cuando presiono el botón del mouse
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
  function oohFaceDown(event) {    //remover cara :) y poner cara :o
    event.preventDefault()
    resetBtn.classList.remove('face-button')
    resetBtn.classList.add('face-ooh')   //:o
    event.target.classList.remove('covered')
    event.target.classList.add('clicked')

    resetBtn.classList.add('face-button')
    event.target.classList.remove('clicked')
    event.target.classList.add('covered')


  }
  function oohFaceUp(event) {   // cara :o
    resetBtn.classList.remove('face-ooh')
  }
  document.getElementById('rein').addEventListener("click", reset,true)
  

  //*Event listeners

  crearGrid()
  randomBombPosition()


  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('click', juego))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mousedown', oohFaceDown))
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('mouseup', oohFaceUp))  
  cellsStatusInfo.forEach(cells =>
    cells.cell.addEventListener('contextmenu', agregarQuitarBandera))
  resetBtn.addEventListener('click', reset)
  newGame.addEventListener('click', reset)
  levels.forEach(level =>
    level.addEventListener('click', cambiarNivel))
  estilos.forEach(estilo =>
    estilo.addEventListener('click', cambioEstilos))
}

// cuando cargue la pagina, inicia el juego
window.addEventListener('DOMContentLoaded', inicio)


/**
 * Envia puntaje
 */
 function enviarPuntaje(score, name)
 {
   var xhr = new XMLHttpRequest();
            //xhr.open('POST', 'http://10.128.20.20/inforunner/insertar.php?name='+name+'&score='+score+'&pc='+0, true);
            xhr.open('POST', 'https://a-srv-tv-info/inforunner/tv/insertar.php?name='+name+'&score='+score+'&pc='+0, true);
  
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
 



 //http://10.128.20.20/inforunner/tv/
