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
    let bounceMode = true

    gameLoop()

    function toPixels(size){
        return size+"px"        
    }

    function fromPixels(size){
        return (+size.slice(0,-2))
    }

    function gameLoop(){

            let remove = [];
            for(let [user, data] of Object.entries(displays)){
                if(!data.deleted){

                    const d = data.image;
                    let x = fromPixels(d.style.left);
                    let y = fromPixels(d.style.top);
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
            for(let [user1, data1] of Object.entries(displays)){
                if(!data1.deleted){
                    let collision = false;
                    for(let [user2, data2] of Object.entries(displays)){
                        if(user1!=user2 &&!data2.deleted){
                            if(intersect(data1.image, data2.image)&& !isMovingAway(data1,data2)){
                                collision = true;
                            }
                        }
                    }

                    if(collision){
                        if(bounceMode){
                            yeet(user1);
                        }
                        else{
                            flip(user1);
                        }
                    }
                }
            }


            for(let d of remove){
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
        displays[name].xspeed=0;
        displays[name].yspeed=45;

        let yeetImage = document.createElement("IMG");
        yeetImage.src = "images/Yeet.png"
        yeetImage.style.position = 'absolute';
        yeetImage.style.top = displays[name].image.style.top - displays[name].image.width/2;
        yeetImage.style.left = displays[name].image.style.left;
        yeetImage.width = displays[name].image.height*3;

        document.body.appendChild(yeetImage);
        window.setTimeout(()=>{
                document.body.removeChild(yeetImage);
        },2000)
    }

    function flip(user){
        displays[user].xspeed *= -1;
    }

    function intersect(display1, display2){

        let x11 = fromPixels(display1.style.left);
        let x21 = fromPixels(display2.style.left);
        let y11 = fromPixels(display1.style.top);
        let y21 = fromPixels(display2.style.top);
        let x12 = x11 + display1.width;
        let x22 = x21 + display2.width;
        let y12 = y11 + display1.height;
        let y22 = y21 + display2.height;


        let AleftOfB = x12<x21
        let ArightOfB = x11>x22
        let AaboveB = y12<y21
        let AunderB = y11>y22

        return!(AleftOfB||ArightOfB||AaboveB||AunderB)
    }

    function isMovingAway(drop, drop2) {
        if(fromPixels(drop.image.style.left) < fromPixels(drop2.image.style.left)){
          return drop.xspeed < drop2.xspeed;
        }
        else {
          return drop.xspeed > drop2.xspeed;
        }
      }



    socket.on("message",(input)=>{

        const tags = input.tags;
        user = tags['display-name'];

        const [text, url] = input.message.split(" ");

        const dropAlliases = ["ploop","drop","noticeme","plop","nm"]

        if(dropAlliases.includes(text.toLowerCase())  && !displays[user]){

            
            const image = document.createElement("IMG");

            image.className = elementClass;
            if (tags.emotes) {
                const emoteIds = Object.keys(tags.emotes);
                const emoteId = emoteIds[Math.floor(Math.random() * emoteIds.length)];
                image.src = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/2.0`;
            } else {
                image.src = url||banana;
            }
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

        if(text.toLowerCase() == "yeetall" && ["broadcaster","moderator","vip"].some((type)=>(tags["badges"]||{})[type])){

            for(user of Object.keys(displays)){
                yeet(user)
            }
        }

        if(text.toLowerCase() == "flip" && displays[user]){

            flip(user);

        }

        if(text.toLowerCase() == "changemode" && ["broadcaster","moderator"].some((type)=>(tags["badges"]||{})[type])){

            bounceMode = !bounceMode
        }


    })
}


