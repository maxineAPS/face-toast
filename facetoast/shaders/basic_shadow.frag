#version 330 core

/*default camera matrices. do not modify unless you know what you are doing.*/
uniform camera{
	mat4 projection;	/*camera's projection matrix*/
	mat4 view;			/*camera's view matrix*/
	mat4 pvm;			/*camera's projection*view*model matrix*/
	mat4 ortho;			/*camera's ortho projection matrix*/
	vec4 position;		/*camera's position in world space*/
};
/*light related variables. do not modify unless you know what you are doing.*/
struct light
{
	ivec4 att;////0-type, 1-has_shadow, type: 0-directional, 1-point, 2-spot
	vec4 pos;
	vec4 dir;
	vec4 amb;
	vec4 dif;
	vec4 spec;
	vec4 atten;////0-const, 1-linear, 2-quad
	vec4 r;
};
uniform lights
{
	vec4 amb;
	ivec4 lt_att;	////lt_att[0]: lt num
	light lt[4];
};

/*shadow related texture and function, don't modify unless you know what you are doing*/
uniform sampler2D shadow_map;
float shadow(vec4 shadow_pos,vec3 normal,vec3 light_dir)
{
	vec3 proj_coord=shadow_pos.xyz/shadow_pos.w;
	proj_coord=proj_coord*.5f+.5f;
	
	float shadow=0.f;float dp=proj_coord.z;float step=1.f/512.f;
	float bias=max(.05f*(1.f-dot(normal,light_dir)),.005f);
	for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){
		vec2 coord=proj_coord.xy+vec2(i,j)*step;
		float dp0=texture(shadow_map,coord).r;
		shadow+=dp>dp0+bias?0.2f:1.f;}shadow/=9.f;
	return shadow;
}

/*uniform variables*/
uniform float iTime;					////time
uniform sampler2D tex_albedo;			////texture color
uniform sampler2D tex_normal;			////texture normal

/*input variables*/
in vec3 vtx_normal;
in vec3 vtx_frg_pos;
in vec4 vtx_shadow_pos;
in vec4 vtx_uv;

out vec4 frag_color;

void main()
{
    vec3 normal=normalize(vtx_normal);
	vec3 color=vec3(0.,0.,0.);
	vec3 ambient = amb.rgb;
	color += ambient;
	int light_number = lt_att[0];

	for(int i=0;i<light_number;i++){
		vec3 c0=vec3(0.f);
		vec3 light_dir=lt[i].dir.xyz;
		switch(lt[i].att[0])//light type: 0-directional, 1-point, 2-spot
		{
			case 0:{
				/*Here we provide a default calculation for directional lighting. Feel free to change them.*/
				float diff_coef=max(dot(normal,-light_dir),0.);
				vec4 diffuse=diff_coef*lt[i].dif;
				c0=diffuse.rgb;
				}break;
			case 1:{
				/*implement point light here if you have one, look at OpenGLShaderProgram.cpp line 44-60 as a reference*/
				}break;
			case 2:{
				/*implement spot light here if you have one, look at OpenGLShaderProgram.cpp line 64-83 as a reference*/
				}break;
		}

		/*calculate shadow, do not modify unless you know what you are doing*/
		float s=1.f;
		if(lt[i].att[1]!=0){
			vec3 light_dir=lt[i].att[0]==0?-lt[i].dir.xyz:normalize(lt[i].pos.xyz-vtx_frg_pos);
			s=shadow(vtx_shadow_pos,normal,light_dir);}

		color+=c0*s;
	}

	frag_color=vec4(color,1.f);
}