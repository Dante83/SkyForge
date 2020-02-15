//This helps
//--------------------------v
//https://threejs.org/docs/#api/en/core/Uniform
//Currently has no uniforms, but might get them in the future
StarrySky.materials.atmosphere.singleScatteringMaterial = {
  uniforms: {
    transmittanceTexture: {type: 't', value: null}
  },
  fragmentShader: function(numberOfPoints, textureWidth, textureHeight, packingWidth, packingHeight, isRayleigh){
    let originalGLSL = [
    '//Based on the thesis of from http://publications.lib.chalmers.se/records/fulltext/203057/203057.pdf',
    '//By Gustav Bodare and Edvard Sandberg',

    'uniform sampler2D transmittanceTexture;',

    'const float PI_OVER_TWO = 1.57079632679;',
    'const float RADIUS_OF_EARTH = 6366.7;',
    'const float RADIUS_OF_EARTH_SQUARED = 40534868.89;',
    'const float RADIUS_OF_EARTH_PLUS_RADIUS_OF_ATMOSPHERE_SQUARED = 41559940.89;',
    'const float RADIUS_ATM_SQUARED_MINUS_RADIUS_EARTH_SQUARED = 1025072.0;',
    'const float ATMOSPHERE_HEIGHT = 80.0;',
    'const float ATMOSPHERE_HEIGHT_SQUARED = 6400.0;',
    'const float ONE_OVER_MIE_SCALE_HEIGHT = 0.833333333333333333333333333333333333;',
    'const float ONE_OVER_RAYLEIGH_SCALE_HEIGHT = 0.125;',
    'const float OZONE_PERCENT_OF_RAYLEIGH = 0.0000006;',
    '//Mie Beta / 0.9, http://www-ljk.imag.fr/Publications/Basilic/com.lmc.publi.PUBLI_Article@11e7cdda2f7_f64b69/article.pdf',
    '//const float EARTH_MIE_BETA_EXTINCTION = 0.00000222222222222222222222222222222222222222;',
    'const float EARTH_MIE_BETA_EXTINCTION = 0.0044444444444444444444444444444444444444444444;',
    'const float ELOK_Z_CONST = 0.9726762775527075;',
    'const float ONE_OVER_EIGHT_PI = 0.039788735772973836;',
    'const vec3 intensity = vec3(15.0);',

    '//8 * (PI^3) *(( (n_air^2) - 1)^2) / (3 * N_atmos * ((lambda_color)^4))',
    '//(http://publications.lib.chalmers.se/records/fulltext/203057/203057.pdf - page 10)',
    '//n_air = 1.00029',
    '//N_atmos = 2.545e25',
    '//lambda_red = 650nm',
    '//labda_green = 510nm',
    '//lambda_blue = 475nm',
    'const vec3 RAYLEIGH_BETA = vec3(5.8e-3, 1.35e-2, 3.31e-2);',

    '//As per http://skyrenderer.blogspot.com/2012/10/ozone-absorption.html',
    'const vec3 OZONE_BETA = vec3(413.470734338, 413.470734338, 2.1112886E-13);',

    '//Texture setup',
    'const float textureWidth = $textureWidth;',
    'const float textureHeight = $textureHeight;',
    'const float packingWidth = $packingWidth;',
    'const float packingHeight = $packingHeight;',

    'vec2 intersectRaySphere(vec2 rayOrigin, vec2 rayDirection) {',
        'float b = dot(rayDirection, rayOrigin);',
        'float c = dot(rayOrigin, rayOrigin) - RADIUS_OF_EARTH_PLUS_RADIUS_OF_ATMOSPHERE_SQUARED;',
        'float t = (-b + sqrt((b * b) - c));',
        'return rayOrigin + t * rayDirection;',
    '}',

    '//From page 178 of Real Time Collision Detection by Christer Ericson',
    'bool intersectsSphere(vec2 origin, vec2 direction, float radius){',
      '//presume that the sphere is located at the origin (0,0)',
      'bool collides = true;',
      'float b = dot(origin, direction);',
      'float c = dot(origin, origin) - radius * radius;',
      'if(c > 0.0 && b > 0.0){',
        'collides = false;',
      '}',
      'else{',
        'collides = (b * b - c) < 0.0 ? false : true;',
      '}',
      'return collides;',
    '}',

    '//Converts the parameterized x to cos(zenith) of the sun',
    'float inverseParameterizationOfZToCosOfSunZenith(float z){',
        'return -(log(1.0 - z * ELOK_Z_CONST) + 0.8) / 2.8;',
    '}',

    '//Converts the parameterized x to cos(zenith) where zenith is between 0 and pi',
    'float inverseParameterizationOfXToCosOfZenith(float x){',
      'return 2.0 * x - 1.0;',
    '}',

    '//Converts the cosine of a given theta to a pixel x location betweeen 0 and 1',
    'float parameterizationOfCosOfZenithToX(float cs_theta){',
      'return 0.5 * (1.0 + cs_theta);',
    '}',

    '//Converts the parameterized y to a radius (r + R_e) between R_e and R_e + 80',
    'float inverseParameterizationOfYToRPlusRe(float y){',
      'return sqrt(y * y * RADIUS_ATM_SQUARED_MINUS_RADIUS_EARTH_SQUARED + RADIUS_OF_EARTH_SQUARED);',
    '}',

    '//Converts radius (r + R_e) to a y value between 0 and 1',
    'float parameterizationOfHeightToY(float r){',
      'return sqrt((r * r - RADIUS_OF_EARTH_SQUARED) / RADIUS_ATM_SQUARED_MINUS_RADIUS_EARTH_SQUARED);',
    '}',

    'vec3 get3DUVFrom2DUV(vec2 glFragCoords){',
      'float row = floor(glFragCoords.y / textureHeight);',
      'float column = floor(glFragCoords.x / textureWidth);',
      'float zPixelCoord = row * packingWidth + column;',
      'vec3 uv;',
      'uv.x = (glFragCoords.x - column * textureWidth) / textureWidth;',
      'uv.y = (glFragCoords.y - row * textureHeight) / textureHeight;',
      'uv.z = zPixelCoord / (packingWidth * packingHeight - 1.0);',

      'return uv;',
    '}',

    'void main(){',
      '//This is actually a packed 3D Texture',
      '//vec3 uv = vec3(gl_FragCoord.xy / resolution.xy, 0.7);',
      'vec3 uv = get3DUVFrom2DUV(gl_FragCoord.xy);',
      'float r = inverseParameterizationOfYToRPlusRe(uv.y);',
      'float h = r - RADIUS_OF_EARTH;',
      'vec2 pA = vec2(0.0, r);',
      'vec2 p = pA;',
      'float cosOfViewZenith = inverseParameterizationOfXToCosOfZenith(uv.x);',
      'float cosOfSunZenith = inverseParameterizationOfZToCosOfSunZenith(uv.z);',
      '//sqrt(1.0 - cos(zenith)^2) = sin(zenith), which is the view direction',
      'vec2 cameraDirection = vec2(sqrt(1.0 - cosOfViewZenith * cosOfViewZenith), cosOfViewZenith);',
      'vec2 sunDirection = vec2(sqrt(1.0 - cosOfSunZenith * cosOfSunZenith), cosOfSunZenith);',
      'float initialSunAngle = atan(sunDirection.x, sunDirection.y);',

      '//Check if we intersect the earth. If so, return a transmittance of zero.',
      '//Otherwise, intersect our ray with the atmosphere.',
      'vec2 pB = intersectRaySphere(vec2(0.0, r), cameraDirection);',
      'float distFromPaToPb = distance(pA, pB);',
      'float chunkLength = distFromPaToPb / $numberOfChunks;',
      'vec2 direction = (pB - pA) / distFromPaToPb;',
      'vec2 deltaP = direction * chunkLength;',

      'bool intersectsEarth = intersectsSphere(p, cameraDirection, RADIUS_OF_EARTH);',
      'vec3 totalInscattering = vec3(0.0);',
      'if(!intersectsEarth){',
        '//Prime our trapezoidal rule',
        'float previousMieDensity = exp(-h * ONE_OVER_MIE_SCALE_HEIGHT);',
        'float previousRayleighDensity = exp(-h * ONE_OVER_RAYLEIGH_SCALE_HEIGHT);',
        'float totalDensityMie = 0.0;',
        'float totalDensityRayleigh = 0.0;',

        'vec3 transmittancePaToP = vec3(1.0);',
        '//Was better when this was just the initial angle of the sun',
        'vec2 uvt = vec2(parameterizationOfCosOfZenithToX(cosOfSunZenith), parameterizationOfHeightToY(r));',
        'vec3 transmittance = transmittancePaToP * texture2D(transmittanceTexture, uvt).rgb;',

        '#if($isRayleigh)',
          'vec3 previousInscattering = previousMieDensity * transmittance;',
        '#else',
          'vec3 previousInscattering = previousRayleighDensity * transmittance;',
        '#endif',

        '//Integrate from Pa to Pb to determine the total transmittance',
        '//Using the trapezoidal rule.',
        'float mieDensity;',
        'float rayleighDensity;',
        'float integralOfOzoneDensityFunction;',
        'float r_p;',
        'float sunAngle;',
        'vec3 inscattering;',
        '#pragma unroll',
        'for(int i = 1; i < $numberOfChunksInt; i++){',
          'p += deltaP;',
          'r_p = length(p);',
          'h = r_p - RADIUS_OF_EARTH;',
          '//Do I add or subtract the angle? O_o',
          'sunAngle = initialSunAngle + atan(p.x, p.y);',

          '//Iterate our progress through the transmittance along P',
          '//We do this for both mie and rayleigh as we are reffering to the transmittance here',
          'mieDensity = exp(-h * ONE_OVER_MIE_SCALE_HEIGHT);',
          'rayleighDensity = exp(-h * ONE_OVER_RAYLEIGH_SCALE_HEIGHT);',
          'totalDensityMie += (previousMieDensity + mieDensity) * chunkLength * 0.5;',
          'totalDensityRayleigh += (previousRayleighDensity + rayleighDensity) * chunkLength * 0.5;',
          '//integralOfOzoneDensityFunction = totalDensityRayleigh * OZONE_PERCENT_OF_RAYLEIGH;',
          'integralOfOzoneDensityFunction = 0.0;',
          'transmittancePaToP = exp(-1.0 * (totalDensityRayleigh * RAYLEIGH_BETA + totalDensityMie * EARTH_MIE_BETA_EXTINCTION + integralOfOzoneDensityFunction * OZONE_BETA));',

          '//Now that we have the transmittance from Pa to P, get the transmittance from P to Pc',
          '//and combine them to determine the net transmittance',
          'uvt = vec2(parameterizationOfCosOfZenithToX(cos(sunAngle)), parameterizationOfHeightToY(r_p));',
          'transmittance = transmittancePaToP * texture2D(transmittanceTexture, uvt).rgb;',
          '#if($isRayleigh)',
            '//Is Rayleigh Scattering',
            'inscattering = rayleighDensity * transmittance;',
          '#else',
            '//Is Mie Scattering',
            'inscattering = mieDensity * transmittance;',
          '#endif',
          'totalInscattering += (previousInscattering + inscattering) * chunkLength;',

          '//Store our values for the next iteration',
          'previousInscattering = inscattering;',
          'previousMieDensity = mieDensity;',
          'previousRayleighDensity = rayleighDensity;',
        '}',
        '#if($isRayleigh)',
          'totalInscattering *= ONE_OVER_EIGHT_PI * intensity * RAYLEIGH_BETA;',
        '#else',
          'totalInscattering *= ONE_OVER_EIGHT_PI * intensity * EARTH_MIE_BETA_EXTINCTION;',
        '#endif',
      '}',

      'gl_FragColor = vec4(totalInscattering, 1.0);',
    '}',
    ];

    let updatedLines = [];
    let numberOfChunks = numberOfPoints - 1;
    for(let i = 0, numLines = originalGLSL.length; i < numLines; ++i){
      let updatedGLSL = originalGLSL[i].replace(/\$numberOfChunksInt/g, numberOfChunks);
      updatedGLSL = updatedGLSL.replace(/\$numberOfChunks/g, numberOfChunks.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$textureWidth/g, textureWidth.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$textureHeight/g, textureHeight.toFixed(1));

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