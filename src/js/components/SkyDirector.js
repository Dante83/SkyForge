StarrySky.SkyDirector = function(parentComponent){
  this.EVENT_INITIALIZE = 0;
  this.EVENT_UPDATE = 1;
  this.parentComponent = parentComponent;
  this.renderer = parentComponent.el.sceneEl.renderer;
  this.scene = parentComponent.el.sceneEl.object3D;
  //
  //TODO: Come back here and grab the camera. This is important for attaching child objects in our sky
  //that will follow this object around.
  //
  // this.camera = self.el.sceneEl.camera;
  this.assetManager;
  this.LUTLibraries;
  this.renderers;
  this.webAssemblyWorker;
  //this.webAssemblyWorker = new Worker("../src/cpp/starry-sky-web-worker.js", { type: "module" });
  this.webAssembly;
  let self = this;
  this.renderers = {};

  this.initializeRenderers = function(){
    console.log(self.assetManager);
    console.log("BING!");
    //Prepare all of our renderers to display stuff
    self.renderers.atmosphereRenderer = new StarrySky.Renderers.AtmosphereRenderer(self);
    self.start();
  }

  this.start = function(){
    //Update our tick and tock functions
    parentComponent.tick = function(){

    }
    parentComponent.tock = function(){

    }
    parentComponent.initialized = true;
  }

  this.initializeSkyWorker = function(){
    let self = this;

    //Initialize the state of our sky
    self.webAssemblyWorker.postMessage({
      eventType: self.EVENT_INITIALIZE,
      latitude: self.latitude,
      longitude: self.longitude,
      date: self.date,
      timeMultiplier: self.timeMultiplier,
      utcOffset: self.utcOffset
    });
  };

  this.requestSkyUpdate = function(){
    //Initialize the state of our sky
    self.webAssemblyWorker.postMessage({
      eventType: self.UPDATE,
      date: self.date
    });
  };

  window.addEventListener('DOMContentLoaded', function(){
    //Grab all of our assets
    self.assetManager = new StarrySky.AssetManager(self);
    self.initializeRenderers();
  });
}
