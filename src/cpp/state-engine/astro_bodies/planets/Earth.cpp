#include "../../world_state/AstroTime.h"
#include "../../Constants.h"
#include "../Planet.h"
#include "Earth.h"
#include <cmath>

//
//Constructor
//
Earth::Earth(AstroTime* astroTimeRef) : Planet(astroTimeRef){
  //
  //Default constructor
  //
};

void Earth::updatePosition(){
  updateEclipticalLongitude();
  updateEclipticalLatitude();
  updateRadiusVector();

  //Calculate earths distance from the sun
  heliocentric_x = radiusVector * cos(eclipticalLatitude) * cos(eclipticalLongitude);
  heliocentric_y = radiusVector * cos(eclipticalLatitude) * sin(eclipticalLongitude);
  heliocentric_z = radiusVector * sin(eclipticalLatitude);
  distanceFromSun = sqrt(heliocentric_x * heliocentric_x + heliocentric_y * heliocentric_y + heliocentric_z * heliocentric_z);
  sun->setScaleAndIrradiance(distanceFromSun);
}

void Earth::updateEclipticalLongitude(){
  const double L_0_A[64] = {175347045.673, 3341656.453, 34894.275, 3417.572, 3497.056,
  3135.899, 2676.218, 2342.691, 1273.165, 1324.294, 901.854, 1199.167, 857.223,
  779.786, 990.25, 753.141, 505.267, 492.392, 356.672, 284.125, 242.879, 317.087,
  271.112, 206.217, 205.478, 202.318, 126.225, 155.516, 115.132, 102.851, 101.724,
  99.206, 132.212, 97.607, 85.128, 74.651, 101.895, 84.711, 73.547, 73.874, 78.757,
  79.637, 85.803, 56.963, 61.148, 69.627, 56.116, 62.449, 51.145, 55.577, 41.036,
  51.605, 51.992, 49.0, 39.2, 35.57, 36.77, 36.596, 33.296, 35.954, 40.938, 30.047,
  30.412, 23.663};
  const double L_0_B[64] = {0.0, 4.66925680415, 4.62610242189, 2.82886579754, 2.74411783405,
  3.62767041756, 4.41808345438, 6.13516214446, 2.03709657878, 0.74246341673, 2.04505446477,
  1.10962946234, 3.50849152283, 1.17882681962, 5.23268072088, 2.53339052847, 4.58292599973,
  4.20505711826, 2.91954114478, 1.89869240932, 0.34481445893, 5.84901948512, 0.31486255375,
  4.80646631478, 1.86953770281, 2.45767790232, 1.08295459501, 0.83306084617, 0.64544911683,
  0.63599845579, 4.2667980198, 6.20992926918, 3.41118292683, 0.68101342359, 1.29870764804,
  1.755089133, 0.97569280312, 3.67080093031, 4.67926633877, 3.50319414955, 3.03697458703,
  1.80791287082, 5.9832263126, 2.78430458592, 1.81839892984, 0.83297621398, 4.38694865354,
  3.97763912806, 0.28306832879, 3.47006059924, 5.36817592855, 1.33282739866, 0.18914947184,
  0.48735014197, 6.16833020996, 1.775968892, 6.04133863162, 2.56957481827, 0.59310278598,
  1.70875808777, 2.39850938714, 2.73975124088, 0.44294464169, 0.48473622521};
  const double L_0_C[64] = {0.0, 6283.07584999, 12566.1517, 3.523118349, 5753.3848849,
  77713.7714681, 7860.41939244, 3930.20969622, 529.690965095, 11506.7697698, 26.2983197998,
  1577.34354245, 398.149003408, 5223.6939198, 5884.92684658, 5507.55323867, 18849.22755,
  775.522611324, 0.0673103028, 796.298006816, 5486.77784318, 11790.6290887, 10977.0788047,
  2544.31441988, 5573.14280143, 6069.77675455, 20.7753954924, 213.299095438, 0.9803210682,
  4694.00295471, 7.1135470008, 2146.16541648, 2942.46342329, 155.420399434, 6275.96230299,
  5088.62883977, 15720.8387849, 71430.6956181, 801.820931124, 3154.6870849, 12036.4607349,
  17260.1546547, 161000.685738, 6286.59896834, 7084.89678112, 9437.76293489, 14143.4952424,
  8827.39026987, 5856.47765912, 6279.55273164, 8429.24126647, 1748.01641307, 12139.5535091,
  1194.44701022, 10447.3878396, 6812.76681509, 10213.2855462, 1059.38193019, 17789.8456198,
  2352.86615377, 19651.0484811, 1349.86740966, 83996.8473181, 8031.09226306};

  double L0 = 0.0;
  for(int i = 0; i < 64; ++i){
    L0 += L_0_A[i] * cos(L_0_B[i] + L_0_C[i] * astroTime->julianCentury);
  }

  const double L_1_A[34] = {6.28307584999e+11, 206058.863, 4303.419, 425.264, 109.017,
  93.479, 119.305, 72.121, 67.784, 67.35, 59.045, 55.976, 45.411, 36.298, 28.962,
  19.097, 20.844, 18.508, 16.233, 17.293, 15.832, 14.608, 11.877, 11.514, 9.721,
  9.969, 9.452, 12.461, 11.808, 8.577, 10.641, 7.576, 5.764, 6.385};
  const double L_1_B[34] = {0.0, 2.67823455808, 2.63512233481, 1.59046982018, 2.96631010675,
  2.59211109542, 5.79555765566, 1.13840581212, 1.87453300345, 4.40932832004, 2.88815790631,
  2.17471740035, 0.39799502896, 0.46875437227, 2.64732254645, 1.84628376049, 5.34138275149,
  4.96855179468, 0.03216587315, 2.9911676063, 1.43049301283, 1.2046979369, 3.25805082007,
  2.07502080082, 4.2392586526, 1.30263423409, 2.69956827011, 2.83432282119, 5.27379760438,
  5.6447608598, 0.76614722966, 5.30056172859, 1.77228445837, 2.65034514038};
  const double L_1_C[34] = {0.0, 6283.07584999, 12566.1517, 3.523118349, 1577.34354245,
  18849.22755, 26.2983197998, 529.690965095, 398.149003408, 5507.55323867, 5223.6939198,
  155.420399434, 796.298006816, 775.522611324, 7.1135470008, 5486.77784318, 0.9803210682,
  213.299095438, 2544.31441988, 6275.96230299, 2146.16541648, 10977.0788047, 5088.62883977,
  4694.00295471, 1349.86740966, 6286.59896834, 242.728603974, 1748.01641307, 1194.44701022,
  951.718406251, 553.569402842, 2352.86615377, 1059.38193019, 9437.76293489};

  double L1 = 0.0;
  for(int i = 0; i < 34; ++i){
    L1 += L_1_A[i] * cos(L_1_B[i] + L_1_C[i] * astroTime->julianCentury);
  }

  const double L_2_A[20] = {8721.859, 990.99, 294.833, 27.338, 16.333, 15.745,
  9.425, 8.938, 6.94, 5.061, 4.06, 3.464, 3.172, 3.02, 2.885, 3.809, 2.719, 2.365,
  2.538, 2.078};
  const double L_2_B[20] = {1.07253635559, 3.14159265359, 0.43717350256, 0.05295636147,
  5.18820215724, 3.68504712183, 0.29667114694, 2.05706319592, 0.82691541038, 4.6624323168,
  1.03067032318, 5.14021224609, 6.05479318507, 1.19240008524, 6.11705865396, 3.44043369494,
  0.30363248164, 4.37666117992, 2.27966434314, 3.75435095487};
  const double L_2_C[20] = {6283.07584999, 0.0, 12566.1517, 3.523118349, 26.2983197998,
  155.420399434, 18849.22755, 77713.7714681, 775.522611324, 1577.34354245, 7.1135470008,
  796.298006816, 5507.55323867, 242.728603974, 529.690965095, 5573.14280143, 398.149003408,
  5223.6939198, 553.569402842, 0.9803210682};

  double L2 = 0.0;
  for(int i = 0; i < 20; ++i){
    L2 += L_2_A[i] * cos(L_2_B[i] + L_2_C[i] * astroTime->julianCentury);
  }

  const double L_3_A[7] = {289.058, 20.712, 2.962, 2.527, 1.288, 0.635, 0.57};
  const double L_3_B[7] = {5.84173149732, 6.0498393902, 5.1956057957, 3.14159265359,
  4.7219761197, 5.96904899168, 5.54182903238};
  const double L_3_C[7] = {6283.07584999, 12566.1517, 155.420399434, 0.0, 3.523118349,
  242.728603974, 18849.22755};

  double L3 = 0.0;
  for(int i = 0; i < 7; ++i){
    L3 += L_3_A[i] * cos(L_3_B[i] + L_3_C[i] * astroTime->julianCentury);
  }

  const double L_4_A[3] = {7.714, 1.016, 0.42};
  const double L_4_B[3] = {4.14117321449, 3.27573644241, 0.41892851415};
  const double L_4_C[3] = {6283.07584999, 12566.1517, 155.420399434};

  double L4 = 0.0;
  for(int i = 0; i < 3; ++i){
    L4 += L_4_A[i] * cos(L_4_B[i] + L_4_C[i] * astroTime->julianCentury);
  }

  const double L_5_A = 0.172;
  const double L_5_B = 2.74854172392;
  const double L_5_C = 6283.07584999;
  double L5 = L_5_A * cos(L_5_B + L_5_C * astroTime->julianCentury);

  double julianCenturyMultiple = 1.0;
  double LValues[5] = {L0, L1, L2, L3, L4};
  eclipticalLongitude = 0.0;
  for(int i = 0; i < 5; ++i){
    eclipticalLongitude += LValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  eclipticalLongitude = eclipticalLongitude / 1.0e-8;
}

void Earth::updateEclipticalLatitude(){
  const double B_0_A[5] = {279.62, 101.643, 80.445, 43.806, 31.933};
  const double B_0_B[5] = {3.19870156017, 5.42248619256, 3.88013204458, 3.70444689759,
  4.00026369781};
  const double B_0_C[5] = {84334.6615813, 5507.55323867, 5223.6939198, 2352.86615377,
  1577.34354245};

  double B0 = 0.0;
  for(int i = 0; i < 5; ++i){
    B0 += B_0_A[i] * cos(B_0_B[i] + B_0_C[i] * astroTime->julianCentury);
  }

  const double B_1_A[2] = {227777.722, 3805.678};
  const double B_1_B[2] = {3.4137662053, 3.37063423795};
  const double B_1_C[2] = {6283.07584999, 12566.1517};

  double B1 = 0.0;
  for(int i = 0; i < 2; ++i){
    B1 += B_1_A[i] * cos(B_1_B[i] + B_1_C[i] * astroTime->julianCentury);
  }

  double julianCenturyMultiple = 1.0;
  double BValues[1] = {B0};
  eclipticalLatitude = 0.0;
  for(int i = 0; i < 1; ++i){
    eclipticalLatitude += BValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  eclipticalLatitude = eclipticalLatitude / 1.0e-8;
}

void Earth::updateRadiusVector(){
  const double R_0_A[40] = {100013988.784, 1670699.632, 13956.024, 3083.72, 1628.463,
  1575.572, 924.799, 542.439, 472.11, 328.78, 345.969, 306.784, 174.844, 243.181,
  211.836, 185.74, 109.835, 98.316, 86.5, 85.831, 62.917, 57.056, 64.908, 49.384,
  55.736, 42.52, 46.966, 38.963, 44.666, 35.661, 31.922, 31.846, 33.193, 38.245,
  28.468, 37.486, 36.957, 34.537, 26.275, 24.596};
  const double R_0_B[40] = {0.0, 3.09846350258, 3.05524609456, 5.19846674381, 1.17387558054,
  2.84685214877, 5.45292236722, 4.56409151453, 3.66100022149, 5.89983686142, 0.96368627272,
  0.29867139512, 3.01193636733, 4.2734953079, 5.84714461348, 5.02199710705, 5.0551063586,
  0.88681311278, 5.68956418946, 1.27079125277, 0.92177053978, 2.01374292245, 0.27251341435,
  3.24501240359, 5.2415979917, 6.01110257982, 2.57799853213, 5.36063832897, 5.53715663816,
  1.67447135798, 0.18368299942, 1.77775642078, 0.24370221704, 2.39255343973, 1.21344887533,
  0.82961281844, 4.90107587287, 1.84270693281, 4.58896863104, 3.78660838036};
  const double R_0_C[40] = {0.0, 6283.07584999, 12566.1517, 77713.7714681, 5753.3848849,
  7860.41939244, 11506.7697698, 3930.20969622, 5884.92684658, 5223.6939198, 5507.55323867,
  5573.14280143, 18849.22755, 11790.6290887, 1577.34354245, 10977.0788047, 5486.77784318,
  6069.77675455, 15720.8387849, 161000.685738, 529.690965095, 83996.8473181, 17260.1546547,
  2544.31441988, 71430.6956181, 6275.96230299, 775.522611324, 4694.00295471, 9437.76293489,
  12036.4607349, 5088.62883977, 398.149003408, 7084.89678112, 8827.39026987, 6286.59896834,
  19651.0484811, 12139.5535091, 2942.46342329, 10447.3878396, 8429.24126647};

  double R0 = 0.0;
  for(int i = 0; i < 40; ++i){
    R0 += R_0_A[i] * cos(R_0_B[i] + R_0_C[i] * astroTime->julianCentury);
  }

  const double R_1_A[10] = {103018.607, 1721.238, 702.217, 32.345, 30.801, 24.978,
  18.487, 10.077, 8.635, 8.654};
  const double R_1_B[10] = {1.10748968172, 1.06442300386, 3.14159265359, 1.02168583254,
  2.84358443952, 1.31906570344, 1.42428709076, 5.91385248388, 0.27158192945, 1.42046854427};
  const double R_1_C[10] = {6283.07584999, 12566.1517, 0.0, 18849.22755, 5507.55323867,
  5223.6939198, 1577.34354245, 10977.0788047, 5486.77784318, 6275.96230299};

  double R1 = 0.0;
  for(int i = 0; i < 10; ++i){
    R1 += R_1_A[i] * cos(R_1_B[i] + R_1_C[i] * astroTime->julianCentury);
  }

  const double R_2_A[6] = {4359.385, 123.633, 12.342, 8.792, 5.689, 3.302};
  const double R_2_B[6] = {5.78455133808, 5.57935427994, 3.14159265359, 3.62777893099,
  1.86958905084, 5.47034879713};
  const double R_2_C[6] = {6283.07584999, 12566.1517, 0.0, 77713.7714681, 5573.14280143,
  18849.22755};

  double R2 = 0.0;
  for(int i = 0; i < 6; ++i){
    R2 += R_2_A[i] * cos(R_2_B[i] + R_2_C[i] * astroTime->julianCentury);
  }

  const double R_3_A[2] = {144.595, 6.729};
  const double R_3_B[2] = {4.27319433901, 3.91706261708};
  const double R_3_C[2] = {6283.07584999, 12566.1517};

  double R3 = 0.0;
  for(int i = 0; i < 2; ++i){
    R3 += R_3_A[i] * cos(R_3_B[i] + R_3_C[i] * astroTime->julianCentury);
  }

  const double R_4_A = 3.858;
  const double R_4_B = 2.56389016346;
  const double R_4_C = 6283.07584999;
  double R4 = R_4_A * cos(R_4_B + R_4_C * astroTime->julianCentury);

  double julianCenturyMultiple = 1.0;
  double RValues[4] = {R0, R1, R2, R3};
  radiusVector = 0.0;
  for(int i = 0; i < 4; ++i){
    radiusVector += RValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  radiusVector = radiusVector / 1.0e-8;
}