let maxWidth = 650;
let maxHeight = 480;
let padding = 50;

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
    return [a[0]*s,a[1]*s,a[2]*s];
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
    }

    draw() {
        let x = this.m_Position[0]/this.m_Position[2];
        let y = this.m_Position[1]/this.m_Position[2];
        let r = 10;
        
		this.ctx.beginPath();
		this.ctx.moveTo(x + r, y);
		this.ctx.arc(x, y, r, 0, Math.PI * 2, false);
        this.ctx.fill();
    }

    clearForce() {
	    //reset applied force on this particle
	    this.m_ForceAccumulator = [0,0,0];
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
        let pdiff = vec3minus(this.m_p1.m_Position,this.m_p2.m_Position);
        let vdiff = vec3minus(this.m_p1.m_Velocity,this.m_p2.m_Velocity);
        var pdiffmag = vec3length(pdiff);
        let pdiffnorm = vec3div(pdiff,pdiffmag);

        var spring = this.m_ks * (pdiffmag-this.m_dist);
        var damping = this.m_kd * vec3dot(vdiff,pdiff) / pdiffmag;

        let force1 = vec3mult(pdiffnorm,-(spring+damping));

        // set accumulated force of the first particle
        this.m_p1.m_ForceAccumulator = force1;

        // accumulated force of the first particle
        let force2 = -force1;

        // set accumulated force of the second particle
        this.m_p2.m_ForceAccumulator = force2;
    }
}

// ------------------------------ CLOTH -------------------------------

let pVector = [];
let fVector = [];
const damp = 0.98;

class Cloth{
    constructor(rowN,colN,ctx){
        this.dt = 0.01;
        this.rowN = rowN;
        this.colN = colN;
        this.ctx = ctx;

        let xOffset = (maxWidth-padding*2)/(colN-1);
        let yOffset = (maxHeight-padding*2)/(rowN-1);
        let restLength = 100.0;

        let ks_stretch = 0.1;
        let kd_stretch = 0.1;
        let ks_sheer = 0.1;
        let kd_sheer = 0.1;
        let ks_bend = 0.1;
        let kd_bend = 0.1;

        // particle construct
        for (var i=0; i<rowN; i++){
            for (var j=0; j<colN; j++){
                pVector.push(new Particle([padding+j*xOffset,padding+i*yOffset,1.0],ctx))
            }
        }

        // spring force construct
        // stretch strings
        for (var i=0; i<rowN; i++){
            for (var j=0; j<colN; j++){
                // horizontal
                if (j<colN-1){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[i*colN+(j+1)], restLength, kd_stretch, ks_stretch, ctx));
                }
                // vertical
                if (i<rowN-1){
                    fVector.push(new SpringForce(pVector[i*colN+j], pVector[(i+1)*colN+j], restLength, kd_stretch, ks_stretch, ctx));
                }
            }
        }
        // sheer strings
        for (var i=0; i<rowN-1; i++){
            for (var j=0; j<colN-1; j++){
                // \ diagonal
                fVector.push(new SpringForce(pVector[i*colN+j], pVector[(i+1)*colN+(j+1)], restLength, kd_sheer, ks_sheer, ctx));
                // / diagonal
                fVector.push(new SpringForce(pVector[(i+1)*colN+j], pVector[i*colN+(j+1)], restLength, kd_sheer, ks_sheer, ctx));
            }
        }

    }

    reset(){
        let size = pVector.length;
        for(var ii=0; ii<size; ii++){
            pVector[ii].reset();
        }
    }

    draw(){
        let size = pVector.length;
        for(var ii=0; ii<size; ii++){
            pVector[ii].draw();
        }
    
        size = fVector.length;
        for(var ii=0; ii<size; ii++){
            if (ii<(this.rowN*(this.colN-1)+this.colN*(this.rowN-1))){ 
                ctx.strokeStyle = 'Crimson';
            } else if (ii>=(this.rowN*(this.colN-1)+this.colN*(this.rowN-1))){ 
                ctx.strokeStyle = 'ForestGreen';
            } else {
                ctx.strokeStyle = 'SteelBlue';
            }
            fVector[ii].draw();
        }
    }

    euler_step(){
        let size = pVector.length;
    
        for(var ii=0; ii<size; ii++){
            pVector[ii].m_Position = vec3plus(pVector[ii].m_Position, vec3mult(pVector[ii].m_Velocity, this.dt));
            pVector[ii].m_Velocity = vec3plus(vec3mult(pVector[ii].m_Velocity, damp), vec3mult(pVector[ii].m_ForceAccumulator, this.dt/pVector[ii].m_Mass));
        }
    }

    simulation_step(){
        ///first, you need to clear force accumulators for all the particles
        let size = pVector.length;
        for (var i=0; i<size; ++i){
            pVector[i].clearForce();
        }
    
        ///second, apply forces to them
        let fsize = pVector.length;
        for (var i=0; i<fsize; ++i){
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

// var p1 = new Particle([100.0,100.0,1.0],ctx);
// p1.draw();

// var p2 = new Particle([200.0,100.0,1.0],ctx);
// p2.draw();

// var s1 = new SpringForce(p1,p2,1,5,5,ctx);
// s1.draw();

var cloth = new Cloth(5,5,ctx);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cloth.simulation_step();
    cloth.draw();
    window.requestAnimationFrame(draw);
}
// cloth.draw();
window.requestAnimationFrame(draw);