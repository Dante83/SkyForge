//This helps
//--------------------------v
//https://threejs.org/docs/#api/en/core/Uniform
StarrySky.Materials.Moon.baseSunPartial = {
  fragmentShader: function(sunAngularDiameter){
    let originalGLSL = [
    '//We enter and leave with additionalPassColor, which we add our moon direct',
    '//lighting to, after it has been attenuated by our transmittance.',

    '//Our moon is located in the middle square of our quad, so that we give our',
    '//solar bloom enough room to expand into without clipping the edge.',
    '//We also fade out our quad towards the edge to reduce the visibility of sharp',
    '//edges.',
    'vec2 offsetUV = vUv * 3.0 - vec2(1.0);',
    'float pixelDistanceFromMoon = distance(offsetUV, vec2(0.5));',

    '//Apply transmittance to our sun disk direct lighting',
    'vec3 sunTexel = 1.0 * sundisk * sunIntensity * transmittanceFade * limbDarkening;',
    ];

    let updatedLines = [];
    for(let i = 0, numLines = originalGLSL.length; i < numLines; ++i){
      let updatedGLSL = originalGLSL[i].replace(/\$moonAngularDiameter/g, moonAngularDiameter.toFixed(5));

      updatedLines.push(updatedGLSL);
    }

    return updatedLines.join('\n');
  },
  vertexShader: [
    'uniform float radiusOfMoonPlane;',
    'uniform mat4 worldMatrix;',
    'varying vec3 vWorldPosition;',
    'varying vec2 vUv;',

    'void main() {',
      'vec4 worldPosition = worldMatrix * vec4(position * radiusOfMoonPlane, 1.0);',
      'vWorldPosition = normalize(worldPosition.xyz);',
      'vUv = uv;',

      'gl_Position = vec4(position, 1.0);',
    '}',
  ].join('\n'),
}
