class VisibleStar:
    def __init__(self, galactic_coordinates, bv, magnitude, galactic_latitude, galactic_longitude, bucket_id, index_in_potential_stars):\
        self.star_id = index_in_potential_stars
        self.galactic_coordinates = np.array(galactic_coordinates)
        self.temperature = self.bvToTemp(bv)
        self.magnitude = magnitude
        self.galactic_latitude = galactic_latitude
        self.galactic_longitude = galactic_longitude
        self.bucket_id = bucket_id
        self.position_in_dim_star_ordererd_array = None
        self.position_in_bright_star_ordered_array = None

        #Ecode our stellar data from the start into 4 colors that we can use to fill in the texture
        self.encoded_equitorial_r = self.float2RGBA(galactic_coordinates[0] * self.temperature, 0.0, 17000.0)
        self.encoded_equitorial_g = self.float2RGBA(galactic_coordinates[1] * self.temperature, 0.0, 17000.0)
        self.encoded_equitorial_b = self.float2RGBA(galactic_coordinates[2] * self.temperature, 0.0, 17000.0)
        self.encoded_equitorial_a = self.float2RGBA(self.magnitude, -2.0, 7.0)

    def bvToTemp(self, bv):
        return 4600 * ((1.0 / (0.92 * bv + 1.7)) + (1.0 / (0.92 * bv + 0.62)))

    def gauss(self, r):
        return exp(-0.5 * (r * r))

    def fastAiry(self, r):
        #Using the Airy Disk approximation from https://www.shadertoy.com/view/tlc3zM to score our stellar brightness
        return abs(r) < 1.88 if gauss(r / 1.4) else (abs(r) > 6.0 if 1.35 / abs(r**3) else (gauss(r / 1.4) + 2.7 / abs(r**3)) / 2.0)

    def float2RGBA(self, float_number, min_value, max_value):
        SCALE_CONSTANT = (2 ** 16)
        SCALE_RANGE = max_value - min_value
        scaled_integer = int(floor(((float_number - min_value) / SCALE_RANGE) * SCALE_CONSTANT))

        #Let's go with a 31 bit float as it's probably enough accuracy and doesn't
        #risk us hitting an overflow value
        R_byte = int(bin(scaled_integer & 0xff), 2)
        G_byte = int(bin(scaled_integer >> 8 & 0xff), 2)
        B_byte = int(bin(scaled_integer >> 16 & 0xff), 2)
        A_byte = int(bin(scaled_integer >> 24 & 0xfe), 2)

        #Test this works
        test_float = R_byte + G_byte * 256.0 + B_byte * 65536.0 + A_byte * 16777216.0
        scaled_test_float = ((float(test_float) * SCALE_RANGE) / SCALE_CONSTANT) + min_value
        diff = abs(scaled_test_float - float_number) / SCALE_RANGE
        if(diff > 0.0001):
            raise Exception("Float conversion did not work, {0} became {1}, with RGBA({2}, {3}, {4}, {5})".format(float_number, scaled_test_float, R_byte, G_byte, B_byte, A_byte))

        return [R_byte, G_byte, B_byte, A_byte]
