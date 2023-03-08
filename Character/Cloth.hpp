#ifndef _CLOTH_HPP_
#define _CLOTH_HPP_

#include "Particle.hpp"
#include "Force.hpp"
#include "SpringForce.hpp"

#include <vector>

class Cloth {
public:
	Cloth();
	~Cloth();

public:
	float dt = 0.1f;

	void reset();
	void draw();

	void simulation_step();
	void euler_step();
};

#endif

