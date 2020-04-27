// random number in a range or random item from array
function random(min = 0, max = 1) {
    if (min instanceof Array) {
        return min[Math.floor(Math.random() * min.length)];
    } else {
        return Math.random() * (max - min) + min;
    }
}

window.onload = () => {
    console.log("Dropgame Loaded");
    const socket = io.connect("localhost:3001");
    const speed = 5;
    const elementClass = "dropImages";
    const maxSpeed = 5;
    const displays = {};
    let frame = 0;
    let banana = "https://media.giphy.com/media/IB9foBA4PVkKA/giphy.gif"; // fallback url
    let toDelete = [];
    let bounceMode = true;
    const parachuteSize = 100;
    const paracuteOffset = 35;
    
    // load audio
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


    // basic vector class might improve in the future or just migrate to p5.Vector
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        add(vec) {
            this.x += vec.x;
            this.y += vec.y;
            return this;
        }

        div(scalar) {
            const copy = new Vector(this.x, this.y);
            copy.x /= scalar;
            copy.y /= scalar;
            return copy;
        }

        mult(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }
    }

    // stores all the functionality for the drop, the constructor will set the position, velocity
    class Drop {
        constructor(image) {
            this.position = new Vector(random(image.width, window.innerWidth-image.width), 1);
            this.image = image;
            this.image.style.top = toPixels(this.position.y);
            this.image.style.left = toPixels(this.position.x);
            this.acceleration = new Vector(); // currently unused might use in future for better physics

            this.velocity = new Vector(random(-maxSpeed, maxSpeed) * 2, random(1, maxSpeed));
            this.deleted = false;
            this.mass = this.image.width / 10; // currently unused might use in future for better physics
            this.yeeted = false;
            this.parachuteImg = parachute();
            document.body.appendChild(this.parachuteImg);
        }

        // update the position of the drop and set the parachute and base image to right place
        update(speed) {
            // update position and set image position
            this.position.add(this.velocity.div(speed));
            this.image.style.top = toPixels(this.position.y);
            this.image.style.left = toPixels(this.position.x);

            // if this drop has been yeeted send the parachute flying upwards 
            // otherwise set it the correct position relative to the drop image
            if (!this.yeeted) {
                this.parachuteImg.style.top = toPixels(this.position.y - parachuteSize + 15);
                const w = this.image.width / 2;
                this.parachuteImg.style.left = toPixels(this.position.x + (w - parachuteSize / 2));
            } else {
                this.parachuteImg.style.top = toPixels(fromPixels(this.parachuteImg.style.top) - paracuteOffset);
            }

            // for yoink, if drop goes above top, set its y velocity
            if (this.position.y < 0) {
                this.velocity.y = random(1, maxSpeed);
                this.velocity.x = random(-maxSpeed, maxSpeed);
            }

        }
    }

    gameLoop();

    function toPixels(size){
        return size+"px";        
    }

    function fromPixels(size){
        return (+size.slice(0,-2));
    }

    function gameLoop() {

        let remove = [];
        for (let [user, data] of Object.entries(displays)) {
            if (!data.deleted) {
                data.update(speed);

                // check collision with walls and floor
                if (data.position.y > window.innerHeight - data.image.height) {
                    remove.push(user);
                }

                if (data.position.x < 0 || data.position.x > window.innerWidth - data.image.width) {
                    flip(user);
                }
            }
        }

        // check collisions between different drops
        for (let i = 0; i < Object.keys(displays).length; i++) {
            const a = Object.entries(displays)[i];
            if (!a[1].deleted) {
                for (let j = i + 1; j < Object.keys(displays).length; j++) {
                    processCollision(a, Object.entries(displays)[j]);
                }
            }
        }

        // remove all drops that are on the ground
        for (let d of remove) {
            displays[d].deleted = true;
            toDelete.push(d);
            const img = displays[d].image;
            const pImg = displays[d].parachuteImg;
            img.classList.remove("alive");
            img.classList.add("dead");
            pImg.classList.add("dead");

            window.setTimeout(() => {
                if (toDelete.length > 0) {
                    let a = toDelete.shift();
                    document.body.removeChild(displays[a].image);
                    document.body.removeChild(displays[a].parachuteImg);
                    delete displays[a];
                }
            }, 30000);
        }

        frame++;
        requestAnimationFrame(gameLoop);
    }

    // process the collision between two drops, 
    // if they are colliding and it is bounce mode then swap their velocities if it isn't bouncemode, 
    // yeet them
    function processCollision([user1, drop1], [user2, drop2]) {
        if (intersect(drop1.image, drop2.image) && !isMovingAway(drop1, drop2)) {
            if (bounceMode) {
                const temp = drop1.velocity.x;
                drop1.velocity.x = drop2.velocity.x;
                drop2.velocity.x = temp;
            } else {
                yeet(user1);
                yeet(user2);
            }
        }
    }

    function yeet(name){
        displays[name].yeeted = true;
        displays[name].velocity.x=0;
        displays[name].velocity.y=45;

        let yeetImage = document.createElement("IMG");
        yeetImage.src = "images/Yeet.png";
        yeetImage.style.position = 'absolute';
        yeetImage.style.top = displays[name].image.style.top - displays[name].image.width/2;
        yeetImage.style.left = displays[name].image.style.left;
        yeetImage.width = displays[name].image.height*3;
        yeetImage.classList.add("yeet");

        let yeetChoice = Math.random();
        if(yeetChoice<0.05){
            audioElement2.play();
        }
        else{
            audioElement1.play();
        }

        document.body.appendChild(yeetImage);
        window.setTimeout(()=>{
                document.body.removeChild(yeetImage);
        },2000);
    }

    //send the drop flying upward until it hits the top
    function yoink(name){
        displays[user].yoinked = true;
        displays[name].velocity.x=0;
        displays[name].velocity.y=-45;

        let yoinkImage = document.createElement("IMG");
        yoinkImage.src = "images/Yoink.png";
        yoinkImage.style.position = 'absolute';
        yoinkImage.style.top = displays[name].image.style.top - displays[name].image.width/2;
        yoinkImage.style.left = displays[name].image.style.left;
        yoinkImage.width = displays[name].image.height*3;
        yoinkImage.classList.add("yoink");

        let yoinkChoice = Math.random();
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
        },2000);
    }

    // negate the x velocity
    function flip(user){
        displays[user].velocity.x *= -1;
    }

    // check AABB collision becuase the drop have a rectangular hitbox
    function intersect(display1, display2){

        let x11 = fromPixels(display1.style.left);
        let x21 = fromPixels(display2.style.left);
        let y11 = fromPixels(display1.style.top);
        let y21 = fromPixels(display2.style.top);
        let x12 = x11 + display1.width;
        let x22 = x21 + display2.width;
        let y12 = y11 + display1.height;
        let y22 = y21 + display2.height;


        let AleftOfB = x12<x21;
        let ArightOfB = x11>x22;
        let AaboveB = y12<y21;
        let AunderB = y11>y22;

        return!(AleftOfB||ArightOfB||AaboveB||AunderB);
    }

    // check if they are moving in the same direction or not
    function isMovingAway(drop, drop2) {
        if(fromPixels(drop.image.style.left) < fromPixels(drop2.image.style.left)){
          return drop.velocity.x < drop2.velocity.x;
        }
        else {
          return drop.velocity.x > drop2.velocity.x;
        }
      }


    /*
      TODO:
      add command handler
    */
    socket.on("message",(input)=>{

        const tags = input.tags;
        user = tags['username'];

        let [text, url] = input.message.split(" ");

        const dropAlliases = ["ploop","drop","noticeme","plop","nm"];

        // a user can drop an image or emote if they currently don't have a drop on the screen
        if(dropAlliases.includes(text.toLowerCase())  && !displays[user]){
            if(url == "me" && tags["platform"]=="discord"){
                    url = tags["profile-picture"];
            }

            
            const image = document.createElement("IMG");

            image.classList.add(elementClass);
            image.classList.add("alive");
            if (tags.emotes) {
                const emoteIds = Object.keys(tags.emotes);
                const emoteId = emoteIds[Math.floor(Math.random() * emoteIds.length)];
                image.src = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/2.0`;
            } else {
                image.src = url || banana;
            }
            // if the src doesn't work use the fallback url
            image.onerror = ()=>image.src = banana;


            Math.max(image.width,image.height)==image.height?image.height = window.innerHeight/20:image.width = window.innerWidth/20;
            image.style["border-radius"] = toPixels(Math.max(image.width, image.height));
            
            const drop = new Drop(image);
        
            displays[user] = drop;
            document.body.appendChild(image);

        }

        // a drop can not be yeeted if it is deleted or it has been yeeted before
        if(text.toLowerCase() == "yeet" && displays[user]){
            if(!displays[user].deleted && !displays[user].yeeted){
                yeet(user);
            }
        }

        // mods can yeet all drops on the screen
        if(text.toLowerCase() == "yeetall" && ["broadcaster","moderator","vip"].some((type)=>(tags["badges"]||{})[type])){
            for(user of Object.keys(displays)){
                if(!displays[user].deleted){
                    yeet(user);
                }
            }
        }

        // allow a user to flip their drops x velocity
        if(text.toLowerCase() == "flip" && displays[user]){
            flip(user);
        }

        // mods can switch between bounceMode and not bounceMode (yeetMode)
        if(text.toLowerCase() == "changemode" && ["broadcaster","moderator"].some((type)=>(tags["badges"]||{})[type])){
            bounceMode = !bounceMode;
        }

        // users can yoink their drop up to the top, but only once
        if(text.toLowerCase() == "yoink" && displays[user]){
            if(!displays[user].yoinked && !displays[user].deleted){
                yoink(user);
            }

        }

        // mods can yoink all the drops on screen, this will result in all those drops being unyoinkable by their sender
        if(text.toLowerCase() == "yoinkall" && ["broadcaster","moderator","vip"].some((type)=>(tags["badges"]||{})[type])){

            for(user of Object.keys(displays)){
                if(!displays[user].yoinked && !displays[user].deleted){
                    yoink(user);                    
                }
            }
        }


    });

    // generate the parachute image
    function parachute() {
        const parachuteImg = document.createElement("IMG");
        parachuteImg.classList.add("parachute");
        parachuteImg.width = parachuteSize;
        parachuteImg.height = parachuteSize;
        parachuteImg.src = "images/parachute.png";
        return parachuteImg;
    }

};


