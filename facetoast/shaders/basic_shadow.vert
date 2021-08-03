#version 330 core
layout(std140) uniform camera{
	mat4 projection;	/*camera's projection matrix*/
	mat4 view;			/*camera's view matrix*/
	mat4 pvm;			/*camera's projection*view*model matrix*/
	mat4 ortho;			/*camera's ortho projection matrix*/
	vec4 position;		/*camera's position in world space*/
};
uniform mat4 shadow_pv;
uniform mat4 model=mat4(1.0f);
layout (location=0) in vec4 pos;		/*vertex position*/
layout (location=1) in vec4 color;		/*vertex color*/
layout (location=2) in vec4 normal;		/*vertex normal*/	
layout (location=3) in vec4 uv;			/*vertex uv*/		
layout (location=4) in vec4 tangent;	/*vertex tangent*/
out vec3 vtx_normal;
out vec3 vtx_frg_pos;
out vec4 vtx_shadow_pos;
out vec4 vtx_uv;


void main()
{
	gl_Position=pvm*model*vec4(pos.xyz,1.f);
	vtx_normal=vec3(normal);
	vtx_frg_pos=vec3(model*vec4(pos.xyz,1.f));
    vtx_shadow_pos=shadow_pv*model*vec4(pos.xyz,1.f);
	vtx_uv = uv;
}