/*This is your fragment shader for texture and normal mapping*/

#version 330 core

/*default camera matrices. do not modify.*/
layout (std140) uniform camera
{
	mat4 projection;	/*camera's projection matrix*/
	mat4 view;			/*camera's view matrix*/
	mat4 pvm;			/*camera's projection*view*model matrix*/
	mat4 ortho;			/*camera's ortho projection matrix*/
	vec4 position;		/*camera's position in world space*/
};

/*uniform variables*/
uniform float iTime;					////time
uniform sampler2D tex_albedo;			////texture color
uniform sampler2D tex_normal;			////texture normal

in vec4 vtx_color;
in vec3 vtx_normal;
in vec2 vtx_uv;
in vec3 vtx_pos;
in vec3 vtx_tan;

out vec4 frag_color;

void main()							
{		
	vec3 emissiveColor = texture(tex_albedo, vtx_uv).xyz;
	frag_color = vec4(emissiveColor.xyz,1.f);
}	