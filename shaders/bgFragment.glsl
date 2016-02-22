varying vec2 vUv;

uniform vec3 cam;
uniform vec2 vp; 
uniform sampler2D tStars;
uniform sampler2D tNebula;
uniform sampler2D tDust;

#define SAMPLE_POS(I, SUB) (mod(SUB, 1.0)*0.25 + vec2(floor(mod(I, 4.0)) * 0.25, floor((I) / 4.0) * 0.25))
#define SAMPLE_POS2(I, SUB) (clamp(SUB, 0.0, 1.0)*0.25 + vec2(floor(mod(I, 4.0)) * 0.25, floor((I) / 4.0) * 0.25))
#define TO_WORLD(P, Z) ((P) / (vec2(vp.y/vp.x, 1.0)*Z) + cam.xy)

float rand (vec2 co) {
    return fract(sin(dot(co.xy+vec2(100.0, 100.0), vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rotVec (vec2 p, vec2 c, float a) {
    float ca = cos(a), sa = sin(a);
    p -= c;
    return vec2(
        p.x * ca - p.y * sa + c.x,
        p.y * ca + p.x * sa + c.y
    );
}

vec3 sampleDust (vec2 p) {

    #define DUST_SIZE 32.0

    vec2 p2 = TO_WORLD(p, cam.z) / DUST_SIZE;
    float i = floor(rand(floor(p2)) * 15.0);

    vec4 clr = texture2D(tDust, SAMPLE_POS(i, p2));
    return clr.rgb*clr.a;
}

vec3 sampleStars1 (vec2 p) {

    #define STAR_SIZE 140.0

    float z = (cam.z*0.5 + 0.5*0.1) / pow(2.0, 5.0);
    vec2 p2 = TO_WORLD(p, z) / STAR_SIZE;
    float i = floor(rand(floor(p2)) * 15.0);

    vec4 clr = texture2D(tStars, SAMPLE_POS(i, p2));
    return clr.rgb*clr.a;
}

vec3 sampleNebulas1 (vec2 p) {

    #define NEB_SIZE 300.0
    #define GRID_SIZE 3

    float z = (cam.z*0.5 + 0.5*0.1) / pow(2.0, 5.0);
    vec2 p0 = TO_WORLD(p, z) / NEB_SIZE;

    vec3 ret = vec3(0.0, 0.0, 0.0);
    for (int xo = -GRID_SIZE; xo<=GRID_SIZE; xo += 1) {
        for (int yo = -GRID_SIZE; yo<=GRID_SIZE; yo += 1) {
            vec2 p2 = floor(p0 + vec2(xo, yo));

            float k = rand(p2);
            float i = floor(k * 15.0);

            float sz = mod(k*1000.3131, 1.0) * 1.7 + 0.5;
            float angle = mod(k*1234.5678, 1.0) * 3.141592 * 2.0;

            if (abs(mod(floor(k/37.0), 2.0)) < 0.001) {
                vec4 clr = texture2D(tNebula, SAMPLE_POS2(i, rotVec((mod(p0, 1.0) - vec2(xo, yo)) / sz, vec2(0.5, 0.5), angle)));
                ret += clr.rgb * clr.a;
            }
        }
    }

    return ret;
}

vec3 sampleNebulas2 (vec2 p) {

    #define NEB_SIZE2 560.0
    #define GRID_SIZE2 3

    float z = 0.1 / pow(3.0, 5.0);
    vec2 p0 = TO_WORLD(p, z) / NEB_SIZE2 + vec2(11415, 10521);

    vec3 ret = vec3(0.0, 0.0, 0.0);
    for (int xo = -GRID_SIZE2; xo<=GRID_SIZE2; xo += 1) {
        for (int yo = -GRID_SIZE2; yo<=GRID_SIZE2; yo += 1) {
            vec2 p2 = floor(p0 + vec2(xo, yo));

            float k = rand(p2);
            float i = floor(k * 15.0);
            k = floor(k * 10000000.0);

            float sz = mod(k/100.0, 1.0) * 3.0 + 0.5;
            float angle = mod((k+371.0)/100.0, 1.0) * 3.141592 * 2.0;

            if (abs(mod(floor(k/37.0), 3.0)) < 0.001) {
                vec4 clr = texture2D(tNebula, SAMPLE_POS2(i, rotVec((mod(p0, 1.0) - vec2(xo, yo)) / sz, vec2(0.5, 0.5), angle)));
                ret += clr.rgb * clr.a;
            }
        }
    }

    return ret;
}

vec3 sampleStars2 (vec2 p) {

    #define STAR_SIZE2 300.0

    float z = 0.1 / pow(3.0, 5.0);
    vec2 p2 = TO_WORLD(p, z) / STAR_SIZE2;
    float i = floor(rand(floor(p2)) * 15.0);

    vec4 clr = texture2D(tStars, SAMPLE_POS(i, p2));
    return clr.rgb*clr.a;
}

void main() {

    vec2 p = vUv - vec2(0.5, 0.5);

    gl_FragColor = vec4(
        sampleDust(p)     * 0.65 +
        sampleStars1(p)   * 0.75 +
        sampleNebulas1(p) * 0.20  +
        sampleStars2(p)   * 0.75 +
        sampleNebulas2(p) * 0.095,
    1.0);

}