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

const vec3 LightPosition = vec3(0.1, 0.4, -0.1);
const vec3 LightIntensity = vec3(1);
const vec3 ka = 0.2*vec3(1., 1., 1.);
const vec3 kd = 0.42*vec3(1., 1., 1.);
const vec3 ks = vec3(2.);
const float n = 400.0;
const int p = 100;   // power index

vec2 hash2(vec2 v)
{
	vec2 rand = vec2(0,0);
	rand = fract(2*sin(vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)))) * 43758.5453);
	return rand;
}

float worley_noise(vec2 v) 
{
	float noise = 0;

	vec2 idx = floor(v);  // cell index
	vec2 fr = fract(v);   // fraction

	float min_dist = 10.;  // minimum distance 
	
	float threshold = 0.5;

	for (int j = -1; j <= 1; j++) {
		for (int i = -1; i <= 1; i++) {
			vec2 offset = vec2(float(i), float(j)); 
			vec2 rand = hash2(idx + offset);
			vec2 nb_pt = offset + rand;  
			float dist = length(nb_pt - fr);
			min_dist = min(min_dist, dist);
			
			// add an additional feature point for some cells
			if (length(rand) > threshold)
				nb_pt = offset + vec2(1) - rand;
				dist = length(nb_pt - fr);
				min_dist = min(min_dist, dist);
		}
	}
	noise = smoothstep(0, 1, min_dist);
	return noise;
}

vec4 get_color()							
{		
	vec3 emissiveColor = 1-worley_noise(20*vtx_uv.xy)*vec3(0.4, 0.18, 0.05);
	vec3 normal = vtx_normal;

	//lambertian
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

	float l_dot_n = l.x * normal.x + l.y * normal.y + l.z * normal.z;

	vec3 r = 2*l_dot_n*normal - l;											//reflected vector direction
	float c = v.x*r.x + v.y*r.y + v.z*r.z;
	
	vec3 lightingColor = ambColor + kd * _localLight * max(0., dot(_lightDir, normal)) + ks * _localLight * pow(c, p);
	vec3 resultColor = emissiveColor*lightingColor;
	return vec4(resultColor.xyz,1.f);
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

	frag_color=vec4(color,0.f);
}