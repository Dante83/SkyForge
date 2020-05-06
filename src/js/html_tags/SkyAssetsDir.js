//Child classes
window.customElements.define('sky-basis-transcoder-path', class extends HTMLElement{});
window.customElements.define('sky-state-engine-path', class extends HTMLElement{});
window.customElements.define('sky-interpolation-engine-path', class extends HTMLElement{});
window.customElements.define('sky-moon-diffuse-map', class extends HTMLElement{});
window.customElements.define('sky-moon-normal-map', class extends HTMLElement{});
window.customElements.define('sky-moon-opacity-map', class extends HTMLElement{});
window.customElements.define('sky-moon-specular-map', class extends HTMLElement{});
window.customElements.define('sky-moon-ao-map', class extends HTMLElement{});

StarrySky.DefaultData.fileNames = {
  moonDiffuseMap: 'lunar-diffuse-map.basis',
  moonNormalMap: 'lunar-normal-map.basis',
  moonOpacityMap: 'lunar-opacity-map.basis',
  moonSpecularMap: 'lunar-specular-map.basis',
  moonAOMap: 'lunar-ao-map.basis'
};

StarrySky.DefaultData.skyAssets = {
  basisTranscoderPath: './wasm/',
  skyStateEnginePath: './wasm/',
  skyInterpolationEnginePath: './wasm/',
  moonDiffuseMap: './assets/moon/' + StarrySky.DefaultData.fileNames.moonDiffuseMap,
  moonNormalMap: './assets/moon/' + StarrySky.DefaultData.fileNames.moonNormalMap,
  moonOpacityMap: './assets/moon/' + StarrySky.DefaultData.fileNames.moonOpacityMap,
  moonSpecularMap: './assets/moon/' + StarrySky.DefaultData.fileNames.moonSpecularMap,
  moonAOMap: './assets/moon/' + StarrySky.DefaultData.fileNames.moonAOMap,
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

    let self = this;
    document.addEventListener('DOMContentLoaded', function(evt){
      //Check this this has a parent sky-assets-dir
      self.isRoot = self.parentElement.nodeName.toLowerCase() !== 'sky-assets-dir';
      let path = 'dir' in self.attributes ? self.attributes.dir.value : '/';
      let parentTag = self.parentElement;

      //If this isn't root, we should recursively travel up the tree until we have constructed
      //our path.
      let i = 0;
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
      let childNodes = Array.from(self.children);
      let basisTranscoderTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-basis-transcoder-path');
      let skyStateEngineTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-state-engine-path');
      let skyInterpolationEngineTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-interpolation-engine-path');
      let moonDiffuseMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-diffuse-map');
      let moonNormalMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-normal-map');
      let moonOpacityMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-opacity-map');
      let moonSpecularMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-specular-map');
      let moonAOMapTags = childNodes.filter(x => x.nodeName.toLowerCase() === 'sky-moon-ao-map');

      const objectProperties = ['basisTranscoder', 'skyStateEngine', 'skyInterpolationEngine',
        'moonDiffuseMap', 'moonNormalMap', 'moonOpacityMap', 'moonSpecularMap', 'moonAOMap']
      let tagsList = [basisTranscoderTags, skyStateEngineTags, skyInterpolationEngineTags,
        moonDiffuseMapTags, moonNormalMapTags, moonOpacityMapTags, moonSpecularMapTags, moonAOMapTags];
      const numberOfTags = tagsList.length;
      if(self.hasAttribute('wasm-path') && self.getAttribute('wasm-path').toLowerCase() !== 'false'){
        const wasmKeys = ['basisTranscoder', 'skyStateEngine', 'skyInterpolationEngine'];
        for(let i = 0; i < wasmKeys.length; ++i){
          //Must end with a / because basis texture loader will just append the file name
          StarrySky.assetPaths[wasmKeys[i]] = path + '/';
        }
      }
      else if(self.hasAttribute('texture-path') && self.getAttribute('texture-path').toLowerCase() !== 'false'){
        const textureKeys = ['moonDiffuseMap', 'moonNormalMap', 'moonOpacityMap',
        'moonSpecularMap', 'moonAOMap'];
        for(let i = 0; i < textureKeys.length; ++i){
          StarrySky.assetPaths[textureKeys[i]] = path + '/' + StarrySky.DefaultData.fileNames[textureKeys[i]];
        }
      }
      else if(self.hasAttribute('moon-path') && self.getAttribute('moon-path').toLowerCase() !== 'false'){
        const moonTextureKeys = ['moonDiffuseMap', 'moonNormalMap', 'moonOpacityMap',
        'moonSpecularMap', 'moonAOMap'];
        for(let i = 0; i < moonTextureKeys.length; ++i){
          StarrySky.assetPaths[moonTextureKeys[i]] = path + '/' + StarrySky.DefaultData.fileNames[moonTextureKeys[i]];
        }
      }
      else{
        for(let i = 0; i < numberOfTags; ++i){
          let tags = tagsList[i];
          let propertyName = objectProperties[i];
          if(tags.length > 1){
            console.error(`The <sky-assets-dir> tag can only contain 1 tag of type <${tags[0].tagName}>. ${tags.length} found.`);
          }
          else if(tags.length > 0){
            if(StarrySky.assetPaths[propertyName] &&
              StarrySky.assetPaths[propertyName] !== StarrySky.DefaultData.skyAssets[propertyName]){
              //As the above should be copied over from a JSON parse, we must have changed this
              //someplace else.
              console.warn(`A page can only have one tag of type <${tags[0].tagName}>. Two were discovered. Switching data to latest url.`);
            }
            //Try the default file name if no html was provided
            StarrySky.assetPaths[propertyName] = tags[0].innerHTML !== '' ? path.concat(tags[0].innerHTML) : path.concat(StarrySky.DefaultData.fileNames[propertyName]);
          }
        }
      }

      self.skyDataLoaded = true;
      self.dispatchEvent(new Event('Sky-Data-Loaded'));
    });

    this.loaded = true;
  };
}
window.customElements.define('sky-assets-dir', SkyAssetsDir);
