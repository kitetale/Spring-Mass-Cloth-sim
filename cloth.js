// make sure we don't use random variable values -- instead say what's undefined
'use strict'; 

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

        // console.assert(isNaN(force1[0]) === false || isNaN(force1[1]) === false || isNaN(force1[2]) === false);
        if (isNaN(force1[0]) === true || isNaN(force1[1]) === true || isNaN(force1[2]) === true){
            force1 = [0,0,0];
        }

        // set accumulated force of the first particle
        this.m_p1.m_ForceAccumulator = vec3plus(this.m_p1.m_ForceAccumulator,force1);
        

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
    constructor(rowN,colN,ctx){
        this.dt = 0.1;
        this.rowN = rowN;
        this.colN = colN;
        this.ctx = ctx;

        let xOffset = (maxWidth-padding*2)/(colN-1);
        let yOffset = (maxHeight-padding*2)/(rowN-1);

        // set rest lengths to starting length
        let rest_stretch = Math.min(xOffset,yOffset);
        let rest_sheer = Math.sqrt(xOffset*xOffset+yOffset*yOffset);
        let rest_bend = Math.min(xOffset+xOffset,yOffset+yOffset);

        let ks_stretch = 1;
        let kd_stretch = 1;
        let ks_sheer = 1;
        let kd_sheer = 0.8;
        let ks_bend = 1;
        let kd_bend = 0.6;

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

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.border = "1px solid black";
ctx.fillStyle = "FloralWhite";

// let p1 = new Particle([100.0,100.0,1.0],ctx);
// p1.draw();

// let p2 = new Particle([200.0,100.0,1.0],ctx);
// p2.draw();

// let s1 = new SpringForce(p1,p2,1,5,5,ctx);
// s1.draw();

let cloth = new Cloth(18,18,ctx);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cloth.simulation_step();
    cloth.draw();
    window.requestAnimationFrame(draw);
}
// cloth.draw();
window.requestAnimationFrame(draw);

function playSimulation(){
    cloth.reset();
    window.requestAnimationFrame(draw);
}

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
            canvas.addEventListener('mousemove',mouseMove);
        }
    }
}

function mouseUp(){
    dragging = false;
    curIndex = -1;
    canvas.removeEventListener('mousemove',mouseMove);
}

canvas.addEventListener('mousedown',mouseDown);
canvas.addEventListener('mouseup',mouseUp);