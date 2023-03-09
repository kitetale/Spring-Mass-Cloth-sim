#ifndef _SPRINGFROCE_HPP_
#define _SPRINGFROCE_HPP_

#include "Particle.hpp"
#include "Force.hpp"

class SpringForce : public Force
{

public:
	SpringForce(Particle *p1, Particle *p2, double dist, double ks, double kd);

	virtual void draw();
	virtual void apply_force();

private:
	Particle *const m_p1; //particle1
	Particle *const m_p2; //particle2
	double const m_dist;  //rest length
	double const m_ks, m_kd; //spring strength constants
};
#endif
