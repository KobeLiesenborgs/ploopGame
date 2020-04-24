window.onload = () => {
    console.log("Timeout loaded")
    const socket = io.connect("localhost:3001");
    let startDate = new Date();
    let goal = startDate.getTime();
    let text;
    let textField = document.getElementById("t1");

    console.log(textField);

    document
    countLoop()
    

    function countLoop(){
        var d = new Date();
        var now = d.getTime();

        let currentWaitTime = (goal-now)
        S = Math.abs((currentWaitTime/1000|0)%60)
        M = Math.abs((currentWaitTime/60000|0)%60)

        M = (""+M).padStart(2,"0")
        S = (""+S).padStart(2,"0")
        
        if(currentWaitTime>0){

            text = `Quick break, will restart in ${M} minutes ${S} seconds.`;

        }
        else{

            text = `Should have started ${M} minutes and ${S} seconds ago.`;

        }

        textField.style.textAlign = "center";
        textField.textContent = text;



        requestAnimationFrame(countLoop);
    }

    socket.on("message",(input)=>{

        const tags = input.tags;
        let [text, minutes] = input.message.split(" ");


        if(text.toLowerCase() == "timeout" && ["broadcaster"].some((type)=>(tags["badges"]||{})[type])){
            if(!minutes){
                minutes = 30
            }
            goal = new Date().getTime() + 60000*minutes
        }

    })





















}