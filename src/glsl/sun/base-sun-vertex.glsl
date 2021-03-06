uniform float radiusOfSunPlane;
uniform mat4 worldMatrix;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec4 worldPosition = worldMatrix * vec4(position * radiusOfSunPlane, 1.0);
  vWorldPosition = vec3(-worldPosition.z, worldPosition.y, -worldPosition.x);

  vUv = uv;

  gl_Position = vec4(position, 1.0);
}
