
// helper function for coverting indices back and forth
const twoToOneIndex = (x, y, rows = 5) => (x * rows + y);
const oneToTwoIndex = (i, rows=5) => ({x:Math.floor(i/rows), y: Math.floor(i%rows)});
const toChessStyle = (x, y) => `${String.fromCharCode(x + 97)}${y + 1}`;
const fromChessStyle = str => [str[0].charCodeAt() - 97, +str[1] - 1];

// set an image based on the currentPlatforms turn
const currentPlayImage = (parent, images, currentPlatform, className="") => {
    const image = images[currentPlatform];
    const imageElement = document.createElement("img");
    imageElement.src = image;
    imageElement.className = className;
    parent.appendChild(imageElement);
};

window.onload = () => {
    console.log("ChatGame Loaded");
    const socket = io.connect("localhost:3001");
    let count = 0;
    let board = createBoard(5,5);
    let voters = new Set();
    let votes = {};
    const start = Math.random()<0.5;
    let currentPlatform = start?"twitch":"discord";
    let timer = false;
    let timerStart;
    let duration = 10000;
    let moves = new Set();
    let boardDivs = createBoardDivs(25);
    changePlatform();
    const images = {
        discord: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.podfeet.com%2Fblog%2Fwp-content%2Fuploads%2F2018%2F02%2Fdiscord-logo.png&f=1&nofb=1",
        twitch: "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fpngimg.com%2Fuploads%2Ftwitch%2Ftwitch_PNG27.png&f=1&nofb=1"
    };

    gameLoop();

    function gameLoop(){
        if(timer){
            checkTimer();
        }
        requestAnimationFrame(gameLoop);
    }

    // creates a 2d array of x by y size for the gameboard
    function createBoard(x, y){
        return Array.from(Array(x), () => new Array(y));    
    }

    //create all the divs that are displayed on as the gameboard
    function createBoardDivs(count){
        let boardTemp = [];
        const board = document.createElement("div");
        board.id = "board";
        document.body.appendChild(board);

        for(let i=0; i < count;i++){
            const element = document.createElement("div");
            element.classList.add("cell");
            const {x,y} = oneToTwoIndex(i);
            const location = document.createElement("span");
            location.innerText = toChessStyle(x, y);
            location.className = "location";
            element.appendChild(location);
            board.appendChild(element);
            boardTemp.push(element);
        }
        return boardTemp;
    }

    // toggle the current player and set the background of the screen respectively
    function changePlatform(){
        if(currentPlatform == "twitch"){
            currentPlatform = "discord";
        }
        else{
            currentPlatform = "twitch";
        }

        document.getElementById("board").className = currentPlatform;
        votes = {};
        voters = new Set();
    }

    // set the timer start to now
    function startTimer(){
        timerStart = new Date().getTime();
    }

    // if voting time is up then make the move and swap the turn
    function checkTimer(){
        let now = new Date().getTime();
        let currentWaitTime = now-timerStart;
        if(currentWaitTime > duration){
            timer = false;
            makeMove();
            changePlatform();
        }

    }

    // make a move, based the which spot got the most votes, if they all get the same number of votes then use the first one
    function makeMove(){
        let move = Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
        moves.add(move);

        // reset the innerhtml of all the temp items to display the votes
        for(let vote of Object.keys(votes)){
            let[x, y] = [vote[0].charCodeAt()-97, +vote[1]-1];
            boardDivs[(twoToOneIndex(x, y))].innerHTML="";
        }


        // set the voted location to the image of the current platform
        let[x, y] = fromChessStyle(move);
        
        board[x][y] = currentPlatform;
        index = twoToOneIndex(x, y);
        
        currentPlayImage(boardDivs[index], images, currentPlatform);
    }
    
    // check if a move has been made with valid syntax and hasn't already been played
    function validMove(move){
        let re = /^[a-e][1-5]$/i;
        return (re.test(move) && !moves.has(move));
    }

    socket.on("message",(input)=>{
        let tags = input["tags"];
        let user = tags['username'];
        let [command, message] = input["message"].split(" ");

        if(command.toLowerCase() == "vote"){
            // check if it the turn of the platform the message was sent on and that the use hasn't already voted
            if(tags["platform"]==currentPlatform && !voters.has(user)){
                message = message.toLowerCase();
    
                if(validMove(message)){
                    // if timer is false then it is time to reset the timer which happens when we toggle the turn
                    if(!timer){
                        timer = true;
                        startTimer();
                    }
                    let [x, y] = fromChessStyle(message);
                    const index = twoToOneIndex(x, y);

                    voters.add(user);

                    // add in a temporary image for locations that have been voted for
                    if(!votes[message]){
                        votes[message] = 0;

                        // set the image of the current platform that made the move
                        currentPlayImage(boardDivs[index], images, currentPlatform, "vote");

                        const spanElement = document.createElement("span");
                        spanElement.innerText = 0;
                        spanElement.className = "voteCount";
                        boardDivs[index].appendChild(spanElement);
                    }

                    // set the count of the temp image to be the number of votes
                    const count = ++votes[message];
                    const span = boardDivs[index].getElementsByClassName("voteCount")[0];
                    span.innerText = count;
                }
            }
        }

        // mod only command for increasing turn duration
        if(command.toLowerCase() == "settimer" && ["broadcaster", "moderator"].some(type=>(tags["badges"]||{})[type])){
            duration = message*1000;
        }

    });
};