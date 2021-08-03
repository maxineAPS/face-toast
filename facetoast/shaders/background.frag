#version 330 core
uniform vec4 color=vec4(0.f,1.f,0.f,1.f);

in vec3 vtx_frg_pos;

out vec4 frag_color;

void main()								
{ 
	frag_color=vec4(0.f,.3f,0.f,1.f);
}	