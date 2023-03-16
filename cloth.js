// make sure we don't use random variable values -- instead say what's undefined
//'use strict'; 
let maxWidth = 650;
let maxHeight = 480;
let padding = 50;
let r = 10; // radius of particle circle

// ------------------------ SOME VEC3 MATH FUNC --------------------------------
function vec3plus (a,b){
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
}
function vec3minus (a,b){
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
}
function vec3length(a){
    return Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
}
function vec3mult(a,s){
    let a0,a1,a2 = 0;
    if (s==0) return [0,0,0];
    if (a[0]==0) a0 = 0;
    else a0 = a[0]*s;
    if (a[1]==0) a1 = 0;
    else a1 = a[1]*s;
    if (a[2]==0) a2 = 0;
    else a2 = a[2]*s;
    return [a0,a1,a2];
}
function vec3div(a,s){
    return [a[0]/s,a[1]/s,a[2]/s];
}
function vec3dot(a,b){
    return (a[0]*b[0]+a[1]*b[1]+a[2]*b[2]);
}
// --------------------------- PARTICLE -------------------------------
class Particle {
    constructor(ConstructPos,ctx){
        this.m_ConstructPos = ConstructPos;
        this.m_Position = ConstructPos;
        this.m_Velocity = [0.0,0.0,0.0];
        this.m_ForceAccumulator = [0.0,0.0,0.0];
        this.m_Mass = 1.0;
        this.ctx = ctx;
    }

    reset() {
        this.m_Position = this.m_ConstructPos;
        this.m_Velocity = [0.0,0.0,0.0];
        this.m_ForceAccumulator = [0.0,0.0,0.0];
    }

    draw() {
        let x = this.m_Position[0]/this.m_Position[2];
        let y = this.m_Position[1]/this.m_Position[2];
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arc(x, y, r, 0, Math.PI * 2, false);
        this.ctx.fill();
    }

    clearForce() {
        //reset applied force on this particle
        this.m_ForceAccumulator = [0.0,0.0,0.0];
    }

}


// ------------------------- SPRING FORCE -----------------------------

class SpringForce{
    constructor(p1,p2,dist,kd,ks,ctx){
        this.m_p1 = p1;
        this.m_p2 = p2;
        this.m_dist = dist;
        this.m_kd = kd;
        this.m_ks = ks;
        this.ctx = ctx;
    }

    draw(){
        this.ctx.beginPath();
        this.ctx.moveTo(this.m_p1.m_Position[0]/this.m_p1.m_Position[2],this.m_p1.m_Position[1]/this.m_p1.m_Position[2]);
        this.ctx.lineTo(this.m_p2.m_Position[0]/this.m_p2.m_Position[2],this.m_p2.m_Position[1]/this.m_p2.m_Position[2]);
        this.ctx.stroke();
    }

    apply_force(){
        // accumulated force of the first particle
        let pdiff = vec3minus(this.m_p1.m_Position,this.m_p2.m_Position); //vec3
        let vdiff = vec3minus(this.m_p1.m_Velocity,this.m_p2.m_Velocity); //vec3
        let pdiffmag = vec3length(pdiff); //float
        let pdiffnorm = vec3div(pdiff,pdiffmag); //vec3

        let spring = this.m_ks * (pdiffmag-this.m_dist); //float
        let damping = this.m_kd * vec3dot(vdiff,pdiff) / pdiffmag; //float

        let fscaler = (spring+damping == 0)? 0 : -(spring+damping); //float
        let force1 = vec3mult(pdiffnorm,fscaler); //vec3

        // set accumulated force of the first particle
        this.m_p1.m_ForceAccumulator = vec3plus(this.m_p1.m_ForceAccumulator,force1);
        console.assert(isNaN(force1[0]) === false || isNaN(force1[1]) === false || isNaN(force1[2]) === false);

        // accumulated force of the first particle
        let force2 = vec3mult(force1,-1); //vec3

        // set accumulated force of the second particle
        this.m_p2.m_ForceAccumulator = vec3plus(this.m_p2.m_ForceAccumulator,force2);
    }
}

// ------------------------------ CLOTH -------------------------------

let pVector = [];
let fVector = [];
const damp = 0.98;

class Cloth{
    constructor(rowN,colN,ks_stretch,kd_stretch,ks_sheer,kd_sheer,ks_bend,kd_bend,dt,ctx){
        this.dt = dt;
        this.rowN = rowN;
        this.colN = colN;
        this.ctx = ctx;

        let xOffset = (maxWidth-padding*2)/(colN-1);
        let yOffset = (maxHeight-padding*2)/(rowN-1);

        // set rest lengths to starting length
        let rest_stretch = Math.min(xOffset,yOffset);
        let rest_sheer = Math.sqrt(xOffset*xOffset+yOffset*yOffset);
        let rest_bend = Math.min(xOffset+xOffset,yOffset+yOffset);

        this.ks_stretch = ks_stretch;
        this.kd_stretch = kd_stretch;
        this.ks_sheer = ks_sheer;
        this.kd_sheer = kd_sheer;
        this.ks_bend = ks_bend;
        this.kd_bend = kd_bend;

        // particle construct
        for (let i=0; i<rowN; i++){
            for (let j=0; j<colN; j++){
                pVector.push(new Particle([padding+j*xOffset,padding+i*yOffset,1.0],ctx))
            }
        }

        // spring force construct
        // stretch strings (red)
        for (let i=0; i<rowN; i++){
            for (let j=0; j<colN; j++){
                // horizontal
                if (j<colN-1){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[i*colN+(j+1)], rest_stretch, kd_stretch, ks_stretch, ctx));
                }
                // vertical
                if (i<rowN-1){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[(i+1)*colN+j], rest_stretch, kd_stretch, ks_stretch, ctx));
                }
            }
        }
        
        // sheer strings (green)
        for (let i=0; i<rowN-1; i++){
            for (let j=0; j<colN-1; j++){
                // \ diagonal
                fVector.push(new SpringForce(pVector[i*colN+j], pVector[(i+1)*colN+(j+1)], rest_sheer, kd_sheer, ks_sheer, ctx));
                // / diagonal
                fVector.push(new SpringForce(pVector[(i+1)*colN+j], pVector[i*colN+(j+1)], rest_sheer, kd_sheer, ks_sheer, ctx));
            }
        }
        // bend strings (blue)
        for (let i=0; i<rowN; i++){
            for (let j=0; j<colN; j++){
                // right jump connection for bending cloth
                if (j<colN-2){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[i*colN+(j+2)], rest_bend, kd_bend, ks_bend, ctx));
                }
                // down jump connection
                if (i<rowN-2){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[(i+2)*colN+j], rest_bend, kd_bend, ks_bend, ctx));
                }
            }
        }

    }

    destroy(){
        pVector=[];
        fVector=[];
        delete this;
    }

    reset(){
        let size = pVector.length;
        for(let ii=0; ii<size; ii++){
            pVector[ii].reset();
        }
    }

    draw(){
        let size = pVector.length;
        for(let ii=0; ii<size; ii++){
            pVector[ii].draw();
        }
    
        size = fVector.length;
        for(let ii=0; ii<size; ii++){
            let stretchCount = (this.rowN*(this.colN-1)+this.colN*(this.rowN-1));
            if (ii<stretchCount){ 
                ctx.strokeStyle = 'Crimson';
            } else if (ii>=stretchCount&& ii<stretchCount+(this.rowN-1)*(this.colN-1)*2){ 
                ctx.strokeStyle = 'ForestGreen';
            } else {
                ctx.strokeStyle = 'SteelBlue';
            }
            fVector[ii].draw();
        }
    }

    euler_step(){
        let size = pVector.length;
    
        for(let ii=0; ii<size; ii++){
            pVector[ii].m_Position = vec3plus(pVector[ii].m_Position, vec3mult(pVector[ii].m_Velocity, this.dt));
            pVector[ii].m_Velocity = vec3plus(vec3mult(pVector[ii].m_Velocity, damp), vec3mult(pVector[ii].m_ForceAccumulator, this.dt/pVector[ii].m_Mass));
        }
    }

    simulation_step(){
        ///first, you need to clear force accumulators for all the particles
        let size = pVector.length;
        for (let i=0; i<size; ++i){
            pVector[i].clearForce();
        }
    
        ///second, apply forces to them
        let fsize = fVector.length;
        for (let i=0; i<fsize; ++i){
            // pVector[i].m_ForceAccumulator = [0,9.81,0];
            fVector[i].apply_force();
        }
    
        ///if you want to implement hard constraints, the third step is to calculate constraint forces
        ///for the basic cloth simulation, you can skip this.
    
        ///Then, we can move forward
        ///Change this to others if you want to implement RK2 or RK4 or other integration method
        this.euler_step();
    
        ///Finally, if you want to implement collisions, you could solve them here
        ///for the basic cloth simulation, you can skip this.
    }
}



// ----------------------- ADD CANVAS ---------------------------------------
let canvas = document.createElement("canvas");
canvas.width = "1000";
canvas.height = "800";
canvas.style.display = "flex";
canvas.style.margin = "auto";
// const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.border = "1px solid black";
document.getElementById("canvas").appendChild(canvas);

// let p1 = new Particle([100.0,100.0,1.0],ctx);
// p1.draw();

// let p2 = new Particle([200.0,100.0,1.0],ctx);
// p2.draw();

// let s1 = new SpringForce(p1,p2,1,5,5,ctx);
// s1.draw();

let cloth = new Cloth(5,5,0.2,0.2,0.2,0.2,0.2,0.2,0.1,ctx);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cloth.simulation_step();
    cloth.draw();
    window.requestAnimationFrame(draw);
}
// cloth.draw();
window.requestAnimationFrame(draw);

// ----------------------- RESET BUTTON --------------------------------------
let btn = document.createElement("button");
btn.innerHTML = "Restart";
btn.onclick = function () {
    cloth.reset();
};
btn.style.margin = "3rem auto";
btn.style.display = "flex";
btn.style.padding = "0.5rem 1rem";
btn.style.border = "2px solid #ff8a00";
btn.style.borderRadius = "10px";
btn.style.backgroundColor = "white";

btn.addEventListener("mouseenter", (event) => {
    btn.style.cursor = "pointer";
    btn.style.backgroundColor = "#ff8a00";
    btn.style.color = "white";
});
btn.addEventListener("mouseleave", (event) => {
    btn.style.backgroundColor = "white";
    btn.style.color = "black";
    btn.style.cursor = "default";
});

document.getElementById("resetButton").appendChild(btn);

// ----------------------- ADD CONTROL BUTTONS / INPUTS ---------------------

let rowInput = document.createElement("input");
rowInput.type = "number";
rowInput.value = "5";
rowInput.id = "rowInputNum";
rowInput.placeholder = "row";
let colInput = document.createElement("input");
colInput.type = "number";
colInput.value = "5";
colInput.id = "colInputNum";
colInput.placeholder = "column";

rowInput.style.display = "flex";
colInput.style.display = "flex";
rowInput.style.margin = "2rem 0.5rem 0.5rem";
colInput.style.margin = "2rem 0.5rem 0.5rem";

let h3 = document.createElement("h3");
h3.style.margin = "2rem 0.5rem 0.5rem";
document.getElementById("updateButton").appendChild(h3);
h3.innerHTML = "Cloth Dimension: ";
document.getElementById("updateButton").appendChild(rowInput);
document.getElementById("updateButton").appendChild(colInput);


let btn1 = document.createElement("button");
btn1.innerHTML = "Update";
let userRowNum = 5;
let userColNum = 5;
let ks_stretch = 0.2;
let kd_stretch = 0.2;
let ks_sheer = 0.2;
let kd_sheer = 0.2;
let ks_bend = 0.2;
let kd_bend = 0.2;
let dt = 0.1;
btn1.onclick = function () {
    cloth.destroy();
    userRowNum = document.getElementById("rowInputNum").value;
    userColNum = document.getElementById("colInputNum").value;
    ks_stretch = document.getElementById("ks_stretch").value;
    kd_stretch = document.getElementById("kd_stretch").value;
    ks_sheer = document.getElementById("ks_sheer").value;
    kd_sheer = document.getElementById("kd_sheer").value;
    ks_bend = document.getElementById("ks_bend").value;
    kd_bend = document.getElementById("kd_bend").value;
    dt = document.getElementById("dt").value;

    cloth = new Cloth(userRowNum,userColNum,ks_stretch,kd_stretch,ks_sheer,kd_sheer,ks_bend,kd_bend,dt,ctx);
};
btn1.style.margin = "2rem 0.5rem 0.5rem";
btn1.style.display = "flex";
btn1.style.padding = "0.5rem 1rem";
btn1.style.border = "2px solid #ff8a00";
btn1.style.borderRadius = "10px";
btn1.style.backgroundColor = "white";

btn1.addEventListener("mouseenter", (event) => {
    btn1.style.cursor = "pointer";
    btn1.style.backgroundColor = "#ff8a00";
    btn1.style.color = "white";
});
btn1.addEventListener("mouseleave", (event) => {
    btn1.style.backgroundColor = "white";
    btn1.style.color = "black";
    btn1.style.cursor = "default";
});

document.getElementById("updateButton").appendChild(btn1);

// STRETCH INPUTS
let stretch_ks = document.createElement("input");
stretch_ks.type = "number";
stretch_ks.value = "0.2";
stretch_ks.id = "ks_stretch";
stretch_ks.placeholder="ks";
stretch_ks.size = "5";
stretch_ks.style.margin = "1rem 0.5rem 2rem";
stretch_ks.style.width = "60px";
let stretch_kd = document.createElement("input");
stretch_kd.type = "number";
stretch_kd.value = "0.2";
stretch_kd.id = "kd_stretch";
stretch_kd.placeholder="kd";
stretch_kd.size = "5";
stretch_kd.style.margin = "1rem 0.5rem 2rem";
stretch_kd.style.width = "60px";
let h3_stretch = document.createElement("h3");
h3_stretch.style.margin = "1rem 0.5rem 2rem";

document.getElementById("parameters").appendChild(h3_stretch);
h3_stretch.innerHTML = "Stretch: ";
document.getElementById("parameters").appendChild(stretch_ks);
document.getElementById("parameters").appendChild(stretch_kd);

// SHEER INPUTS
let sheer_ks = document.createElement("input");
sheer_ks.type = "number";
sheer_ks.value = "0.2";
sheer_ks.id = "ks_sheer";
sheer_ks.placeholder="ks";
sheer_ks.size = "5";
sheer_ks.style.margin = "1rem 0.5rem 2rem";
sheer_ks.style.width = "60px";
let sheer_kd = document.createElement("input");
sheer_kd.type = "number";
sheer_kd.value = "0.2";
sheer_kd.id = "kd_sheer";
sheer_kd.placeholder="kd";
sheer_kd.size = "5";
sheer_kd.style.margin = "1rem 0.5rem 2rem";
sheer_kd.style.width = "60px";
let h3_sheer = document.createElement("h3");
h3_sheer.style.margin = "1rem 0.5rem 2rem 2.5rem";

document.getElementById("parameters").appendChild(h3_sheer);
h3_sheer.innerHTML = "Sheer: ";
document.getElementById("parameters").appendChild(sheer_ks);
document.getElementById("parameters").appendChild(sheer_kd);

// BEND INPUTS
let bend_ks = document.createElement("input");
bend_ks.type = "number";
bend_ks.value = "0.2";
bend_ks.id = "ks_bend";
bend_ks.placeholder="ks";
bend_ks.size = "5";
bend_ks.style.margin = "1rem 0.5rem 2rem";
bend_ks.style.width = "60px";
let bend_kd = document.createElement("input");
bend_kd.type = "number";
bend_kd.value = "0.2";
bend_kd.id = "kd_bend";
bend_kd.placeholder="kd";
bend_kd.size = "5";
bend_kd.style.margin = "1rem 0.5rem 2rem";
bend_kd.style.width = "60px";
let h3_bend = document.createElement("h3");
h3_bend.style.margin = "1rem 0.5rem 2rem 2.5rem";

document.getElementById("parameters").appendChild(h3_bend);
h3_bend.innerHTML = "Bend: ";
document.getElementById("parameters").appendChild(bend_ks);
document.getElementById("parameters").appendChild(bend_kd);

// dt INPUT
let dt_input = document.createElement("input");
dt_input.type = "number";
dt_input.value = "0.1";
dt_input.id = "dt";
dt_input.placeholder="dt";
dt_input.size = "5";
dt_input.style.margin = "1rem 0.5rem 2rem";
dt_input.style.width = "60px";
let h3_dt = document.createElement("h3");
h3_dt.style.margin = "1rem 0.5rem 2rem 2.5rem";
document.getElementById("parameters").appendChild(h3_dt);
h3_dt.innerHTML = "dt: ";
document.getElementById("parameters").appendChild(dt_input);

// --------------------------- INTERACTION -------------------------------------
let getMouseCoords = (e) => {
    let canvasCoords = canvas.getBoundingClientRect()
    return {
        x: e.clientX - canvasCoords.left,
        y: e.clientY - canvasCoords.top
    }
}
let getOffsetCoords = (e, particle) => {
    let mouseX = e.clientX
    let mouseY = e.clientY
    return {
        x: mouseX - (particle.m_Position[0]/particle.m_Position[2]),
        y: mouseY - (particle.m_Position[1]/particle.m_Position[2])
    }
}
let cursorOnPoint = (mouseX, mouseY, particle) => {
    let particleX = (particle.m_Position[0]/particle.m_Position[2]);
    let particleY = (particle.m_Position[1]/particle.m_Position[2]);
    let xAxis = mouseX>particleX-r && mouseX<particleX+r;
    let yAxis = mouseY>particleY-r && mouseY<particleY+r;

    return xAxis && yAxis;
}

let dragging = false;
let curIndex = -1;

function mouseMove(e){
    let mouseCoord = getMouseCoords(e);
    if (dragging && curIndex>=0){
        let p = pVector[curIndex];
        p.m_ForceAccumulator = [0,0,0];
        p.m_Velocity = [0,0,0];
        let zPos = p.m_Position[2];
        // update this particle's position to where mouse is dragging
        p.m_Position = [mouseCoord.x*zPos,mouseCoord.y*zPos,zPos];
    }
}

function mouseDown(e){
    let size = pVector.length;
    for (let i=0; i<size; i++){
        let p = pVector[i];
        let mouseCoord = getMouseCoords(e);
        if (cursorOnPoint(mouseCoord.x,mouseCoord.y,p)){
            p.m_ForceAccumulator = [0,0,0];
            p.m_Velocity = [0,0,0];
            let zPos = p.m_Position[2];
            // update this particle's position to where mouse is dragging
            p.m_Position = [mouseCoord.x*zPos,mouseCoord.y*zPos,zPos];
            dragging = true;
            curIndex = i;
            // canvas.onmousemove = mouseMove;
            canvas.addEventListener('mousemove',mouseMove);

        }
    }
}

function mouseUp(){
    dragging = false;
    curIndex = -1;
    // canvas.onmousemove = null;
    canvas.removeEventListener('mousemove',mouseMove);
}

canvas.addEventListener('mousedown',mouseDown);
canvas.addEventListener('mouseup',mouseUp);
// canvas.onmousedown = mouseDown;
// canvas.onmouseup = mouseUp;