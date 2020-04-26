window.onload = () => {
    console.log("ChatGame Loaded");
    const socket = io.connect("localhost:3001");
    var count = 0;
    var board = createBoard(5,5);
    var voters = new Set();
    var votes = {};
    const start = Math.random()<0.5;
    var currentPlatform = start?"twitch":"discord";
    var timer = false;
    var timerStart;
    var duration = 10000
    var moves = new Set();
    var boardDivs = createBoardDivs(25);
    changePlatform();
    const images = {}
    images["discord"] = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.podfeet.com%2Fblog%2Fwp-content%2Fuploads%2F2018%2F02%2Fdiscord-logo.png&f=1&nofb=1";
    images["twitch"] = "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fpngimg.com%2Fuploads%2Ftwitch%2Ftwitch_PNG27.png&f=1&nofb=1";

 

    gameLoop();


    function gameLoop(){
        if(timer){
            checkTimer();
        }
        requestAnimationFrame(gameLoop);
    }

    function createBoard(x, y){
        return Array.from(Array(x), () => new Array(y))    
    }

    function createBoardDivs(count){
        let boardTemp = []
        const board = document.createElement("div");
        board.id = "board";
        document.body.appendChild(board);

        for(let i=0; i<count;i++){
            const element = document.createElement("div");
            element.classList.add("cell");
            board.appendChild(element);
            boardTemp.push(element);
        }

        return boardTemp;
    }

    function changePlatform(){


        if(currentPlatform == "twitch"){
            currentPlatform = "discord";
        }
        else{
            currentPlatform = "twitch";
        }

        document.getElementById("board").className =currentPlatform;
        votes = {};
        voters = new Set();

    }

    function startTimer(){
        timerStart = new Date().getTime();
    }

    function checkTimer(){
        let now = new Date().getTime();
        let currentWaitTime = now-timerStart;
        if(currentWaitTime > duration){
            timer = false;
            makeMove();
            changePlatform();
        }

    }

    function makeMove(){
        let move = Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
        moves.add(move);

        for(let vote of Object.keys(votes)){
            let[x, y] = [vote[0].charCodeAt()-97, +vote[1]-1];
            boardDivs[(x*5+y)].innerHTML=""
        }


        let[x, y] = [move[0].charCodeAt()-97, +move[1]-1];
        board[x][y] = currentPlatform;

        const index = (x*5+y);
        const image = images[currentPlatform];
        const imageElement = document.createElement("img");
        imageElement.src = image;
        boardDivs[index].appendChild(imageElement);

    }


    function validMove(move){
        let re = /^[a-e][1-5]$/;
        return (re.test(move) && !moves.has(move));
    }

socket.on("message",(input)=>{


    let tags = input["tags"];
    let user = tags['username'];
    let [command, message] = input["message"].split(" ")

    if(command.toLowerCase() == "vote"){
        if(tags["platform"]==currentPlatform && !voters.has(user)){
            message = message.toLowerCase();
            if(validMove(message)){

                if(!timer){
                    timer = true;
                    startTimer();
                }
                let[x, y] = [message[0].charCodeAt()-97, +message[1]-1];
                const index = (x*5+y);

                voters.add(user);
                if(!votes[message]){
                    votes[message] = 0;

                    //TODO put in function
                    
                    const image = images[currentPlatform];
                    const imageElement = document.createElement("img");
                    imageElement.src = image;
                    imageElement.className = "vote";
                    boardDivs[index].appendChild(imageElement);

                    const spanElement = document.createElement("span");
                    spanElement.innerText = 0;
                    spanElement.className = "voteCount";
                    boardDivs[index].appendChild(spanElement);

                }

            
                const count = ++votes[message];
                const span = boardDivs[index].getElementsByClassName("voteCount")[0];
                span.innerText = count;
            }
        }
    }

    if(command.toLowerCase() == "settimer" && ["broadcaster", "moderator"].some((type)=>(tags["badges"]||{})[type])){
        duration = message*1000
    }

})

}