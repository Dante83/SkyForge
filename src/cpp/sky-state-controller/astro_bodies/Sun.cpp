#include "Sun.h"
#include "../world_state/AstroTime.h"
#include "AstronomicalBody.h"
#include "../Constants.h"
#include <cmath>

//
//Constructor
//
Sun::Sun(AstroTime* astroTimeRef) : AstronomicalBody(astroTimeRef){
  //
  //Do nothing, just call the parent method and populate our values.
  //
}

//
//Methods
//
void Sun::updatePosition(){
  //Get the position of the sun relative to the earth
  setLongitude((meanLongitude + equationOfCenter) * DEG_2_RAD);
  double meanObliquityOfTheEclipiticInRads = (*meanObliquityOfTheEclipitic) * DEG_2_RAD;

  rightAscension = check4GreaterThan2Pi(atan2(cos(meanObliquityOfTheEclipiticInRads) * sin(trueLongitude), cos(trueLongitude)));
  declination = checkBetweenMinusPiOver2AndPiOver2(asin(sin(meanObliquityOfTheEclipiticInRads) * sin(trueLongitude)));

  //While we're here, let's calculate the distance from the earth to the sun, useful for figuring out the illumination of the moon
  double eccentricityOfTheEarthVal = *eccentricityOfTheEarth;
  distance2Earth = (1.000001018 * (1.0 - (eccentricityOfTheEarthVal * eccentricityOfTheEarthVal))) / (1.0 + eccentricityOfTheEarthVal * cos(equationOfCenter * DEG_2_RAD)) * 149597871.0;

  //Calculate the paralactic angle of the sun
  double hourAngle = (astroTime->greenwhichSiderealTime * DEG_2_RAD) - location->lonInRads - rightAscension;
  double paralacticAngleDenominator = tan(location->latInRads) * cos(declination) - sin(declination) * cos(hourAngle);
  paralacticAngle = paralacticAngleDenominator != 0.0 ? sin(hourAngle) / paralacticAngleDenominator : PI_OVER_TWO;

  //Update the paralactic angle
  updateParalacticAngle();
}

void Sun::setLongitude(double inValue){
  longitude = check4GreaterThan360(inValue);
}

void Sun::setMeanAnomaly(double inValue){
  meanAnomaly = check4GreaterThan360(inValue);
}

void Sun::setTrueLongitude(double inValue){
  trueLongitude = check4GreaterThan2Pi(inValue);
}

void Sun::setMeanLongitude(double inValue){
  meanLongitude = check4GreaterThan360(inValue);
  meanLongitudeInRads = meanLongitude * DEG_2_RAD;
}