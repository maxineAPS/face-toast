/*This is your first vertex shader!*/

#version 330 core

#define PI 3.14159265

/*default camera matrices. do not modify.*/
layout (std140) uniform camera
{
	mat4 projection;	/*camera's projection matrix*/
	mat4 view;			/*camera's view matrix*/
	mat4 pvm;			/*camera's projection*view*model matrix*/
	mat4 ortho;			/*camera's ortho projection matrix*/
	vec4 position;		/*camera's position in world space*/
};

/*input variables*/
layout (location=0) in vec4 pos;		/*vertex position*/
layout (location=1) in vec4 color;		/*vertex color*/
layout (location=2) in vec4 normal;		/*vertex normal*/	
layout (location=3) in vec4 uv;			/*vertex uv*/		
layout (location=4) in vec4 tangent;	/*vertex tangent*/

uniform mat4 model;						////model matrix

/*output variables*/

out vec4 vtx_color;
out vec3 vtx_normal;
out vec2 vtx_uv;
out vec3 vtx_pos;
out vec3 vtx_tan;

void main()												
{
	//// TODO: set your out varialbes
	vtx_color=vec4(color.rgb,1.f);
	vtx_normal=normal.xyz;
	vtx_uv=uv.xy;
	vtx_pos = pos.xyz;
	vtx_tan = tangent.xyz;

	float x = vtx_pos.x;
	float y = vtx_pos.y;
	float z = vtx_pos.z;

	//spherical coordinates
	float r = sqrt(x*x + y*y + z*z);
	float theta = acos(z/r);
	float p = atan(y/x);

	//uv coordinates
	float u = (p/(3.141599) + 0.5);
	float v = theta/(3.141599);

	gl_Position=pvm*model*vec4(pos.xyz,1.f);
}	