#include "Constants.h"
#include "SkyState.h"
#include "world_state/AstroTime.h"
#include "world_state/Location.h"
#include "astro_bodies/SkyManager.h"
#include "autoexposure/LightingAnalyzer.h"
#include <emscripten/emscripten.h>
#include <cmath>

//
//Constructor
//
SkyState::SkyState(AstroTime* astroTimePnt, Location* locationPnt, SkyManager* skyManagerPnt, LightingAnalyzer* lightingAnalyzerPtr, float *memoryPtrIn){
  astroTime = astroTimePnt;
  location = locationPnt;
  skyManager = skyManagerPnt;
  memoryPtr = memoryPtrIn;
  lightingAnalyzer = lightingAnalyzerPtr;
}

SkyState* skyState;

extern "C" {
  int main();
  void setupSky(double latitude, double longitude, int year, int month, int day, int hour, int minute, double second, float* memoryPtr);
  void updateSky(int year, int month, int day, int hour, int minute, double second);
  void initializeMeteringAndLightingDependencies(int widthOfMeteringTexture, int transmittanceTextureSize, float* xyzPtr, float* pixelWeightsPtr, float* groundColorPtr, float* transmittanceLUTPtr, float* fogColorPtr);
  float updateMeteringData(float* skyColorIntensitiesPtr);
  void updateHemisphericalLightingData(float* skyColorIntensitiesPtr, float* hemisphericalAndDirectSkyLightPtr, float hmdViewX, float hmdViewZ);
  float updateDirectLighting(float heightOfCamera, float sunYPosition, float sunRadius, float moonRadius, float moonYPosition, float sunIntensity, float moonIntensity, float meteringIntensity, float* directLightingPointer, float* indirectLightingPointer);
}

void SkyState::updateHeap32Memory(){
  skyState->memoryPtr[0] = static_cast<float>(skyState->skyManager->sun.rightAscension);
  skyState->memoryPtr[1] = static_cast<float>(skyState->skyManager->sun.declination);
  skyState->memoryPtr[15] = static_cast<float>(skyState->skyManager->sun.irradianceFromEarth);
  skyState->memoryPtr[16] = static_cast<float>(skyState->skyManager->sun.scale);

  skyState->memoryPtr[2] = static_cast<float>(skyState->skyManager->moon.rightAscension);
  skyState->memoryPtr[3] = static_cast<float>(skyState->skyManager->moon.declination);
  skyState->memoryPtr[17] = static_cast<float>(skyState->skyManager->moon.irradianceFromEarth);
  skyState->memoryPtr[18] = static_cast<float>(skyState->skyManager->moon.scale);
  skyState->memoryPtr[19] = static_cast<float>(skyState->skyManager->moon.parallacticAngle);
  skyState->memoryPtr[20] = static_cast<float>(skyState->skyManager->moon.earthShineIntensity);
  skyState->memoryPtr[26] = static_cast<float>(skyState->skyManager->moon.illuminatedFractionOfMoon);

  skyState->memoryPtr[4] = static_cast<float>(skyState->skyManager->mercury.rightAscension);
  skyState->memoryPtr[5] = static_cast<float>(skyState->skyManager->mercury.declination);
  skyState->memoryPtr[21] = static_cast<float>(skyState->skyManager->mercury.irradianceFromEarth);

  skyState->memoryPtr[6] = static_cast<float>(skyState->skyManager->venus.rightAscension);
  skyState->memoryPtr[7] = static_cast<float>(skyState->skyManager->venus.declination);
  skyState->memoryPtr[22] = static_cast<float>(skyState->skyManager->venus.irradianceFromEarth);

  skyState->memoryPtr[8] = static_cast<float>(skyState->skyManager->mars.rightAscension);
  skyState->memoryPtr[9] = static_cast<float>(skyState->skyManager->mars.declination);
  skyState->memoryPtr[23] = static_cast<float>(skyState->skyManager->mars.irradianceFromEarth);

  skyState->memoryPtr[10] = static_cast<float>(skyState->skyManager->jupiter.rightAscension);
  skyState->memoryPtr[11] = static_cast<float>(skyState->skyManager->jupiter.declination);
  skyState->memoryPtr[24] = static_cast<float>(skyState->skyManager->jupiter.irradianceFromEarth);

  skyState->memoryPtr[12] = static_cast<float>(skyState->skyManager->saturn.rightAscension);
  skyState->memoryPtr[13] = static_cast<float>(skyState->skyManager->saturn.declination);
  skyState->memoryPtr[25] = static_cast<float>(skyState->skyManager->saturn.irradianceFromEarth);

  skyState->memoryPtr[14] = static_cast<float>(skyState->astroTime->localApparentSiderealTime) * DEG_2_RAD;
}

//What we use to get all of this rolling.
void EMSCRIPTEN_KEEPALIVE setupSky(double latitude, double longitude, int year, int month, int day, int hour, int minute, double second, float* memoryPtr){
  //Set up our sky to the current time
  AstroTime *astroTime = new AstroTime(year, month, day, hour, minute, second);
  Location *location = new Location(latitude, longitude);
  SkyManager *skyManager = new SkyManager(astroTime, location);
  LightingAnalyzer *lightingAnalyzer = new LightingAnalyzer();
  skyState = new SkyState(astroTime, location, skyManager, lightingAnalyzer, memoryPtr);
  skyState->updateHeap32Memory();
}

void EMSCRIPTEN_KEEPALIVE updateSky(int year, int month, int day, int hour, int minute, double second){
  skyState->astroTime->setAstroTimeFromYMDHMSTZ(year, month, day, hour, minute, second);
  skyState->skyManager->update();
  skyState->updateHeap32Memory();
}

//This is just an external wrapper function we can call from our javascript
float EMSCRIPTEN_KEEPALIVE updateMeteringData(float* skyColorIntensitiesPtr){
  return skyState->lightingAnalyzer->updateMeteringData(skyColorIntensitiesPtr);
}

void EMSCRIPTEN_KEEPALIVE updateHemisphericalLightingData(float* skyColorIntensitiesPtr, float* hemisphericalAndDirectSkyLightPtr, float hmdViewX, float hmdViewZ){
  skyState->lightingAnalyzer->updateHemisphericalLightingData(skyColorIntensitiesPtr, hemisphericalAndDirectSkyLightPtr, hmdViewX, hmdViewZ);
}

float EMSCRIPTEN_KEEPALIVE updateDirectLighting(float heightOfCamera, float sunYPosition, float sunRadius, float moonRadius, float moonYPosition, float sunIntensity, float moonIntensity, float meteringIntensity, float* directLightingPointer, float* indirectLightingPointer){
  //Determine whether sun or moon is dominant based on the height
  float dominantLightRadius = sunRadius;
  float nightTimeTrigger = -3.0f * sunRadius;
  float dominantLightY = sunYPosition;
  bool sunIsDominantLightSource = true;
  float dominantLightIntensity = sunIntensity;
  if(sunYPosition < nightTimeTrigger){
    dominantLightRadius = moonRadius;
    dominantLightY = moonYPosition;
    sunIsDominantLightSource = false;
    dominantLightIntensity = moonIntensity;
  }

  //We are only chopping off the intensity from the horizon, solar eclipse
  //or lunar eclipse here. We do not emulate phases of the moon or a more
  //accurate solution which would require summing over the intensities of
  //all pixels on a image of the sun or moon - this is just a point source
  //approximation.
  // float totalLightSourceArea = PI * dominantLightRadius * dominantLightRadius;
  // float visibleAreaOfLightSource = 1.0f;
  // if(dominantLightY >= dominantLightRadius){
  //   visibleAreaOfLightSource = totalLightSourceArea;
  // }
  // else if(dominantLightY > -dominantLightRadius){
  //   //LightSource is above horizon, we automatically get half of our sphere
  //   if(dominantLightY >= 0.0f){
  //     visibleAreaOfLightSource = PI_OVER_TWO * dominantLightRadius * dominantLightRadius;
  //   }
  //   if(dominantLightY != 0.0f){
  //     float h = dominantLightRadius - abs(dominantLightY);
  //     float gamma = acos(h / dominantLightRadius);
  //     float areaOfSegment = 2.0f * dominantLightRadius * dominantLightRadius * gamma;
  //     float areaOfTriangle = 0.5f * dominantLightRadius * sin(gamma) * h;
  //     visibleAreaOfLightSource += (areaOfSegment - areaOfTriangle);
  //   }
  // }
  float lightIntensity = sunIsDominantLightSource ? sunIntensity : moonIntensity;
  // lightIntensity *= visibleAreaOfLightSource / totalLightSourceArea;
  // lightIntensity = pow(lightIntensity, ONE_OVER_TWO_POINT_TWO);
  //float lightIntensity = 1.0f;

  //Not sure if this is accurate, but a nice linear transition works to keep us in the transmittance between
  //these two points. Maybe come back here at a later time and do the calculus to get the perfect
  //answer. We're getting rusty at calculus anyways.
  //dominantLightY += dominantLightRadius * (1.0 - (visibleAreaOfLightSource / totalLightSourceArea));

  //Once we have the base source light, we need to apply the transmittance to this light
  //Use this height information to acquire the appropriate position on the transmittance LUT
  int widthOfTransmittanceTexture = skyState->lightingAnalyzer->widthOfTransmittanceTexture;
  float xPosition = 0.5f * (1.0f + dominantLightY) * static_cast<float>(widthOfTransmittanceTexture);
  float r = heightOfCamera + RADIUS_OF_EARTH;
  float yPosition = sqrt((r * r - RADIUS_OF_EARTH_SQUARED) / RADIUS_ATM_SQUARED_MINUS_RADIUS_EARTH_SQUARED) * static_cast<float>(widthOfTransmittanceTexture);

  //Get the look-up color for the LUT for the weighted nearest 4 colors
  float transmittance[3] = {0.0, 0.0, 0.0};

  //Upper Left
  int floorXPosition = fmax(static_cast<int>(floor(xPosition)), 0);
  int ceilYPosition = fmin(static_cast<int>(ceil(yPosition)), widthOfTransmittanceTexture - 1);
  float diffX = abs(xPosition - static_cast<float>(floorXPosition));
  float diffY = abs(yPosition - static_cast<float>(ceilYPosition));
  float weight = sqrt(diffX * diffX + diffY * diffY);
  float totalWeight = weight;
  skyState->lightingAnalyzer->setTransmittance(floorXPosition, ceilYPosition, weight, transmittance);

  //Lower Left
  int floorYPosition = fmax(static_cast<int>(floor(yPosition)), 0);
  diffY = abs(yPosition - static_cast<float>(floorYPosition));
  weight = sqrt(diffX * diffX + diffY * diffY);
  totalWeight += weight;
  skyState->lightingAnalyzer->setTransmittance(floorXPosition, floorYPosition, weight, transmittance);

  //Upper Right
  int ceilXPosition = fmin(static_cast<int>(ceil(xPosition)), widthOfTransmittanceTexture);
  diffX = abs(xPosition - static_cast<float>(ceilXPosition));
  diffY = abs(yPosition - static_cast<float>(ceilYPosition));
  weight = sqrt(diffX * diffX + diffY * diffY);
  totalWeight += weight;
  skyState->lightingAnalyzer->setTransmittance(ceilXPosition, ceilYPosition, weight, transmittance);

  //Lower Right
  diffX = abs(xPosition - static_cast<float>(ceilXPosition));
  diffY = abs(yPosition - static_cast<float>(floorYPosition));
  weight = sqrt(diffX * diffX + diffY * diffY);
  totalWeight += weight;
  skyState->lightingAnalyzer->setTransmittance(ceilXPosition, floorYPosition, weight, transmittance);
  //Modify the color our light as a side effect
  float oneOverTotalWeight = 1.0 / totalWeight;
  for(int i = 0; i < 3; ++i){
    //The first three items tell us the color of the light
    directLightingPointer[i] = fmin(fmax(transmittance[i] * lightIntensity * oneOverTotalWeight, 0.0f), 1.0f);

    //In the event that we fall out of range, just zero everything out
    if(isnan(directLightingPointer[i])){
      directLightingPointer[i] = 0.0f;
    }
    indirectLightingPointer[i] = fmax(1.0f - directLightingPointer[i], 0.0f);
  }
  skyState->lightingAnalyzer->yComponentOfDirectLighting = dominantLightY;
  skyState->lightingAnalyzer->directLightingColor[0] = directLightingPointer[0];
  skyState->lightingAnalyzer->directLightingColor[1] = directLightingPointer[1];
  skyState->lightingAnalyzer->directLightingColor[2] = directLightingPointer[2];
  directLightingPointer[0] = skyState->lightingAnalyzer->directLightingColor[0];
  directLightingPointer[1] = skyState->lightingAnalyzer->directLightingColor[1];
  directLightingPointer[2] = skyState->lightingAnalyzer->directLightingColor[2];

  //Apply this LUT transmittance to our direct lighting
  return dominantLightY;
}

void EMSCRIPTEN_KEEPALIVE initializeMeteringAndLightingDependencies(int widthOfMeteringTexture, int transmittanceTextureSize, float* xyzPtr, float* pixelWeightsPtr, float* groundColorPtr, float* transmittanceLUTPtr, float* fogColorPtr){
  //Attach our pointers to the object
  skyState->lightingAnalyzer->widthOfMeteringTexture = widthOfMeteringTexture;
  skyState->lightingAnalyzer->xyzCoordinatesOfPixel = xyzPtr;
  skyState->lightingAnalyzer->pixelWeights = pixelWeightsPtr;
  skyState->lightingAnalyzer->groundColor = groundColorPtr;
  skyState->lightingAnalyzer->transmittanceLUT = transmittanceLUTPtr;
  skyState->lightingAnalyzer->widthOfTransmittanceTexture = transmittanceTextureSize;
  skyState->lightingAnalyzer->fogColor = fogColorPtr;

  //Set their constant values for future reference
  float sumOfPixelWeights = 0.0f;
  float sumOfPixelDirectionalWeights[6] = {0.0f,0.0f,0.0f,0.0f,0.0f,0.0f};
  const float halfWidthOfTexture = widthOfMeteringTexture * 0.5f;
  const float radiusOfSkyCircle = halfWidthOfTexture * halfWidthOfTexture;
  const int numberOfPixels = widthOfMeteringTexture * widthOfMeteringTexture;
  for(int i = 0; i < numberOfPixels; ++i){
    float x = ((i % widthOfMeteringTexture) - halfWidthOfTexture) / halfWidthOfTexture;
    float y = (floor(i / widthOfMeteringTexture) - halfWidthOfTexture) / halfWidthOfTexture;

    //Use this to set the x y and z coordinates of our pixel
    float rhoSquared = x * x + y * y;
    float rho = sqrt(rhoSquared);
    float height = sqrt(1.0f - rhoSquared);
    float phi = TWO_OVER_PI - atan2(height, rho);
    float theta = atan2(y, x);
    float x3 = sin(phi) * cos(theta);
    float z3 = sin(phi) * sin(theta);
    float y3 = cos(phi);
    float normalizationConstant = 1.0f / sqrt(x3 * x3 + y3 * y3 + z3 * z3);
    x3 *= normalizationConstant;
    y3 *= normalizationConstant;
    z3 *= normalizationConstant;
    xyzPtr[i * 3] = x3;
    xyzPtr[i * 3 + 1] = y3;
    xyzPtr[i * 3 + 2] = z3;

    float pixelRadius = x * x + y * y;
    float thisPixelsWeight = pixelRadius < 1.0 ? 1.0f : 0.0f;
    skyState->lightingAnalyzer->pixelWeights[i] = thisPixelsWeight;
    if(!isnan(x3) && !isnan(y3) && !isnan(z3)){
      sumOfPixelWeights += thisPixelsWeight;
      sumOfPixelDirectionalWeights[0] += fmax(x3, 0.0f) * thisPixelsWeight;
      sumOfPixelDirectionalWeights[1] += fmax(y3, 0.0f) * thisPixelsWeight;
      sumOfPixelDirectionalWeights[2] += fmax(z3, 0.0f) * thisPixelsWeight;
      sumOfPixelDirectionalWeights[3] += fmax(-x3, 0.0f) * thisPixelsWeight;
      sumOfPixelDirectionalWeights[4] += fmax(-y3, 0.0f) * thisPixelsWeight;
      sumOfPixelDirectionalWeights[5] += fmax(-z3, 0.0f) * thisPixelsWeight;
    }
  }
  skyState->lightingAnalyzer->oneOverSumOfWeightWeights = 1.0f / sumOfPixelWeights;
  for(int i = 0; i < 6; ++i){
    skyState->lightingAnalyzer->oneOverSumOfDirectionalWeights[i] = 1.0f / sumOfPixelDirectionalWeights[i];
  }
  skyState->lightingAnalyzer->oneOverSumOfDirectionalWeights[4] = 1.0f;
}

int main(){
  return 0;
}
