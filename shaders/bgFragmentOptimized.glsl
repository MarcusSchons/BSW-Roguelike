uniform sampler2D tDust;
uniform sampler2D tNebula;
uniform sampler2D tStars;
uniform vec2 vp;
uniform vec3 cam;
varying vec2 vUv;

void main ()
{
  vec2 tmpvar_1;
  tmpvar_1 = (vUv - vec2(0.5, 0.5));
  vec3 tmpvar_2;
  vec2 tmpvar_3;
  tmpvar_3.y = 1.0;
  tmpvar_3.x = (vp.y / vp.x);
  vec2 tmpvar_4;
  tmpvar_4 = (((tmpvar_1 / (tmpvar_3 * cam.z)) + cam.xy) / 32.0);
  float tmpvar_5;
  tmpvar_5 = floor((fract((sin(dot ((floor(tmpvar_4) + vec2(100.0, 100.0)), vec2(12.9898, 78.233))) * 43758.5)) * 15.0));
  vec2 tmpvar_6;
  tmpvar_6.x = (floor((float(mod (tmpvar_5, 4.0)))) * 0.25);
  tmpvar_6.y = (floor((tmpvar_5 / 4.0)) * 0.25);
  vec4 tmpvar_7;
  tmpvar_7 = texture2D (tDust, (((vec2(mod (tmpvar_4, 1.0))) * 0.25) + tmpvar_6));
  tmpvar_2 = (tmpvar_7.xyz * tmpvar_7.w);
  vec3 tmpvar_8;
  vec2 tmpvar_9;
  tmpvar_9.y = 1.0;
  tmpvar_9.x = (vp.y / vp.x);
  vec2 tmpvar_10;
  tmpvar_10 = (((tmpvar_1 / (tmpvar_9 * (((cam.z * 0.5) + 0.05) / 32.0))) + cam.xy) / 140.0);
  float tmpvar_11;
  tmpvar_11 = floor((fract((sin(dot ((floor(tmpvar_10) + vec2(100.0, 100.0)), vec2(12.9898, 78.233))) * 43758.5)) * 15.0));
  vec2 tmpvar_12;
  tmpvar_12.x = (floor((float(mod (tmpvar_11, 4.0)))) * 0.25);
  tmpvar_12.y = (floor((tmpvar_11 / 4.0)) * 0.25);
  vec4 tmpvar_13;
  tmpvar_13 = texture2D (tStars, (((vec2(mod (tmpvar_10, 1.0))) * 0.25) + tmpvar_12));
  tmpvar_8 = (tmpvar_13.xyz * tmpvar_13.w);
  float xo_14;
  vec3 ret_15;
  vec2 p0_16;
  vec2 tmpvar_17;
  tmpvar_17.y = 1.0;
  tmpvar_17.x = (vp.y / vp.x);
  p0_16 = (((tmpvar_1 / (tmpvar_17 * (((cam.z * 0.5) + 0.05) / 32.0))) + cam.xy) / 300.0);
  ret_15 = vec3(0.0, 0.0, 0.0);
  xo_14 = -1.0;
  for (float xo_14 = -1.0; xo_14 <= 1.0001; xo_14 += 1.0) {
    float yo_18;
    yo_18 = -1.0;
    for (float yo_18 = -1.0; yo_18 <= 1.0001; yo_18 += 1.0) {
      vec2 tmpvar_19;
      tmpvar_19.x = xo_14;
      tmpvar_19.y = yo_18;
      float tmpvar_20;
      tmpvar_20 = fract((sin(dot ((floor((p0_16 + tmpvar_19)) + vec2(100.0, 100.0)), vec2(12.9898, 78.233))) * 43758.5));
      float tmpvar_21;
      tmpvar_21 = floor((tmpvar_20 * 15.0));
      float tmpvar_22;
      tmpvar_22 = (((float(mod ((tmpvar_20 * 1000.31), 1.0))) * 1.7) + 0.5);
      float tmpvar_23;
      tmpvar_23 = (6.28318 * (float(mod ((tmpvar_20 * 1234.57), 1.0))));
      float tmpvar_24;
      tmpvar_24 = abs((float(mod (floor((tmpvar_20 / 37.0)), 2.0))));
      if ((tmpvar_24 < 0.001)) {
        vec2 tmpvar_25;
        tmpvar_25.x = xo_14;
        tmpvar_25.y = yo_18;
        vec2 p_26;
        p_26 = (((vec2(mod (p0_16, 1.0))) - tmpvar_25) / tmpvar_22);
        float tmpvar_27;
        tmpvar_27 = cos(tmpvar_23);
        float tmpvar_28;
        tmpvar_28 = sin(tmpvar_23);
        vec2 tmpvar_29;
        tmpvar_29 = (p_26 - vec2(0.5, 0.5));
        p_26 = tmpvar_29;
        vec2 tmpvar_30;
        tmpvar_30.x = (((tmpvar_29.x * tmpvar_27) - (tmpvar_29.y * tmpvar_28)) + 0.5);
        tmpvar_30.y = (((tmpvar_29.y * tmpvar_27) + (tmpvar_29.x * tmpvar_28)) + 0.5);
        vec2 tmpvar_31;
        tmpvar_31.x = (floor((float(mod (tmpvar_21, 4.0)))) * 0.25);
        tmpvar_31.y = (floor((tmpvar_21 / 4.0)) * 0.25);
        vec4 tmpvar_32;
        tmpvar_32 = texture2D (tNebula, ((clamp (tmpvar_30, 0.0, 1.0) * 0.25) + tmpvar_31));
        ret_15 = (ret_15 + (tmpvar_32.xyz * tmpvar_32.w));
      };
    };
  };
  vec3 tmpvar_33;
  vec2 tmpvar_34;
  tmpvar_34.y = 1.0;
  tmpvar_34.x = (vp.y / vp.x);
  vec2 tmpvar_35;
  tmpvar_35 = (((tmpvar_1 / (tmpvar_34 * 0.000411523)) + cam.xy) / 300.0);
  float tmpvar_36;
  tmpvar_36 = floor((fract((sin(dot ((floor(tmpvar_35) + vec2(100.0, 100.0)), vec2(12.9898, 78.233))) * 43758.5)) * 15.0));
  vec2 tmpvar_37;
  tmpvar_37.x = (floor((float(mod (tmpvar_36, 4.0)))) * 0.25);
  tmpvar_37.y = (floor((tmpvar_36 / 4.0)) * 0.25);
  vec4 tmpvar_38;
  tmpvar_38 = texture2D (tStars, (((vec2(mod (tmpvar_35, 1.0))) * 0.25) + tmpvar_37));
  tmpvar_33 = (tmpvar_38.xyz * tmpvar_38.w);
  float xo_39;
  vec3 ret_40;
  vec2 p0_41;
  vec2 tmpvar_42;
  tmpvar_42.y = 1.0;
  tmpvar_42.x = (vp.y / vp.x);
  p0_41 = ((((tmpvar_1 / (tmpvar_42 * 0.000411523)) + cam.xy) / 800.0) + vec2(11415.0, 10521.0));
  ret_40 = vec3(0.0, 0.0, 0.0);
  xo_39 = -1.0;
  for (float xo_39 = -1.0; xo_39 <= 1.0001; xo_39 += 1.0) {
    float yo_43;
    yo_43 = -1.0;
    for (float yo_43 = -1.0; yo_43 <= 1.0001; yo_43 += 1.0) {
      vec2 tmpvar_44;
      tmpvar_44.x = xo_39;
      tmpvar_44.y = yo_43;
      float tmpvar_45;
      tmpvar_45 = fract((sin(dot ((floor((p0_41 + tmpvar_44)) + vec2(100.0, 100.0)), vec2(12.9898, 78.233))) * 43758.5));
      float tmpvar_46;
      tmpvar_46 = floor((tmpvar_45 * 15.0));
      float tmpvar_47;
      tmpvar_47 = floor((tmpvar_45 * 1e+07));
      float tmpvar_48;
      tmpvar_48 = (((float(mod ((tmpvar_47 / 100.0), 1.0))) * 2.0) + 0.5);
      float tmpvar_49;
      tmpvar_49 = (6.28318 * (float(mod (((tmpvar_47 + 371.0) / 100.0), 1.0))));
      float tmpvar_50;
      tmpvar_50 = abs((float(mod (floor((tmpvar_47 / 37.0)), 3.0))));
      if ((tmpvar_50 < 0.001)) {
        vec2 tmpvar_51;
        tmpvar_51.x = xo_39;
        tmpvar_51.y = yo_43;
        vec2 p_52;
        p_52 = (((vec2(mod (p0_41, 1.0))) - tmpvar_51) / tmpvar_48);
        float tmpvar_53;
        tmpvar_53 = cos(tmpvar_49);
        float tmpvar_54;
        tmpvar_54 = sin(tmpvar_49);
        vec2 tmpvar_55;
        tmpvar_55 = (p_52 - vec2(0.5, 0.5));
        p_52 = tmpvar_55;
        vec2 tmpvar_56;
        tmpvar_56.x = (((tmpvar_55.x * tmpvar_53) - (tmpvar_55.y * tmpvar_54)) + 0.5);
        tmpvar_56.y = (((tmpvar_55.y * tmpvar_53) + (tmpvar_55.x * tmpvar_54)) + 0.5);
        vec2 tmpvar_57;
        tmpvar_57.x = (floor((float(mod (tmpvar_46, 4.0)))) * 0.25);
        tmpvar_57.y = (floor((tmpvar_46 / 4.0)) * 0.25);
        vec4 tmpvar_58;
        tmpvar_58 = texture2D (tNebula, ((clamp (tmpvar_56, 0.0, 1.0) * 0.25) + tmpvar_57));
        ret_40 = (ret_40 + (tmpvar_58.xyz * tmpvar_58.w));
      };
    };
  };
  vec4 tmpvar_59;
  tmpvar_59.w = 1.0;
  tmpvar_59.xyz = (((((tmpvar_2 * 0.65) + (tmpvar_8 * 0.75)) + (ret_15 * 0.2)) + (tmpvar_33 * 0.75)) + (ret_40 * 0.095));
  gl_FragColor = tmpvar_59;
}