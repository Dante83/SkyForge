//Child classes
window.customElements.define('sky-state-engine-path', class extends HTMLElement{});
window.customElements.define('sky-interpolation-engine-path', class extends HTMLElement{});
window.customElements.define('sky-moon-diffuse-map', class extends HTMLElement{});
window.customElements.define('sky-moon-normal-map', class extends HTMLElement{});
window.customElements.define('sky-moon-roughness-map', class extends HTMLElement{});
window.customElements.define('sky-moon-aperature-size-map', class extends HTMLElement{});
window.customElements.define('sky-moon-aperature-orientation-map', class extends HTMLElement{});
window.customElements.define('sky-star-cubemap-map', class extends HTMLElement{});
window.customElements.define('sky-dim-star-map', class extends HTMLElement{});
window.customElements.define('sky-bright-star-map', class extends HTMLElement{});

StarrySky.DefaultData.fileNames = {
  moonDiffuseMap: 'lunar-diffuse-map.webp',
  moonNormalMap: 'lunar-normal-map.webp',
  moonRoughnessMap: 'lunar-roughness-map.webp',
  moonAperatureSizeMap: 'lunar-aperature-size-map.webp',
  moonAperatureOrientationMap: 'lunar-aperature-orientation-map.webp',
  starHashCubeMap: [
    'star-dictionary-cubemap-px.webp',
    'star-dictionary-cubemap-nx.webp',
    'star-dictionary-cubemap-py.webp',
    'star-dictionary-cubemap-ny.webp',
    'star-dictionary-cubemap-pz.webp',
    'star-dictionary-cubemap-nz.webp',
  ],
  dimStarMaps: [
    'dim-star-data-r-channel.webp',
    'dim-star-data-g-channel.webp',
    'dim-star-data-b-channel.webp',
    'dim-star-data-a-channel.webp'
  ],
  brightStarMaps:[
    'bright-star-data-r-channel.png', //We choose to use PNG for the bright star data as webp is actually twice as big
    'bright-star-data-g-channel.png',
    'bright-star-data-b-channel.png',
    'bright-star-data-a-channel.png'
  ]
};

StarrySky.DefaultData.skyAssets = {
  skyStateEnginePath: './wasm/',
  skyInterpolationEnginePath: './wasm/',
  moonDiffuseMap: './assets/moon/webp_files/' + StarrySky.DefaultData.fileNames.moonDiffuseMap,
  moonNormalMap: './assets/moon/webp_files/' + StarrySky.DefaultData.fileNames.moonNormalMap,
  moonRoughnessMap: './assets/moon/webp_files/' + StarrySky.DefaultData.fileNames.moonRoughnessMap,
  moonAperatureSizeMap: './assets/moon/webp_files/' + StarrySky.DefaultData.fileNames.moonAperatureSizeMap,
  moonAperatureOrientationMap: './assets/moon/webp_files/' + StarrySky.DefaultData.fileNames.moonAperatureOrientationMap,
  starHashCubemap: StarrySky.DefaultData.fileNames.starHashCubeMap.map(x => './assets/star_data/webp_files/' + x),
  dimStarDataMaps: StarrySky.DefaultData.fileNames.dimStarMaps.map(x => './assets/star_data/webp_files/' + x),
  brightStarDataMaps: StarrySky.DefaultData.fileNames.dimStarMaps.map(x => './assets/star_data/png_files/' + x),
};

//Clone the above, in the event that any paths are found to differ, we will
//replace them.
StarrySky.assetPaths = JSON.parse(JSON.stringify(StarrySky.DefaultData));

//Parent class
class SkyAssetsDir extends HTMLElement {
  constructor(){
    super();

    //Check if there are any child elements. Otherwise set them to the default.
    this.skyDataLoaded = false;
    this.data = StarrySky.DefaultData.skyAssets;
    this.isRoot = false;
  }

  connectedCallback(){
    //Hide the element
    this.style.display = "none";

    const self = this;
    document.addEventListener('DOMContentLoaded', function(evt){
      //Check this this has a parent sky-assets-dir
      self.isRoot = self.parentElement.nodeName.toLowerCase() !== 'sky-assets-dir';
      const path = 'dir' in self.attributes ? self.attributes.dir.value : '/';
      const parentTag = self.parentElement;

      //If this isn't root, we should recursively travel up the tree until we have constructed
      //our path.
      var i = 0;
      while(parentTag.nodeName.toLowerCase() === 'sky-assets-dir'){
        let parentDir;
        if('dir' in parentTag.attributes){
          parentDir = parentTag.attributes.dir.value;
        }
        else{
          parentDir = '';
        }
        if(parentDir.length > 0){
          //We add the trailing / back in if we are going another level deeper
          parentDir = parentDir.endsWith('/') ? parentDir : parentDir + '/';

          //Remove the trailing and ending /s for appropriate path construction
          path = path.startsWith('/') ? path.slice(1, path.length - 1) : path;
          path = path.endsWith('/') ? path.slice(0, path.length - 2) : path;
          path = parentDir + path;
        }
        else{
          path = parentDir + path;
        }
        parentTag = parentTag.parentElement;
        i++;
        if(i > 100){
          console.error("Why do you need a hundred of these?! You should be able to use like... 2. Maybe 3? I'm breaking to avoid freezing your machine.");
          return; //Oh, no, you don't just get to break, we're shutting down the entire function
        }
      }

      //Get child tags and acquire their values.
      const childNodes = Array.from(self.children);
      const skyStateEngineTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-state-engine-path');
      const skyInterpolationEngineTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-interpolation-engine-path');
      const moonDiffuseMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-diffuse-map');
      const moonNormalMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-normal-map');
      const moonRoughnessMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-roughness-map');
      const moonAperatureSizeMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-aperature-size-map');
      const moonAperatureOrientationMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-aperature-orientation-map');
      const starCubemapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-star-cubemap-map');
      const dimStarMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-dim-star-map');
      const brightStarMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-bright-star-map');

      const objectProperties = ['skyStateEngine', 'skyInterpolationEngine','moonDiffuseMap', 'moonNormalMap',
        'moonRoughnessMap', 'moonAperatureSizeMap', 'moonAperatureOrientationMap', 'starHashCubemap',
        'dimStarMaps', 'brightStarMaps']
      const tagsList = [skyStateEngineTags, skyInterpolationEngineTags, moonDiffuseMapTags, moonNormalMapTags,
        moonRoughnessMapTags, moonAperatureSizeMapTags, moonAperatureOrientationMapTags, starCubemapTags,
        dimStarMapTags, brightStarMapTags];
      const numberOfTagTypes = tagsList.length;
      if(self.hasAttribute('wasm-path') && self.getAttribute('wasm-path').toLowerCase() !== 'false'){
        const wasmKeys = ['skyStateEngine', 'skyInterpolationEngine'];
        for(let i = 0; i < wasmKeys.length; ++i){
          //Must end with a / because basis texture loader will eventually just append the file name
          //We want to use .BASIS in the future, but right now it lacks the quality desired for our target
          //platform of medium to high powered desktops.
          StarrySky.assetPaths[wasmKeys[i]] = path + '/';
        }
      }
      else if(self.hasAttribute('texture-path') && self.getAttribute('texture-path').toLowerCase() !== 'false'){
        const singleTextureKeys = ['moonDiffuseMap', 'moonNormalMap', 'moonRoughnessMap',
        'moonAperatureSizeMap', 'moonAperatureOrientationMap'];
        const multiTextureKeys = ['starHashCubemap','dimStarMaps', 'brightStarMaps'];

        //Process single texture keys
        for(let i = 0; i < singleTextureKeys.length; ++i){
          StarrySky.assetPaths[singleTextureKeys[i]] = path + '/' + StarrySky.DefaultData.fileNames[singleTextureKeys[i]];
        }

        //Process multi texture keys
        for(let i = 0; i < multiTextureKeys.length; ++i){
          let multiTextureFileNames = multiTextureKeys[i];
          for(let j = 0; j < multiTextureFileNames.length; ++j){
            StarrySky.assetPaths[multiTextureFileNames[i]][j] = path + '/' + StarrySky.DefaultData.fileNames[singleTextureKeys[i]][j];
          }
        }
      }
      else if(self.hasAttribute('moon-path') && self.getAttribute('moon-path').toLowerCase() !== 'false'){
        const moonTextureKeys = ['moonDiffuseMap', 'moonNormalMap', 'moonRoughnessMap',
        'moonAperatureSizeMap', 'moonAperatureOrientationMap'];
        for(let i = 0; i < moonTextureKeys.length; ++i){
          StarrySky.assetPaths[moonTextureKeys[i]] = path + '/' + StarrySky.DefaultData.fileNames[moonTextureKeys[i]];
        }
      }
      else if(self.hasAttribute('star-path') && self.getAttribute('star-path').toLowerCase() !== 'false'){
        const starTextureKeys = ['starHashCubemap', 'dimStarMaps', 'brightStarMaps'];
        for(let i = 0; i < starTextureKeys.length; ++i){
          let starMapFileNames =  StarrySky.DefaultData.fileNames[starTextureKeys[i]];
          for(let j = 0; j < starMapFileNames.length; ++j){
            StarrySky.assetPaths[starTextureKeys[i]][j] = path + '/' + starMapFileNames[j];
          }
        }
      }
      else{
        console.warn("Invalid code path detected for the sky assets dirs. This should not happen.");
      }

      self.skyDataLoaded = true;
      self.dispatchEvent(new Event('Sky-Data-Loaded'));
    });

    this.loaded = true;
  };
}
window.customElements.define('sky-assets-dir', SkyAssetsDir);
