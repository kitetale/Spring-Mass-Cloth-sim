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
}

