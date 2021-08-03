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

in vec4 vtx_color;
in vec3 vtx_pos;
in vec3 vtx_tan;

out vec4 frag_color;

const vec3 LightPosition = vec3(10, 0, -10);
const vec3 LightIntensity = vec3(100);
const vec3 ka = 0.1*vec3(.3, .7, 1.);
const vec3 kd = 1*vec3(1., 1., 1.);
const vec3 ks = vec3(2.);
const float n = 400.0;
const int p = 5;  

vec4 get_color()							
{		
	vec3 emissiveColor = vec3(.2, .6, .8);

	////load the texture normal from tex_normal, and remap each component from [0, 1] to [-1, 1] (notice that currently the loaded normal is in the local tangent space)
	vec4 normRaw = texture(tex_normal, vtx_uv.xy);
	vec3 norm = 2*normRaw.xyz - 1;
	vec3 bitangent = cross(vtx_normal, vtx_tan);

	////calculate the TBN matrix using the vertex normal and tangent
	mat3 tnb = mat3(vtx_tan, bitangent, vtx_normal);
		
	////transform the texture normal from the local tangent space to the global world space
	norm = tnb * norm.xyz;

	vec3 normal = vtx_normal;
	vec3 lightDir = LightPosition - vtx_pos;
	float _lightDist = length(lightDir);
	vec3 _lightDir = normalize(lightDir);
	vec3 _localLight = LightIntensity / (_lightDist * _lightDist);
	vec3 ambColor = ka;

	//phong
	vec3 v = position.xyz - vtx_pos.xyz;					//vector from camera view to light source
	float v_norm = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
	v = v/v_norm;

	vec3 l = LightPosition - vtx_pos.xyz;				//vector from surface point to light source
	float l_norm = sqrt(l.x*l.x + l.y*l.y + l.z*l.z);
	l = l/l_norm;

	float l_dot_n = l.x * vtx_normal.x + l.y * vtx_normal.y + l.z * vtx_normal.z;

	vec3 r = 2*l_dot_n*vtx_normal - l;											//reflected vector direction
	float c = v.x*r.x + v.y*r.y + v.z*r.z;
	
	vec3 lightingColor = ambColor + kd * _localLight * max(0., dot(_lightDir, normal)) + ks * _localLight * pow(c, p);
	vec3 resultColor = emissiveColor*lightingColor;
	frag_color = vec4(resultColor.xyz,1.f);
	return frag_color;
}	

void main()
{
    vec3 normal=normalize(vtx_normal);
	vec3 color=get_color().xyz;
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