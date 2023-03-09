#include "SpringForce.hpp"

SpringForce::SpringForce(Particle *p1, Particle *p2, double dist, double ks, double kd) : 
m_p1(p1), m_p2(p2), m_dist(dist), m_ks(ks), m_kd(kd){}

void SpringForce::draw()
{
	glBegin( GL_LINES );
	glColor3f(1.0, 0.0, 0.0);
	glVertex3f( m_p1->m_Position.x, m_p1->m_Position.y, m_p1->m_Position.z);
	glColor3f(1.0, 0.0, 0.0);
	glVertex3f( m_p2->m_Position.x, m_p2->m_Position.y, m_p2->m_Position.z);
	glEnd();
}

void SpringForce::apply_force()
{
	///TODO
	// accumulated force of the first particle
	Vector3f pdiff = m_p1->m_Position - m_p2->m_Position;
	Vector3f vdiff = m_p1->m_Velocity-m_p2->m_Velocity;
	float pdiffmag = length(pdiff);
	Vector3f pdiffnorm = pdiff/pdiffmag;

	float spring = m_ks*(pdiffmag-m_dist);
	float damp = m_kd*(vdiff*pdiff)/pdiffmag;

	Vector3f force1 = -(spring+damp)*pdiffnorm;

	// set accumulated force of the first particle
	m_p1->m_ForceAccumulator = force1;

	// accumulated force of the first particle
	Vector3f force2 = -force1;

	// set accumulated force of the second particle
	m_p2->m_ForceAccumulator = force2;
}

