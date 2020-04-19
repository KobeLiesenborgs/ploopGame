window.onload = () => {
    console.log("Dropgame Loaded")
    const socket = io.connect("localhost:3000");
    const speed = 5
    const elementClass = "dropImages"
    const maxSpeed = 5
    const displays = {}
    let frame = 0
    let banana = "https://media.giphy.com/media/IB9foBA4PVkKA/giphy.gif"
    let toDelete = []

    gameLoop()

    function toPixels(size){
        return size+"px"        
    }

    function gameLoop(){

            let remove = [];
            for(let [user, data] of Object.entries(displays)){
                if(!data.deleted){
                    const d = data.image;
                    let x = +d.style.left.slice(0,-2);
                    let y = +d.style.top.slice(0,-2);
                    x += data.xspeed/speed;
                    y += data.yspeed/speed;
                    d.style.left = toPixels(x);
                    d.style.top = toPixels(y);

                    if(y>window.innerHeight-data.image.height){
                        remove.push(user);
                    }

                    if(x<0||x>window.innerWidth-data.image.width){
                        data.xspeed = -data.xspeed
                    }
                }
            }

            for(d of remove){
                displays[d].deleted = true
                toDelete.push(d)
                window.setTimeout(()=>{
                    if(toDelete.length>0){
                        let a = toDelete.shift();document.body.removeChild(displays[a].image);delete displays[a];
                    }
                },5000)
            }
        

        frame++
        requestAnimationFrame(gameLoop);
    }

    function yeet(name){
        displays[name].xspeed=0
        displays[name].yspeed=50
    }



    socket.on("message",(input)=>{

        const tags = input.tags;
        user = tags['display-name'];

        const [text, url] = input.message.split(" ");

        const dropAlliases = ["ploop","drop","noticeme","plop","nm"]

        if(dropAlliases.includes(text.toLowerCase())  && !displays[user]){

            
            const image = document.createElement("IMG");

            image.className = elementClass;
            image.src = url||banana;
            image.onerror = ()=>image.src = banana;

            image.style.position = 'absolute';
            

            Math.max(image.width,image.height)==image.height?image.height = window.innerHeight/20:image.width = window.innerWidth/20;
            image.style["border-radius"] = "100%"
            
            const x = toPixels(image.width + Math.floor(Math.random()*window.innerWidth*0.7));
            const y = 1;
            image.style.top = y;
            image.style.left = x;

            const xspeed =  Math.random()*(2*maxSpeed)-2*maxSpeed
            const yspeed =  2+Math.random()*2
            const deleted = false
        
            displays[user] = {image, xspeed, yspeed, deleted}
            document.body.appendChild(image);

        }

        if(text.toLowerCase() == "yeet" && displays[user]){

            yeet(user);

        }

        if(text.toLowerCase() == "yeetall" && ["broadcaster","moderator"].some((type)=>(tags["badges"]||{})[type])){

            for(user of Object.keys(displays)){
                yeet(user)
            }
        }

    })
}


