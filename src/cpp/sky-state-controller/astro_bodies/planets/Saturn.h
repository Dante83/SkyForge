#pragma once
#include "AstronomicalBody.h"
#include "Sun.h"
#include "../world_state/AstroTime.h"

class Saturn : public Planet{
public:
  Saturn(SkyManager* skyManager, Sun* sunRef);
  void updatePosition();
};
