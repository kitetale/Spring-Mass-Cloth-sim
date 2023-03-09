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
        let pdiff = this.m_p1.m_Position - this.m_p2.m_Position;
        let vdiff = this.m_p1.m_Velocity - this.m_p2.m_Velocity;
        var pdiffmag = length(pdiff);
        let pdiffnorm = pdiff / pdiffmag;

        var spring = this.m_ks * (pdiffmag-this.m_dist);
        var damping = this.m_kd * (vdiff*pdiff) / pdiffmag;

        let force1 = -(spring+damping) * pdiffnorm;

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
    constructor(ctx){
        this.dt = 0.1;
        this.ctx = ctx;
        let dist = 2.0;

        pVector.push(new Particle([50.0,100.0,1.0], ctx));
        pVector.push(new Particle([150.0,100.0,1.0], ctx));
        pVector.push(new Particle([250.0,100.0,1.0], ctx));

        fVector.push(new SpringForce(pVector[0], pVector[1], dist, 1.0, 1.0, ctx));
        fVector.push(new SpringForce(pVector[1], pVector[2], dist, 1.0, 1.0, ctx));
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
            fVector[ii].draw();
        }
    }

    simulation_step(){
        ///first, you need to clear force accumulators for all the particles
        let size = pVector.length;
        for (var i=0; i<size; ++i){
            pVector[i].clearForce();
        }
    
        ///second, apply forces to them
        let fsize = fVector.length;
        for (var i=0; i<fsize; ++i){
            fVector[i].apply_force();
        }
    
        ///if you want to implement hard constraints, the third step is to calculate constraint forces
        ///for the basic cloth simulation, you can skip this.
    
        ///Then, we can move forward
        ///Change this to others if you want to implement RK2 or RK4 or other integration method
        euler_step();
    
        ///Finally, if you want to implement collisions, you could solve them here
        ///for the basic cloth simulation, you can skip this.
    }

    euler_step(){
        let size = pVector.size();
    
        for(var ii=0; ii<size; ii++){
            pVector[ii].m_Position += this.dt*pVector[ii].m_Velocity;
            pVector[ii].m_Velocity = damp*(pVector[ii].m_Velocity) + this.dt*pVector[ii].m_ForceAccumulator/pVector[ii].m_Mass;
        }
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = 'black';
ctx.strokeStyle = 'black';
ctx.strokeRect(0,0,canvas.width,canvas.height);

// var p1 = new Particle([100.0,100.0,1.0],ctx);
// p1.draw();

// var p2 = new Particle([200.0,100.0,1.0],ctx);
// p2.draw();

// var s1 = new SpringForce(p1,p2,1,5,5,ctx);
// s1.draw();

var cloth = new Cloth(ctx);
cloth.draw();