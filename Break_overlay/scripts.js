
window.onload = () => {
    const socket = io.connect("localhost:3001");
    let startDate = new Date();
    let goal = startDate.getTime();
    let text;
    let timerOn = true;
    let textField = document.getElementById("t1");


    document;
    countLoop();
    

    function countLoop(){
        var d = new Date();
        var now = d.getTime();

        let currentWaitTime = (goal-now);
        S = Math.abs((currentWaitTime/1000|0)%60);
        M = Math.abs((currentWaitTime/60000|0)%60);

        M = (""+M).padStart(2,"0");
        S = (""+S).padStart(2,"0");
        if(timerOn){
            if(currentWaitTime>0){
                text = `Quick break, will restart in ${M} minutes ${S} seconds.`;
            }
            else{
                text = `Should have started ${M} minutes and ${S} seconds ago.`;
            }
        }
        else{text =  "";}

        textField.innerText = text;

        requestAnimationFrame(countLoop);
    }

    socket.on("message",(input)=>{

        const tags = input.tags;
        let [text, args] = input.message.split(" ");


        if(text.toLowerCase() == "timer" && ["broadcaster", "moderator"].some((type)=>(tags["badges"]||{})[type])){

            args = args || 30;

            if(args === "on"){
                timerOn = true;
            }else if(args === "off"){
                timerOn = false;
            }else if(["toggle", "switch"].includes(args)){
                timerOn = !timerOn;
            }
            goal = new Date().getTime() + 60000*args;
        }
    });





















};