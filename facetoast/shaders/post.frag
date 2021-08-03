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
uniform sampler2D tex_image;            ////image to synthesize            
uniform sampler2D tex_albedo;			////texture color
uniform sampler2D tex_normal;			////texture normal

in vec4 vtx_color;
in vec3 vtx_normal;
in vec2 vtx_uv;
in vec3 vtx_pos;
in vec3 vtx_tan;

out vec4 frag_color;

const vec3 LightPosition = vec3(0, 10, -10);
const vec3 LightIntensity = vec3(200);
const vec3 ka = 0.25*vec3(1., 1., 1.);
const vec3 kd = 0.8*vec3(1., 1., 1.);
const vec3 ks = vec3(2.);
const float n = 400.0;

const int MAX_N = 10;
const int BOX = 0;
const int GAUSS = 1;

//=================== Perlin-Worley Noise ===================
vec2 hash2(vec2 v)
{
	vec2 rand = vec2(0,0);
	
	// Your implementation starts here
	
	//rand  = 50.0 * 1.05 * fract(v * 0.3183099 + vec2(0.71, 0.113));
    //rand = -1.0 + 2 * 1.05 * fract(rand.x * rand.y * (rand.x + rand.y) * rand);

	//rand  = 10.0 * 1.05 * fract(v * 0.3183099 + vec2(0.71, 0.113));
    //rand = -1.0 + 2 * 1.05 * fract(rand.x * rand.y * (rand.x + rand.y) * rand);
	
	rand = fract(sin(vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)))) * 43758.5453);
	// Your implementation ends here

	return rand;
}

float perlin_noise(vec2 v) 
{
	float noise = 0;

	vec2 i = floor(v);  // cell index
	vec2 f = fract(v);  // fraction
	vec2 s = f*f*(3.0-2.0*f);  // weight using cubic Hermite function: s(x) = 3x^2-2x^3 = x^2(3-2x)

	// 2D hash for the four corners of the cell
	vec2 h_a = hash2(i);                   // bottom-left
    vec2 h_b = hash2(i + vec2(1.0, 0.0));  // bottom-right
    vec2 h_c = hash2(i + vec2(0.0, 1.0));  // top-left
    vec2 h_d = hash2(i + vec2(1.0, 1.0));  // top-right

	// 2D position vectors from the four corners of the cell
	vec2 p_a = f;                   // bottom-left
    vec2 p_b = f - vec2(1.0, 0.0);  // bottom-right
    vec2 p_c = f - vec2(0.0, 1.0);  // top-left
    vec2 p_d = f - vec2(1.0, 1.0);  // top-right

	// compute perlin noise at point v using bilinear interpolation
	float noise_bottom = mix(dot(h_a, p_a), dot(h_b, p_b), s.x);
	float noise_top = mix(dot(h_c, p_c), dot(h_d, p_d), s.x);
	noise = mix(noise_bottom, noise_top, s.y);

	return noise;
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
	// Your implementation ends here
	return noise;
}

float noiseOctave(vec2 v, int num)
{
	float sum = 0;
	// Your implementation starts here

	const float scale = 2;
	float a = 1;  // amplitude (f = 1/a is the frequency)
	float w = 0.5;

	for(int i = 0; i < num; i++) {
		sum += w*a*abs(perlin_noise(v/a));
		sum += (1-w)*a*(1-worley_noise(v/a));
		a /= scale;
	}


	// Your implementation ends here
	return sum;
} 
//=================== Blur ===================

vec3[2*MAX_N+1] getTexelColors(vec2 uv, int n) {
	// get array of texel colors (color of texel at uv, n left neighbors, and n right neighbors)
	vec3 colors[2*MAX_N+1];
	vec2 offset = vec2(1.0 / textureSize(tex_albedo, 0).x, 0.0);

	colors[0] =  texture(tex_albedo, uv).rgb;  // set color of current texel

	// set color of neighbors
	for(int i = 1; i < n+1; i++) {
		colors[i] = texture(tex_albedo, uv + i * offset).rgb;
		colors[2*n+1-i] = texture(tex_albedo, uv - i * offset).rgb;
    }

	return colors;
}

int binom(int n, int k) 
{ 
    int result = 1; 
  
    if (k > n - k) 
        k = n - k; 
  
    for (int i = 0; i < k; i++) { 
        result *= (n - i); 
        result /= (i + 1); 
    } 
  
    return result; 
} 

float[MAX_N+1] getGaussianWeights(int n) {
	float w[MAX_N+1];
	float total = pow(2.0, 2*n); 

	for (int i = 0; i < n+1; i++) {
		w[n-i] = binom(2*n, i)/total;
	}

	return w;
}

float[MAX_N+1] getBoxWeights(int n) {
	float w[MAX_N+1];

	for (int i = 0; i < MAX_N+1; i++) {
		if (i < n+1) {
			w[i] = 1.0/float(2*n+1);
		}
	}

	return w;
}

vec3 blurPass(vec3[2*MAX_N+1] colors, int n, int mode) {
	float w[MAX_N+1];
    
	if (mode == BOX) {
		w = getBoxWeights(n);
	} else {
		w = getGaussianWeights(n);
	}

	vec3 color = colors[0] * w[0];  // color contribution of current texel

	for(int i = 1; i < n + 1; i++) {
		color += (colors[i] + colors[2*n+1-i]) * w[i];
    }

	return color;
}

vec3 blur(vec2 uv, int n, int mode) {
	// based on tutorial: https://learnopengl.com/Advanced-Lighting/Bloom
	// mode == BOX: Box blur
	// mode == GAUSS: Gaussian blur

	vec3 horizontal_colors[2*MAX_N+1];
	vec2 offset = vec2(0.0, 1.0 / textureSize(tex_albedo, 0).y);

	horizontal_colors[0] = blurPass(getTexelColors(uv, n), n, mode);
	
	for (int i = 1; i < n + 1; i++) {
		horizontal_colors[i] = blurPass(getTexelColors(uv + i * offset, n), n, mode); 
		horizontal_colors[2*n+1-i] = blurPass(getTexelColors(uv - i * offset, n), n, mode); 
	}
	
	return blurPass(horizontal_colors, n, mode);
}

vec3 blurByDist(vec2 uv, vec2 uv_center, int n_max, int mode) {
	vec2 size = textureSize(tex_albedo, 0);  // dimensions of image
	vec2 center = uv_center * size;         // coodinates of focus center
	vec2 point = uv * size;                 // coodinates of current point
	float dist = length(point - center);    // distance between current point and focus center
	float max_dist;                         // max distance from focus center 
	int n;                                  // chosen blur radius

	if (uv_center.x >= 0.5 && uv_center.y >= 0.5) {
		// center in quadrant I
		max_dist = length(vec2(0.0, 0.0) * size - center);
	} else if (uv_center.x < 0.5 && uv_center.y >= 0.5) {
		// center in quadrant II
		max_dist = length(vec2(1.0, 0.0) * size - center);
	} else if (uv_center.x < 0.5 && uv_center.y < 0.5) {
		// center in quadrant III
		max_dist = length(vec2(1.0, 1.0) * size - center);
	} else {
		// center in quadrant IV
		max_dist = length(vec2(0.0, 1.0) * size - center);
	}

	float f = dist / max_dist;
	float scale = 0.89;  // adjust between 0.87 and 1.00 to change size of focus
	int iter = 10;  // adjust to change sharpness of focus boundary

	for (int i = 0; i < iter; i++) {
		f = smoothstep(0, 1, f * scale + 1 - scale);
	}

	n = min(n_max, int(n_max * f) + 1);
	return blurPass(getTexelColors(uv, n), n, mode);
}


//=================== Image Synthesis ===================

vec3 grayscale(vec3 color) {
	// based on the luminosity method
	vec3 coeff = vec3(0.2126, 0.7152, 0.0722);
	float gray = dot(coeff, color);
	return vec3(smoothstep(0, 1, gray));  // increase contrast
	return vec3(smoothstep(0, 1, gray));  // increase contrast
	return vec3(smoothstep(0, 1, gray));  // increase contrast

}

vec3 heat(float val) {
	float w = 0.0;  // color mixing weight
	vec3 c1 = vec3(61,33,27)/255.0;
	vec3 c2 = vec3(91,55,40)/255.0;
	vec3 c3 = vec3(132,76,47)/255.0;
	vec3 c4 = vec3(154,83,56)/255.0;
	vec3 c5 = vec3(189,103,45)/255.0;
	vec3 c6 = vec3(1);

	if (val < 0.2) {
		w = 5 * val;
		return mix(c1, c2, w);
	} else if (val < 0.4) {
		w = 5 * (val - 0.2);
		return mix(c2, c3, w);
	} else if (val < 0.6) {
		w = 5 * (val - 0.4);
		return mix(c3, c4, w);
	} else if (val < 0.8) {
		w = 5 * (val - 0.6);
		return mix(c4, c5, w);
	} else {
		w = 5 * (val - 0.8);
		return mix(c5, c6, w);
	}
}

vec3 noiseFilter(vec2 uv) {
	vec2 v = 500 * vec2(uv.x*1.5, uv.y);
	vec3 color = noiseOctave(v, 2) * vec3(1,1,1);
	return color;
}


vec3 getWorley(vec2 uv) {
	vec2 v = 5 * vec2(uv.x*1.5, uv.y);
	vec3 color = noiseOctave(v, 6) * vec3(1,1,1);
	return color;
}

vec3 getPerlin(vec2 uv) {
	vec2 v = 10 * vec2(uv.x*1.5, uv.y);
	vec3 color = 7 * perlin_noise(v) * vec3(1,1,1);
	return color;
}

vec3 toastImage() {

	vec3 imageColor = blur(vtx_uv, 5, BOX);		
	vec3 originalCol = blur(vtx_uv, 5, BOX);

	imageColor = grayscale(imageColor);
	if (noiseFilter(vtx_uv).x < 0.575) 
		imageColor = vec3(1);
	if (imageColor.x < 0.8) {
		imageColor = 0.9*getWorley(vtx_uv);
		if (getPerlin(vtx_uv).x > 0.5) {
			imageColor *= getPerlin(vtx_uv);
		}
		if (getWorley(vtx_uv).x < 0.8) {
			imageColor -= vec3(.3, .3, .3);
		}	
		if (imageColor.x > originalCol.x+0.2) {
			imageColor = originalCol*imageColor*1.05;
		}
	}
	imageColor = heat(imageColor.x);

	if (originalCol.x < 0.5) {
		imageColor -= 0.25*(1-getPerlin(vtx_uv*2.5)*imageColor)*vec3(0.6, .8, 1.);
	}
	return imageColor;
}

//=================== Main ===================

void main()							
{		
	//vec3 emissiveColor = texture(tex_albedo, vtx_uv).xyz;
	vec3 emissiveColor = blurByDist(vtx_uv, vec2(0.6, 0.03), 5, BOX);

	//increase contrast
	if (emissiveColor.x > 0.5 && emissiveColor.y > 0.5 && emissiveColor.z > 0.5) {
		emissiveColor = emissiveColor*vec3(1.04);
	}

	if (emissiveColor.x < 0.5 && emissiveColor.y < 0.5 && emissiveColor.z < 0.5) {
		emissiveColor = emissiveColor*vec3(0.96);
	}

	if (emissiveColor.x < 0.3 && emissiveColor.y < 0.3 && emissiveColor.z < 0.3) {
		emissiveColor = emissiveColor*vec3(0.96);
	}

	//add glow near top right corner
	emissiveColor = max(emissiveColor, emissiveColor*0.018*(2*(vtx_pos.y+2) + 0.7*vtx_pos.x));
	emissiveColor += vtx_pos.y/700;
	//color balancing
	emissiveColor.g += (vtx_pos.y)/200;
	emissiveColor.b += (vtx_pos.y)/200;
	emissiveColor.r += 0.08;
	frag_color = vec4(emissiveColor.xyz,1.f);
}	
