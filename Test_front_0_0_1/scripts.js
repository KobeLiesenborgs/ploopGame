function random(min = 0, max = 1) {
    if (min instanceof Array) {
        return min[Math.floor(Math.random() * min.length)]
    } else {
        return Math.random() * (max - min) + min;
    }
}

window.onload = () => {
    console.log("Dropgame Loaded");
    const socket = io.connect("localhost:3000");
    const speed = 5;
    const elementClass = "dropImages";
    const maxSpeed = 5;
    const displays = {};
    let frame = 0;
    let banana = "https://media.giphy.com/media/IB9foBA4PVkKA/giphy.gif";
    let toDelete = [];
    let bounceMode = true;
    let audioContext = new AudioContext();
    const audioElement1 = document.getElementById("audio-yeet1");
    const track1 = audioContext.createMediaElementSource(audioElement1);
    const audioElement2 = document.getElementById("audio-yeet2");
    const track2 = audioContext.createMediaElementSource(audioElement2);
    const audioElement3 = document.getElementById("yoink1");
    const track3 = audioContext.createMediaElementSource(audioElement3);
    const audioElement4 = document.getElementById("yoink2");
    const track4 = audioContext.createMediaElementSource(audioElement4);
    const audioElement5 = document.getElementById("yoink3");
    const track5 = audioContext.createMediaElementSource(audioElement5);

    track1.connect(audioContext.destination);
    track2.connect(audioContext.destination);
    track3.connect(audioContext.destination);
    track4.connect(audioContext.destination);
    track5.connect(audioContext.destination);

    const parachuteSize = 100

    class Vector {
        constructor(x, y) {
            this.x = x
            this.y = y
        }

        add(vec) {
            this.x += vec.x
            this.y += vec.y
            return this
        }

        div(scalar) {
            const copy = new Vector(this.x, this.y)
            copy.x /= scalar
            copy.y /= scalar
            return copy
        }

        mult(scalar) {
            this.x *= scalar
            this.y *= scalar
            return this
        }
    }

    class Drop {
        constructor(image) {
            this.position = new Vector(image.width + Math.floor(Math.random() * window.innerWidth * 0.7), 1)
            this.image = image
            this.image.style.top = toPixels(this.position.y);
            this.image.style.left = toPixels(this.position.x);
            this.acceleration = new Vector()

            this.velocity = new Vector(random(-maxSpeed, maxSpeed) * 2, random(1, maxSpeed))
            this.maxSpeed = 4
            this.deleted = false
            this.mass = this.image.width / 10
            this.yeeted = false
            this.parachuteImg = parachute()
            document.body.appendChild(this.parachuteImg)

        }

        update(speed) {
            this.position.add(this.velocity.div(speed))
            this.image.style.top = toPixels(this.position.y);
            this.image.style.left = toPixels(this.position.x);
            if (!this.yeeted) {
                this.parachuteImg.style.top = toPixels(this.position.y - parachuteSize + 15)
                const w = this.image.width / 2
                this.parachuteImg.style.left = toPixels(this.position.x + (w - parachuteSize / 2))
            } else {
                this.parachuteImg.style.top = toPixels(fromPixels(this.parachuteImg.style.top) - 35)
            }
            if (this.position.y < 0) {
                this.velocity.y = random(1, maxSpeed)
            }

        }
    }

    gameLoop()

    function toPixels(size){
        return size+"px"        
    }

    function fromPixels(size){
        return (+size.slice(0,-2))
    }

    function gameLoop() {

        let remove = [];
        for (let [user, data] of Object.entries(displays)) {
            if (!data.deleted) {
                data.update(speed)

                if (data.position.y > window.innerHeight - data.image.height) {
                    remove.push(user);
                }

                if (data.position.x < 0 || data.position.x > window.innerWidth - data.image.width) {
                    flip(user)
                }
            }
        }
        for (let i = 0; i < Object.keys(displays).length; i++) {
            const a = Object.entries(displays)[i]
            if (!a[1].deleted) {
                for (let j = i + 1; j < Object.keys(displays).length; j++) {
                    processCollision(a, Object.entries(displays)[j])
                }
            }
        }

        for (let d of remove) {
            displays[d].deleted = true
            toDelete.push(d)
            const img = displays[d].image
            const pImg = displays[d].parachuteImg
            img.classList.remove("alive")
            img.classList.add("dead")
            pImg.classList.add("dead")

            window.setTimeout(() => {
                if (toDelete.length > 0) {
                    let a = toDelete.shift();
                    document.body.removeChild(displays[a].image);
                    document.body.removeChild(displays[a].parachuteImg);
                    delete displays[a];
                }
            }, 30000)
        }

        frame++
        requestAnimationFrame(gameLoop);
    }

    function processCollision([user1, drop1], [user2, drop2]) {
        if (intersect(drop1.image, drop2.image) && !isMovingAway(drop1, drop2)) {
            if (bounceMode) {
                const temp = drop1.velocity.x
                drop1.velocity.x = drop2.velocity.x
                drop2.velocity.x = temp
            } else {
                yeet(user1)
                yeet(user2)
            }
        }
    }

    function yeet(name){
        displays[name].yeeted = true
        displays[name].velocity.x=0;
        displays[name].velocity.y=45;

        let yeetImage = document.createElement("IMG");
        yeetImage.src = "images/Yeet.png"
        yeetImage.style.position = 'absolute';
        yeetImage.style.top = displays[name].image.style.top - displays[name].image.width/2;
        yeetImage.style.left = displays[name].image.style.left;
        yeetImage.width = displays[name].image.height*3;
        yeetImage.classList.add("yeet")

        let yeetChoice = Math.random()
        if(yeetChoice<0.05){
            audioElement2.play();
        }
        else{
            audioElement1.play();
        }

        document.body.appendChild(yeetImage);
        window.setTimeout(()=>{
                document.body.removeChild(yeetImage);
        },2000)
    }

    function yoink(name){
        displays[name].velocity.x=0;
        displays[name].velocity.y=-45;

        let yoinkImage = document.createElement("IMG");
        yoinkImage.src = "images/Yoink.png"
        yoinkImage.style.position = 'absolute';
        yoinkImage.style.top = displays[name].image.style.top - displays[name].image.width/2;
        yoinkImage.style.left = displays[name].image.style.left;
        yoinkImage.width = displays[name].image.height*3;
        yoinkImage.classList.add("yoink")

        let yoinkChoice = Math.random()
        if(yoinkChoice<0.01){
            audioElement5.play();
        }
        else if(yoinkChoice<0.05){
            audioElement4.play();
        }
        else{
            audioElement3.play();
        }

        document.body.appendChild(yoinkImage);
        window.setTimeout(()=>{
                document.body.removeChild(yoinkImage);
        },2000)
    }

    function flip(user){
        displays[user].velocity.x *= -1;
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
          return drop.velocity.x < drop2.velocity.x;
        }
        else {
          return drop.velocity.x > drop2.velocity.x;
        }
      }



    socket.on("message",(input)=>{

        const tags = input.tags;
        user = tags['display-name'];

        const [text, url] = input.message.split(" ");

        const dropAlliases = ["ploop","drop","noticeme","plop","nm"]

        if(dropAlliases.includes(text.toLowerCase())  && !displays[user]){

            
            const image = document.createElement("IMG");

            image.classList.add(elementClass);
            image.classList.add("alive")
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
            image.style["border-radius"] = toPixels(Math.max(image.width, image.height))
            
            const drop = new Drop(image)
        
            displays[user] = drop
            document.body.appendChild(image);

        }

        if(text.toLowerCase() == "yeet" && displays[user]){

            if(!displays[user].deleted){
                yeet(user);
            }

        }

        if(text.toLowerCase() == "yeetall" && ["broadcaster","moderator","vip"].some((type)=>(tags["badges"]||{})[type])){

            for(user of Object.keys(displays)){
                if(!displays[user].deleted){
                    yeet(user)
                }
            }
        }

        if(text.toLowerCase() == "flip" && displays[user]){

            flip(user);

        }

        if(text.toLowerCase() == "changemode" && ["broadcaster","moderator"].some((type)=>(tags["badges"]||{})[type])){
            bounceMode = !bounceMode
        }

        if(text.toLowerCase() == "yoink" && displays[user]){
            if(!displays[user].yoinked && !displays[user].deleted){
                yoink(user);
                displays[user].yoinked = true
            }

        }

        if(text.toLowerCase() == "yoinkall" && ["broadcaster","moderator","vip"].some((type)=>(tags["badges"]||{})[type])){

            for(user of Object.keys(displays)){
                if(!displays[user].yoinked && !displays[user].deleted){
                    yoink(user)
                    displays[user].yoinked = true
                }
            }
        }


    })


    function parachute() {
        const parachuteImg = document.createElement("IMG");
        parachuteImg.classList.add("parachute")
        parachuteImg.width = parachuteSize;
        parachuteImg.height = parachuteSize
        // document.body.appendChild(parachuteImg)
        parachuteImg.src = "images/parachute.png"
        return parachuteImg
    }

}


