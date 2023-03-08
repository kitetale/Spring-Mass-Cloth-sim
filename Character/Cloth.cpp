#include "Cloth.hpp"
#include "SpringForce.hpp"
#include <cstdlib>

static std::vector<Particle*> pVector;
static std::vector<Force*> fVector;

#define RAND (((rand()%2000)/1000.f)-1.f)
#define DAMP 0.98f

Cloth::Cloth(){

	///TODO: delete all the things below in this function after you get the physics right for the particles.
	/// You need to arrange your particles to form a piece of cloth

	dt = 0.1;

	double dist = 2.0;
	Vector3f center = make_vector(0.0f, 5.0f, 0.0f);
	Vector3f offset = make_vector(2.0f, 0.0f, 0.0f);

	pVector.push_back(new Particle(center + offset));
	pVector.push_back(new Particle(center + offset + offset));
	pVector.push_back(new Particle(center + offset + offset + offset));

	fVector.push_back(new SpringForce(pVector[0], pVector[1], dist, 1.0, 1.0));
	fVector.push_back(new SpringForce(pVector[1], pVector[2], dist, 1.0, 1.0));
}

Cloth::~Cloth(){
	pVector.clear();
	fVector.clear();
}

void Cloth::reset(){
	int size = pVector.size();
	for(int ii=0; ii<size; ii++){
		pVector[ii]->reset();
	}
}

void Cloth::draw(){
	int size = pVector.size();
	for(int ii=0; ii<size; ii++){
		pVector[ii]->draw();
	}

	size = fVector.size();
	for(int ii=0; ii<size; ii++){
		fVector[ii]->draw();
	}
}

void Cloth::simulation_step(){

	///TODO:
	
	///first, you need to clear force accumulators for all the particles

	///second, apply forces to them

	///if you want to implement hard constraints, the third step is to calculate constraint forces
	///for the basic cloth simulation, you can skip this.

	///Then, we can move forward
	///Change this to others if you want to implement RK2 or RK4 or other integration method
	euler_step();

	///Finally, if you want to implement collisions, you could solve them here
	///for the basic cloth simulation, you can skip this.
}

void Cloth::euler_step(){
	///TODO:
	///Modify things below to take a real euler step
	int ii, size = pVector.size();

	for(ii=0; ii<size; ii++){
		pVector[ii]->m_Position += dt*pVector[ii]->m_Velocity;
		pVector[ii]->m_Velocity = DAMP*pVector[ii]->m_Velocity + make_vector< float >(RAND, RAND, 0.0)*0.005;
	}
}

