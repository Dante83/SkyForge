//This helps
//--------------------------v
//https://threejs.org/docs/#api/en/core/Uniform
StarrySky.materials.atmosphere.atmosphereShader = {
  uniforms: {
    sunPosition: {type: 'vec3', value: new THREE.Vector3()},
    solarMieInscatteringSum: {type: 't', value: null},
    solarRayleighInscatteringSum: {type: 't', value: null},
  },
  vertexShader: [
    'varying vec3 vWorldPosition;',

    'void main() {',
      'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      'vWorldPosition = worldPosition.xyz;',

      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}',
  ].join('\n'),
  fragmentShader: function(mieG, packingWidth, packingHeight){
    let originalGLSL = [
    'varying vec3 vWorldPosition;',

    'uniform vec3 sunPosition;',
    'uniform sampler2D solarMieInscatteringSum;',
    'uniform sampler2D solarRayleighInscatteringSum;',

    'const float MIE_G $mieG;',
    'const float MIE_G_SQUARED $mieGSquared;',
    'const float MIE_PHASE_FUNCTION_COEFFICIENT $miePhaseFunctionCoefficient; //(1.5 * (1.0 - MIE_G_SQUARED) / (2.0 + MIE_G_SQUARED))',
    'const float ELOK_Z_CONST = 0.9726762775527075;',

    'float rayleighPhaseFunction(float cosTheta){',
      'return 0.8 * (1.4 + 0.5 * cosTheta);',
    '}',

    'float miePhaseFunction(float cosTheta){',
      'return MIE_PHASE_FUNCTION_COEFFICIENT * ((1 + cosTheta * cosTheta) / pow(1.0 + MIE_G_SQUARED - 2 * MIE_G * cosTheta, 1.5));',
    '}',

    'float parameterizationOfCosOfSourceZenithToZ(float cosTheta){',
      'return (1.0 - exp(-2.8 * cosTheta - 0.8)) / ELOK_Z_CONST;',
    '}',

    'float parameterizationOfCosOfZenithToX(float cosTheta){',
      'return 0.5 * (1.0 + cosTheta);',
    '}',

    'vec2 getUV2From3DUV(vec3 uv3Coords){',
      'float row = floor(uv3Coords.z * $packingHeight);',
      'float column = fModulo(row * packingWidth, $packingWidth);',
      'float x = (column * $packingWidth + $textureWidth * uv3Coords.x) / ($packingWidth * $textureWidth);',
      'float y = (row * $packingHeight + $textureHeight * uv3Coords.y) / ($packingHeight * $textureHeight);',
      'return vec2(x, y);',
    '}',

    'vec3 atmosphericPass(vec3 sourcePosition, vec3 vWorldPosition, sampler2D mieLookupTable, sampler2D rayleighLookupTable){',
      'float cosOfAngleBetweenCameraPixelAndSource = dot(sourcePosition, vWorldPosition);',
      'float cosOFAngleBetweenZenithAndSource = sourcePosition.y; //dot(sunPosition, vec3(0.0, 1.0, 0.0))',
      'vec3 uv3 = vec3(parameterizationOfCosOfZenithToX(cosOFAngleBetweenZenithAndSource), 0.0, parameterizationOfCosOfSourceZenithToZ(cosOfAngleBetweenCameraPixelAndSource));',
      'float pixelValue = uv3.z * $textureDepth;',
      'float floorZValue = floor(pixelValue) / $textureDepth;',
      'float ceilingZValue = ceil(pixelValue) / $textureDepth;',

      '//As we do not natively support 3D textures, we must linearly interpolate between values ourselves.',
      'vec2 uv2_0 = getUV2From3DUV(vec3(uv3.xy, floorZValue));',
      'vec2 uv2_f = getUV2From3DUV(vec3(uv3.xy, ceilingZValue));',

      '//Mie Pass',
      'vec3 mieLUTsample1 = texture2D(mieLookupTable, uv2_0).rgb;',
      'vec3 mieLUTsample2 = texture2D(mieLookupTable, uv2_f).rgb;',
      'vec3 mieLUTWeightedAvg = ((uv2_f - uv3.z) * mieLUTsample1 + (uv3.z - uv2_0) * mieLUTsample2) / (uv2_f - uv2_0);',

      '//Rayleigh Pass',
      'vec3 rayleighLUTsample1 = texture2D(rayleighLookupTable, uv2_0).rgb;',
      'vec3 rayleighLUTsample2 = texture2D(rayleighLookupTable, uv2_f).rgb;',
      'vec3 rayleighLUTWeightedAvg = ((uv2_f - uv3.z) * rayleighLUTsample1 + (uv3.z - uv2_0) * rayleighLUTsample2) / (uv2_f - uv2_0);',

      'return miePhaseFunction(cosOfAngleBetweenCameraPixelAndSun) * mieLUTWeightedAvg + rayleighPhaseFunction(cosOfAngleBetweenCameraPixelAndSun) * rayleighLUTWeightedAvg;',
    '}',

    'void main(){',
      '//Figure out where we are',

      '//Initialize our color to zero light',
      'vec3 outColor = vec3(0.0);',

      '//Milky Way Pass',


      '//Star Pass',


      '//Atmosphere',
      'vec3 solarAtmosphericPass = atmosphericPass(sunPosition, vWorldPosition, solarMieInscatteringSum, solarRayleighInscatteringSum);',

      '//Color Adjustment Pass',

      '//Triangular Blue Noise Adjustment Pass',

      'gl_FragColor = vec4(outColor, 1.0);',
    '}',
    ];

    let mieGSquared = mieG * mieG;
    let miePhaseFunctionCoefficient = (1.5 * (1.0 - mieGSquared) / (2.0 + mieGSquared));
    let textureDepth = packingWidth * packingHeight;

    let updatedLines = [];
    let numberOfChunks = numberOfPoints - 1;
    for(let i = 0, numLines = originalGLSL.length; i < numLines; ++i){
      let updatedGLSL = originalGLSL[i].replace(/\$packingWidth/g, packingWidth);
      updatedGLSL = updatedGLSL.replace(/\$packingHeight/g, packingHeight);
      updatedGLSL = updatedGLSL.replace(/\$textureDepth/g, textureDepth);
      updatedGLSL = updatedGLSL.replace(/\$mieG/g, mieG.toFixed(16));
      updatedGLSL = updatedGLSL.replace(/\$mieGSquared/g, mieGSquared.toFixed(16));
      updatedGLSL = updatedGLSL.replace(/\$miePhaseFunctionCoefficient/g, miePhaseFunctionCoefficient.toFixed(16));

      //Choose which texture to use
      updatedGLSL = updatedGLSL.replace(/\$isRayleigh/g, isRayleigh ? '1' : '0');

      //Texture depth is packingWidth * packingHeight
      updatedGLSL = updatedGLSL.replace(/\$packingWidth/g, packingWidth.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$packingHeight/g, packingHeight.toFixed(1));

      updatedLines.push(updatedGLSL);
    }

    return updatedLines.join('\n');
  }
};