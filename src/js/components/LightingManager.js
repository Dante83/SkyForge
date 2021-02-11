//The lighting for our scene contains 3 hemispherical lights and 1 directional light
//with shadows enabled. The shadow enabled directional light is shared between the sun
//and the moon in order to reduce the rendering load.
StarrySky.LightingManager = function(parentComponent){
  const RADIUS_OF_SKY = 5000.0;
  this.skyDirector = parentComponent;
  const lightingData = this.skyDirector.assetManager.data.skyLighting;
  this.sourceLight = new THREE.DirectionalLight(0xffffff, 4.0);
  const shadow = this.sourceLight.shadow;
  this.sourceLight.castShadow = true;
  shadow.mapSize.width = lightingData.shadowCameraResolution;
  shadow.mapSize.height = lightingData.shadowCameraResolution;
  shadow.camera.near = 128.0;
  shadow.camera.far = RADIUS_OF_SKY * 2.0;
  const directLightingCameraSize = lightingData.shadowCameraSize;
  shadow.camera.left = -directLightingCameraSize;
  shadow.camera.right = directLightingCameraSize;
  shadow.camera.bottom = -directLightingCameraSize;
  shadow.camera.top = directLightingCameraSize;
  this.sourceLight.target = this.skyDirector.camera;
  const  totalDistance = lightingData.shadowDrawDistance + lightingData.shadowDrawBehindDistance;
  this.targetScalar = 0.5 * totalDistance - lightingData.shadowDrawBehindDistance;
  this.shadowTarget = new THREE.Vector3();
  this.shadowTargetOffset = new THREE.Vector3();
  this.fogColorVector = new THREE.Color();
  this.xAxisHemisphericalLight = new THREE.HemisphereLight( 0x000000, 0x000000, 0.0);
  this.yAxisHemisphericalLight = new THREE.HemisphereLight( 0x000000, 0x000000, 1.0);
  this.zAxisHemisphericalLight = new THREE.HemisphereLight( 0x000000, 0x000000, 0.0);
  this.xAxisHemisphericalLight.position.set(1,0,0);
  this.yAxisHemisphericalLight.position.set(0,1,0);
  this.zAxisHemisphericalLight.position.set(0,0,1);

  parentComponent.scene.fog = this.fog;
  if(lightingData.atmosphericPerspectiveEnabled){
    this.fog = new THREE.FogExp2(0xFFFFFF, lightingData.atmosphericPerspectiveDensity);
    parentComponent.scene.fog = this.fog;
  }

  const scene = parentComponent.scene;
  scene.add(this.sourceLight);
  scene.add(this.xAxisHemisphericalLight);
  scene.add(this.yAxisHemisphericalLight);
  scene.add(this.zAxisHemisphericalLight);
  this.cameraRef = parentComponent.camera;
  const self = this;
  this.tick = function(lightingState){
    //
    //TODO: We should move our fog color to a shader hack approach,
    //as described in https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386
    //along with adding a volumetric fog system.
    //
    //The colors for this fog could then driven by a shader as described in
    //http://publications.lib.chalmers.se/records/fulltext/203057/203057.pdf
    //

    //I also need to hook in the code from our tags for fog density under
    //sky-atmospheric-parameters and hook that value into this upon starting.
    //And drive the shadow type based on the shadow provided in sky-lighting.
    if(lightingData.atmosphericPerspectiveEnabled){
      self.fogColorVector.fromArray(lightingState, 21);
      const maxVal = Math.max(self.fogColorVector.r, self.fogColorVector.g, self.fogColorVector.b);
      // const inverseMagnitudeOfSky = 1.0 / maxVal;
      // self.fogColorVector.r *= inverseMagnitudeOfSky;
      // self.fogColorVector.g *= inverseMagnitudeOfSky;
      // self.fogColorVector.b *= inverseMagnitudeOfSky;
      // self.fog.density = maxVal * self.maxFogDensity;

      //The fog color is taken from sky color hemispherical data alone (excluding ground color)
      //and is the color taken by dotting the camera direction with the colors of our
      //hemispherical lighting along the x, z axis.
      self.fog.color.copy(self.fogColorVector);
    }

    //We update our directional light so that it's always targetting the camera.
    //We originally were going to target a point in front of the camera
    //but this resulted in terrible artifacts that caused the shadow to shimer
    //from the aliasing of the texture - without this shimmering
    //we can greatly reduce the size of our shadow map for the same quality.
    //LUT and is done in WASM, while the intensity is determined by whether the sun
    //or moon is in use and transitions between the two.
    //The target is a position weighted by the
    self.sourceLight.position.x = -RADIUS_OF_SKY * lightingState[27];
    self.sourceLight.position.y = RADIUS_OF_SKY * lightingState[26];
    self.sourceLight.position.z = -RADIUS_OF_SKY * lightingState[25];
    self.sourceLight.color.fromArray(lightingState, 18);
    self.sourceLight.intensity = lightingState[24];
    self.sourceLight.intensity = 0.3;

    //The hemispherical light colors replace ambient lighting and are calculated
    //in a web worker along with our sky metering. They are the light colors in the
    //directions of x, y and z.
    self.xAxisHemisphericalLight.color.fromArray(lightingState, 0);
    self.yAxisHemisphericalLight.color.fromArray(lightingState, 3);
    self.zAxisHemisphericalLight.color.fromArray(lightingState, 6);
    self.xAxisHemisphericalLight.groundColor.fromArray(lightingState, 9);
    self.yAxisHemisphericalLight.groundColor.fromArray(lightingState, 12);
    self.zAxisHemisphericalLight.groundColor.fromArray(lightingState, 15);
    self.xAxisHemisphericalLight.intensity = lightingState[25];
    self.yAxisHemisphericalLight.intensity = lightingState[25];
    self.zAxisHemisphericalLight.intensity = lightingState[25];
    self.xAxisHemisphericalLight.intensity = 0.2;
    self.yAxisHemisphericalLight.intensity = 0.2;
    self.zAxisHemisphericalLight.intensity = 0.2;
  }
};
