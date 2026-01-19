
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, Loader2, AlertCircle, Gamepad2, Zap, Trophy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- TRIBAL DRAGON SVG (Watermark) ---
const TribalPattern = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 336.94 398.5" 
    className={className} 
    fill="currentColor"
  >
    <path d="m 139.11199999999735 398.33190000000013 c -39.869,-1.6419 -62.85,-6.0582 -82.433,-15.8437 -12.181,-6.0869 -23.437,-15.7569 -31.303,-26.8924 -1.608,-2.2771 -1.785,-2.3989 -2.404,-1.6527 -1.24,1.4942 0.851,6.9029 3.955,10.2299 2.69,2.8817 0.928,1.8005 -2.213,-1.3589 -4.843,-4.8704 -6.774,-10.5148 -5.362,-15.6718 l 0.475,-1.7378 -3.005,-6.0958 c -4.828,-9.791 -5.751,-10.9008 -7.466,-8.9812 -1.854,2.0747 -2.138,10.384 -0.505,14.7491 1.08,2.8853 0.809,3.069 -0.445,0.3028 -1.707,-3.765 -2.565,-7.6921 -2.585,-11.8253 -0.02,-4.6419 0.545,-6.7963 2.855,-10.8631 2.072,-3.6486 2.246,-4.6689 1.693,-9.9513 -0.444,-4.2433 -1.065,-6.4094 -2.199,-7.6796 -2.881,-3.2239 -7.279,2.3721 -7.334,9.3296 -0.03,3.2965 -0.505,2.3174 -0.788,-1.6097 -0.35,-4.8354 1.233,-9.9137 3.929,-12.61 0.671,-0.6709 2.44,-1.8301 3.929,-2.5753 3.314,-1.6572 3.828,-2.3801 4.316,-6.0699 0.195,-1.478 0.562,-3.8044 0.815,-5.1705 0.88,-4.7566 0.464,-6.206 -1.778,-6.206 -2.268,0 -4.992,3.3225 -6.136,7.4852 l -0.418,1.5211 -0.03,-1.4351 c -0.06,-3.2911 1.875,-7.8883 4.254,-10.0802 1.98,-1.8257 4.098,-2.7707 7.394,-3.3019 3.338,-0.5375 4.034,-0.9101 5.538,-2.9686 4.796,-6.5706 4.243,-10.5031 -1.477,-10.4951 -2.264,0 -4.762,1.1699 -5.757,2.6883 -0.799,1.2209 -0.966,0.7381 -0.237,-0.6898 2.374,-4.6536 7.906,-5.9444 14.955,-3.4899 4.261,1.4843 4.913,1.4735 7.851,-0.1272 6.519,-3.5527 8.86,-5.622 9.336,-8.2565 0.192,-1.0597 0.101,-1.2944 -0.867,-2.2627 -2.485,-2.4849 -6.352,-2.0998 -9.751,0.971 -1.743,1.5739 -1.553,0.8904 0.343,-1.2362 2.206,-2.475 4.453,-3.5455 7.406,-3.5267 3.893,0.027 5.977,1.4727 7.749,5.3819 1.538,3.3905 2.658,3.4165 10.232,0.2418 l 4.381,-1.8363 -0.193,-1.6456 c -0.107,-0.9056 -0.538,-2.3335 -0.96,-3.1737 -0.421,-0.8403 -1.078,-2.665 -1.459,-4.0562 -0.38,-1.3902 -1.159,-3.6655 -1.729,-5.0558 -1.447,-3.5303 -2.174,-7.0498 -1.951,-9.4406 0.113,-1.2049 0,-2.9015 -0.315,-4.4942 -0.41,-2.1131 -0.431,-2.8835 -0.121,-4.4243 0.206,-1.0265 0.59,-3.0035 0.851,-4.3938 0.262,-1.3903 0.805,-3.2392 1.206,-4.1081 0.401,-0.8689 0.83,-2.2914 0.954,-3.1603 0.379,-2.6676 1.379,-5.1866 3.859,-9.7246 1.739,-3.181 2.33,-4.5506 2.196,-5.0863 -0.22,-0.8716 1.653,-4.9241 3.597,-7.7871 1.616,-2.3801 6.512,-7.5237 8.94,-9.3914 2.257,-1.7369 2.128,-2.0889 -0.269,-0.7363 -0.981,0.5536 -1.689,0.8546 -1.574,0.6683 0.243,-0.3933 10.326,-8.4778 11.635,-9.3288 0.483,-0.3144 0.814,-0.6351 0.735,-0.7139 -0.242,-0.2428 -3.75,0.5715 -5.219,1.2102 -0.765,0.3332 -1.462,0.5357 -1.548,0.4488 -0.09,-0.09 1.677,-1.0212 3.919,-2.0773 8.753,-4.1242 11.982,-5.828 11.245,-5.9346 -0.7,-0.1003 -3.079,0.318 -4.324,0.7614 -0.444,0.1577 -0.537,0.1236 -0.315,-0.1164 0.174,-0.1873 2.665,-1.3957 5.535,-2.6847 5.457,-2.4491 9.019,-4.3284 8.211,-4.3311 -0.46,0 -5.204,1.2514 -6.478,1.7109 -1.513,0.5465 0.751,-0.6243 4.265,-2.2063 2,-0.8994 4.773,-2.3066 6.163,-3.1281 l 2.528,-1.4923 -2.369,0.1702 c -2.705,0.1952 -2.666,0.1621 2.022,-1.7325 2.461,-0.9943 6.637,-3.5527 7.493,-4.59 0.404,-0.49 0.376,-0.4989 -0.346,-0.1138 -0.838,0.4461 -4.904,1.5695 -5.694,1.5721 -0.26,0 0.644,-0.4864 2.01,-1.083 2.625,-1.1457 2.959,-1.3732 5.338,-3.6252 1.603,-1.5184 1.941,-2.1768 0.804,-1.5685 -0.718,0.3843 -3.642,1.229 -4.201,1.2129 -0.174,0 0.537,-0.4381 1.58,-0.9639 1.879,-0.9459 4.313,-3.0179 4.974,-4.2335 0.286,-0.5267 0.269,-0.5733 -0.104,-0.2795 -0.548,0.4336 -4.118,1.7692 -4.283,1.6035 -0.06,-0.063 0.463,-0.3816 1.174,-0.7032 1.671,-0.7534 3.28,-2.6497 4.094,-4.8247 0.73,-1.9528 0.659,-2.2412 -0.375,-1.5166 -0.397,0.2786 -1.153,0.4936 -1.679,0.4775 l -0.957,-0.027 1.028,-0.2965 c 1.091,-0.3153 2.299,-1.8283 2.948,-3.6915 0.697,-2.0021 -0.451,-1.4933 -2.285,1.0113 -1.015,1.3876 -1.17,1.2918 -0.36,-0.2212 0.703,-1.3124 0.785,-6.8582 0.123,-8.2798 l -0.442,-0.9477 -0.307,1.4225 -0.308,1.4216 -0.429,-1.659 c -0.556,-2.1508 -1.426,-3.8187 -2.548,-4.8829 -1.266,-1.2022 -5.408,-3.043 -8.219,-3.653 -2.362,-0.5124 -2.381,-0.5115 -2.899,0.1711 -0.384,0.5043 -0.734,0.6387 -1.313,0.5061 -0.439,-0.1012 -0.159,0.1433 0.632,0.5509 1.928,0.9943 5.326,4.4727 6.446,6.5975 l 0.916,1.7378 -0.916,-0.8295 c -4.07,-3.6871 -9.807,-4.4548 -12.578,-1.6841 -0.831,0.8313 -0.593,1.3231 1.314,2.7053 3.596,2.6103 4.969,4.3705 5.46,6.997 0.304,1.6285 -0.02,1.4628 -0.957,-0.4882 -0.886,-1.8445 -2.805,-3.2625 -4.866,-3.5966 l -1.185,-0.1926 0.538,1.2308 c 2.295,5.2466 3.076,8.5682 2.529,10.7494 -0.216,0.8582 -0.248,0.8259 -0.793,-0.782 -1.237,-3.653 -5.115,-6.1102 -9.938,-6.2947 -2.31,-0.09 -3.094,0 -3.982,0.4613 -1.249,0.645 -1.299,1.0418 -0.739,5.7859 0.491,4.1744 -0.438,7.0042 -2.739,8.3371 l -1.027,0.5948 0.696,-0.9415 c 2.183,-2.9525 0.431,-6.8026 -2.844,-6.249 -3.116,0.5258 -4.93,3.0251 -6.635,9.1397 l -1.152,4.1296 -0.218,-2.2117 c -0.252,-2.5539 -0.388,-2.8513 -1.501,-3.2741 -1.866,-0.7095 -4.041,1.9447 -4.876,5.9552 -0.514,2.4589 -0.319,4.5237 0.64,6.8196 0.711,1.7029 0.45,1.6402 -1.199,-0.2912 -2.406,-2.8163 -5.446,-4.3938 -7.188,-3.73 -1.834,0.6996 -3.535,3.2051 -3.508,5.1678 0.02,1.3311 -0.339,1.3302 -1.004,0 -0.562,-1.126 -0.171,-5.742 0.582,-6.8922 0.716,-1.0919 3.081,-2.1185 4.276,-1.8561 0.507,0.1111 1.401,0.5277 1.987,0.9254 l 1.066,0.7238 -0.142,-1.4807 c -0.179,-1.8678 0.589,-3.4631 2.641,-5.4858 2.499,-2.4652 4.819,-3.2159 7.087,-2.2941 0.332,0.1343 0.892,-0.3754 1.83,-1.6635 1.89,-2.5951 5.086,-4.7736 7.729,-5.2699 l 1.16,-0.2177 -0.226,-1.4682 c -0.125,-0.8071 -0.223,-2.8423 -0.218,-4.5237 0,-1.7629 -0.114,-2.9803 -0.28,-2.8773 -0.164,0.1013 -0.219,2.0021 -0.128,4.3984 l 0.162,4.2209 h -0.728 c -1.905,0 -6.434,3.1182 -8.13,5.5969 -0.677,0.9907 -0.757,1.0194 -2.35,0.8321 -1.388,-0.1621 -1.921,-0.063 -3.378,0.6531 -3.008,1.4717 -6.101,5.4634 -5.803,7.4896 0.13,0.8877 0.113,0.9003 -0.59,0.4399 -0.95,-0.6226 -3.063,-0.6047 -4.418,0.036 -1.427,0.6772 -2.245,1.8829 -2.682,3.9531 -0.435,2.0657 -0.321,1.9438 -1.424,1.5246 -1.101,-0.4183 -1.218,-0.4094 -1.237,0.095 -0.03,0.7453 -1.482,5.1355 -1.988,5.9981 -0.409,0.6996 -0.43,0.9433 -0.106,1.2649 0.324,0.3207 0.363,0.2965 0.203,-0.1236 -0.109,-0.2867 -0.08,-0.5921 0.06,-0.6799 0.141,-0.09 0.293,0.3242 0.336,0.9164 0.09,1.2567 -0.09,1.3221 -1.084,0.3878 -0.404,-0.378 -0.732,-0.5285 -0.732,-0.3341 0,0.1944 0.249,0.5437 0.552,0.7775 0.305,0.2329 1.036,0.9442 1.626,1.5802 l 1.072,1.1565 -1.53,-0.4596 c -0.841,-0.2535 -2.867,-1.1072 -4.503,-1.8972 -1.635,-0.791 -3.06,-1.3509 -3.165,-1.2452 -0.106,0.1057 0.04,1.0741 0.316,2.1517 l 0.509,1.9591 -1.101,-1.264 c -1.549,-1.7772 -2.14,-2.9803 -1.688,-3.4335 0.202,-0.2025 1.555,-0.3834 3.104,-0.4166 3.339,-0.072 3.398,-0.1245 4.827,-4.4502 1.144,-3.4631 1.894,-5.0997 3.077,-6.7103 0.648,-0.8815 0.678,-0.9881 0.148,-0.5268 -0.84,0.731 -2.678,4.2559 -3.406,6.5312 -1.225,3.8268 -2.225,4.9743 -4.02,4.6151 -0.518,-0.1039 -1.923,-0.098 -3.12,0.01 -1.867,0.1738 -2.098,0.2598 -1.625,0.6056 0.649,0.4739 0.346,0.9513 -0.355,0.5599 -0.263,-0.1479 -1.248,-1.548 -2.189,-3.1102 -1.543,-2.5655 -1.877,-2.923 -3.439,-3.679 -2.787,-1.3499 -4.367,-3.6673 -4.367,-6.4058 0,-2.0683 0.565,-3.0008 2.595,-4.2854 2.737,-1.7298 7.977,-8.7142 9.26,-12.3403 1.063,-3.0072 1.098,-3.6656 0.25,-4.797 -0.428,-0.5715 -1.131,-1.727 -1.563,-2.5682 -0.941,-1.8336 -0.859,-2.4034 0.859,-6.017 0.92,-1.9357 1.302,-3.2409 1.552,-5.3093 0.515,-4.2567 1.335,-6.1836 4.356,-10.228 1.804,-2.416 1.892,-2.622 2.252,-5.2896 0.458,-3.3969 1.574,-7.3294 2.949,-10.401 l 1.033,-2.3084 0.189,3.5714 c 0.105,1.9645 0.342,3.722 0.526,3.9066 0.451,0.4505 1.904,-1.5739 3.27,-4.556 6.096,-13.3024 9.782,-18.8975 19.722,-29.9407 8.862,-9.8456 10.012,-11.8091 9.995,-17.0647 -0.02,-4.65 -1.372,-10.1707 -3.211,-13.0695 -1.124,-1.7737 -0.842,-1.8883 0.692,-0.2822 6.63,6.9397 8.261,15.5965 4.592,24.3913 -0.548,1.3151 -2.716,4.9502 -4.818,8.0791 -4.002,5.9579 -6.429,9.9164 -8.097,13.2075 -1.144,2.2556 -3.126,7.1752 -2.891,7.1752 0.491,0 2.739,-1.9689 7.485,-6.5589 2.934,-2.837 5.408,-5.0845 5.498,-4.994 0.09,0.09 -0.395,0.7712 -1.079,1.513 -3.494,3.7972 -5.644,8.3585 -4.419,9.3761 1.062,0.8806 2.72,-0.6019 5.264,-4.7082 4.534,-7.3186 7.564,-10.0435 17.054,-15.3403 3.042,-1.6975 7.165,-4.083 9.165,-5.3004 1.998,-1.2174 5.947,-3.6091 8.775,-5.3147 8.82,-5.3218 10.778,-6.919 13.493,-11.0029 2.746,-4.1305 5.725,-11.363 6.709,-16.2898 0.201,-1.0006 0.273,-0.5393 0.345,2.2116 0.283,10.7737 -3.268,19.3078 -11.445,27.5015 -6.495,6.5088 -12.364,10.8901 -20.09,14.9982 -6.035,3.2087 -9.117,5.3496 -11.505,7.9904 -4.127,4.5622 -4.703,7.5738 -0.971,5.0764 0.691,-0.464 3.501,-2.4697 6.242,-4.4583 8.402,-6.0932 13.397,-8.1472 20.556,-8.4554 l 3.217,-0.1388 -2.054,0.473 c -8.96,2.0612 -15.386,6.6709 -12.695,9.1065 1.397,1.2649 4.301,0.4569 11.736,-3.2615 6.244,-3.1236 9.941,-4.4951 14.036,-5.2081 5.063,-0.8806 12.069,-0.4676 15.522,0.9146 l 1.264,0.5052 -1.08,-0.1666 c -4.852,-0.748 -9.296,-0.2804 -14.627,1.5407 -3.71,1.2676 -6.138,2.6605 -8.396,4.8158 -1.551,1.4816 -1.686,1.7217 -1.594,2.8414 0.166,2.0164 0.966,2.2009 6.105,1.4082 10.98,-1.694 20.452,-0.1039 28.079,4.7127 2.462,1.5551 2.713,1.9062 0.598,0.8376 -5.422,-2.7403 -14.08,-3.8286 -16.337,-2.0532 -1.876,1.4754 -0.937,2.3461 4.94,4.5811 5.707,2.1704 8.224,3.6664 11.559,6.8679 2.969,2.8504 4.142,4.4387 2.095,2.8379 -3.395,-2.656 -7.956,-4.7781 -9.457,-4.4019 -1.26,0.3171 -1.857,1.5193 -1.415,2.8567 0.459,1.392 1.945,2.5942 6.64,5.3702 8.65,5.1149 12.3,8.9453 13.762,14.4356 0.248,0.9325 0.45,2.123 0.448,2.6443 0,0.8188 -0.104,0.7059 -0.733,-0.8241 -1.11,-2.6981 -1.939,-3.8653 -4.291,-6.0439 -3.479,-3.2203 -6.81,-4.6213 -8.239,-3.4649 -2.057,1.6662 -0.222,5.5879 5.497,11.7536 6.763,7.2899 8.827,11.7259 9.189,19.7521 l 0.171,3.7927 -0.797,-2.9632 c -2.433,-9.0376 -9.117,-15.8868 -10.41,-10.6652 -0.457,1.848 0.415,5.3917 2.5,10.1519 4.858,11.0916 5.802,16.6231 4.153,24.3331 -1.077,5.0388 -1.292,4.9967 -1.323,-0.2553 -0.03,-4.2908 -0.115,-5.0692 -0.859,-7.3293 -2.128,-6.4685 -5.555,-9.1066 -8.284,-6.3771 -2.045,2.0451 -2.34,4.5336 -1.9,16.0157 0.319,8.3075 -0.02,10.6088 -2.207,15.0107 -1.278,2.5691 -3.46,5.7456 -2.823,4.1081 1.831,-4.7101 2.34,-7.9161 1.754,-11.0549 -0.422,-2.2583 -1.187,-3.1827 -2.382,-2.8826 -1.134,0.2839 -1.541,1.3069 -3.034,7.6168 -1.025,4.3383 -1.587,6.0116 -2.92,8.6909 l -1.65,3.318 -0.08,-1.5802 c -0.182,-3.6225 -0.696,-4.4466 -2.17,-3.4801 -1.366,0.8949 -1.828,2.2726 -1.799,5.3765 0.03,3.2723 0.519,4.8838 2.156,7.1143 1.796,2.4473 9.109,7.6178 10.009,7.0785 0.432,-0.2589 4.548,-3.3995 8.964,-6.8393 1.399,-1.0902 3.106,-2.4079 3.793,-2.9283 6.605,-5.0101 7.083,-5.4813 9.883,-9.765 10.474,-16.0238 19.753,-34.6588 24.35,-48.9035 4.069,-12.6082 5.557,-22.2092 5.554,-35.8207 0,-15.7873 -2.588,-29.5779 -9.531,-50.8779 -2.716,-8.3308 -9.272,-25.5128 -10.407,-27.2748 -0.603,-0.937 -5.496,-4.1583 -8.985,-5.914 -5.58,-2.8101 -7.852,-2.948 -13.771,-0.8367 -4.192,1.496 -5.954,1.8454 -6.6,1.3088 -0.729,-0.6047 -0.582,-0.8125 1.353,-1.8991 1,-0.5607 3.796,-2.2968 6.213,-3.8581 9.345,-6.0322 10.791,-6.344 15.412,-3.3207 1.935,1.2657 2.094,1.3105 5.099,1.4422 l 3.102,0.1362 3.966,-2.0129 3.966,-2.0128 h 3.518 c 3.094,0 3.759,0.1012 5.503,0.8358 2.3,0.9692 5.058,2.587 6.494,3.8097 l 1.003,0.8528 -2.37,-0.9011 c -4.942,-1.8803 -9.428,-2.0129 -11.113,-0.3279 -1.869,1.8686 -0.876,2.8092 5.693,5.39 27.761,10.9052 38.733,15.609 42.709,18.3089 8.844,6.0062 43.474,40.4124 57.091,56.7229 14.539,17.4176 23.242,34.0721 25.758,49.2986 0.638,3.8653 0.544,19.813 -0.156,26.3871 -1.397,13.1152 -3.972,25.5254 -7.229,34.8506 -1.217,3.4846 -1.46,3.4147 -0.4,-0.1147 5.058,-16.8363 3.766,-46.5271 -2.572,-59.1326 -3.314,-6.5885 -6.78,-6.334 -8.977,0.6576 -2.16,6.8751 -3.817,22.1267 -4.414,40.6453 -0.841,26.0055 -0.964,28.1536 -2.091,36.342 -0.955,6.9423 -3.339,14.0235 -6.695,19.8945 -5.196,9.0859 -15.472,22.4035 -28.177,36.5139 -1.487,1.651 -3.326,3.7131 -4.088,4.582 -2.081,2.3747 -0.638,0.4515 3.475,-4.6303 12.962,-16.0149 22.741,-33.2104 23.273,-40.9293 0.297,-4.3186 -0.749,-6.1845 -4.424,-7.8811 -1.93,-0.8913 -2.102,-0.9128 -7.034,-0.8905 -8.272,0.036 -17.464,2.502 -28.125,7.5426 -20.317,9.6037 -36.716,30.5399 -39.866,50.8967 -0.477,3.0779 -0.44,8.9596 0.07,11.8852 l 0.201,1.1404 2.889,0.1836 c 4.62,0.2938 8.86,1.9161 5.208,1.9922 -2.669,0.054 -3.748,1.3088 -3.279,3.8071 0.544,2.8988 3.591,4.4073 8.355,4.1367 3.564,-0.2015 5.406,-0.8653 8.263,-2.9784 3.072,-2.2717 4.273,-2.8648 6.512,-3.2159 3.255,-0.5106 7.29,0.4228 10.228,2.3676 1.491,0.9871 1.492,1.2908 0,0.5464 -3.982,-1.986 -9.737,0.1218 -10.331,3.7838 -0.377,2.3219 1.928,4.6401 7.262,7.3051 l 3.535,1.7665 2.054,-0.5205 c 6.426,-1.6267 12.835,0.6952 14.151,5.1266 0.622,2.0935 0.47,2.6578 -0.333,1.2407 -1.086,-1.9179 -3.001,-3.1057 -5.272,-3.2696 -2.435,-0.1765 -3.225,0.045 -4.627,1.272 -1.766,1.5515 -1.481,3.1245 1.734,9.5688 2.779,5.5699 3.438,6.4765 4.709,6.481 2.598,0.01 6.134,3.0259 7.353,6.2704 0.972,2.5933 0.79,6.1622 -0.446,8.6775 -1.047,2.1338 -1.337,2.2278 -0.632,0.2052 1.222,-3.5053 -0.7,-8.5199 -3.265,-8.5199 -2.458,0 -5.418,6.2634 -5.092,10.7763 0.121,1.6626 0.276,1.9779 1.928,3.9128 2.273,2.6632 2.882,4.5309 2.685,8.252 -0.146,2.7877 -1.616,6.5312 -3.09,7.865 -0.64,0.5796 -0.64,0.5643 0.04,-0.9675 2.198,-4.9581 0.08,-10.529 -3.378,-8.8799 -2.294,1.0938 -5.232,9.705 -5.369,15.7399 -0.121,5.3352 -1.235,7.5165 -5.456,10.6876 -2.651,1.9913 -2.979,2.02 -1.104,0.095 3.085,-3.1684 4.438,-9.2436 2.059,-9.2436 -0.267,0 -1.92,1.3939 -3.674,3.0976 -1.754,1.7047 -4.043,3.6719 -5.086,4.3733 -12.261,8.2448 -32.327,12.4209 -68.89,14.3379 -8.751,0.4586 -31.814,0.636 -39.818,0.3072 z m 23.383,-8.019 c 1.78,-3.7507 3.086,-4.427 7.902,-4.0947 1.564,0.1075 2.74,0.081 2.611,-0.054 -0.31,-0.3315 -4.195,-1.0741 -5.699,-1.0884 l -1.191,-0.01 0.632,-1.2379 c 1.452,-2.8459 4.636,-3.8071 8.93,-2.6946 2.353,0.6101 2.673,0.404 0.715,-0.4622 -2.796,-1.2371 -3.821,-1.3831 -5.625,-0.8044 -2.581,0.8286 -3.963,1.8803 -4.775,3.6324 -0.395,0.8537 -1.321,2.2063 -2.058,3.0054 -1.917,2.08 -2.636,3.8984 -2.741,6.9351 l -0.09,2.5288 0.312,-2.02 c 0.171,-1.1107 0.656,-2.7464 1.077,-3.6342 z m -15.293,-2.2789 c 1.212,-1.2505 3.56,-2.3067 5.693,-2.5593 2.248,-0.266 1.443,-0.8411 -0.937,-0.6691 -3.424,0.2481 -6.455,2.9525 -6.867,6.128 l -0.16,1.2407 0.635,-1.5542 c 0.349,-0.8546 1.086,-2.0191 1.636,-2.5861 z m -6.649,-1.2631 c 1.331,-2.1543 5.716,-5.0764 6.103,-4.0668 0.415,1.0812 0.774,0.3654 0.611,-1.2156 -0.207,-2.003 0.332,-3.2643 1.908,-4.4664 2.349,-1.7925 7.3,-2.8119 11.606,-2.39 1.314,0.129 2.486,0.1049 2.661,-0.054 0.565,-0.5115 -0.498,-0.8331 -3.451,-1.0445 -6.624,-0.4748 -13.047,2.4034 -13.64,6.1111 -0.253,1.5828 -0.273,1.607 -2.456,2.8996 -3.073,1.8211 -4.982,4.8104 -4.92,7.7056 0.02,0.7865 0.11,0.6431 0.481,-0.7355 0.252,-0.9415 0.747,-2.1758 1.097,-2.7429 z m 21.469,0.2553 c 0,-0.1379 -0.675,-0.4308 -1.501,-0.6512 -0.825,-0.2204 -1.892,-0.774 -2.369,-1.2308 -1.368,-1.307 -1.156,-2.1445 1.105,-4.3473 3.255,-3.1692 5.444,-3.9011 9.56,-3.1925 1.856,0.3198 1.682,-0.027 -0.409,-0.8233 -2.129,-0.8089 -3.47,-0.7085 -5.746,0.4291 -2.237,1.118 -6.238,4.702 -6.525,5.845 -0.369,1.47 1.298,3.0708 3.942,3.7829 1.811,0.4873 1.943,0.5008 1.943,0.1881 z m -73.327,-6.2266 c 0.559,-1.4252 1.813,-2.9319 3.207,-3.8545 1.212,-0.8018 1.261,-0.808 1.688,-0.224 0.555,0.7579 2.884,0.748 5.206,-0.027 2.271,-0.7542 2.233,-1.0722 -0.07,-0.5894 -3.55,0.7435 -4.645,0.3879 -4.645,-1.5094 0,-1.4449 1.138,-2.3398 3.724,-2.9283 2.947,-0.67 4.725,-0.6459 6.087,0.081 1.09,0.5832 1.126,0.5832 1.848,0 0.852,-0.6915 2.614,-0.7704 5.591,-0.2517 3.197,0.5563 3.364,0.1756 0.288,-0.6593 -3.601,-0.9773 -4.948,-0.9934 -5.928,-0.072 -0.733,0.6889 -0.783,0.6934 -2.265,0.1882 -2.1,-0.7158 -6.531,-0.4641 -8.484,0.481 -1.381,0.6683 -1.837,0.6602 -3.337,-0.063 -0.768,-0.37 -1.632,-1.7307 -1.632,-2.5691 0,-0.267 0.39,-0.9057 0.869,-1.4189 l 0.869,-0.9343 4.108,1.0874 c 4.476,1.1852 6.517,1.3186 2.686,0.1765 -1.303,-0.3897 -3.285,-1.0033 -4.403,-1.3661 l -2.034,-0.6584 0.854,-0.7336 c 1.289,-1.109 2.787,-1.3535 7.637,-1.2469 4.343,0.095 4.483,0.12 7.585,1.3795 3.294,1.3374 6.226,2.1803 3.949,1.1358 -0.608,-0.2795 -2.528,-1.1681 -4.265,-1.9752 l -3.161,-1.4673 -4.59,-0.1084 c -4.377,-0.103 -4.676,-0.072 -6.448,0.7131 -1.022,0.4523 -1.889,0.7847 -1.926,0.739 -0.04,-0.045 -0.301,-0.5384 -0.584,-1.0947 -0.978,-1.9232 -0.553,-3.2158 1.38,-4.2021 2.032,-1.0364 3.423,-0.7139 6.796,1.5757 0.695,0.4721 1.62,1.0293 2.054,1.238 1.242,0.5957 -0.602,-0.9137 -3.544,-2.9033 -2.784,-1.8829 -2.947,-2.3317 -1.404,-3.8742 2.116,-2.1168 3.488,-1.823 5.884,1.2594 1.258,1.6187 1.678,1.934 3.027,2.2744 1.193,0.301 1.87,0.7319 2.832,1.8024 2.447,2.7249 6.381,4.4126 8.678,3.7237 2.109,-0.6315 8.544,-8.0343 8.544,-9.8276 0,-1.7038 -8.964,-7.2666 -15.844,-9.833 -1.453,-0.5429 -4.624,-1.3957 -7.044,-1.8973 -5.967,-1.2344 -7.338,-2.2449" />
  </svg>
);

// --- HELPER STYLES ---
const getTierTheme = (id: string) => {
  switch(id) {
    case 'VIP':
      return {
        cardBg: 'bg-black/40 backdrop-blur-xl border-amber-500/30',
        text: 'text-amber-100',
        accent: 'text-amber-400',
        gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        badge: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-amber-500/50',
        progress: 'bg-amber-500',
        icon: Crown,
        glow: 'shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)]'
      };
    case 'PLUS':
      return {
        cardBg: 'bg-black/40 backdrop-blur-xl border-purple-500/30',
        text: 'text-purple-100',
        accent: 'text-purple-400',
        gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
        badge: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/50',
        progress: 'bg-purple-500',
        icon: Star,
        glow: 'shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)]'
      };
    default:
      return {
        cardBg: 'bg-black/40 backdrop-blur-xl border-slate-500/30',
        text: 'text-slate-100',
        accent: 'text-slate-400',
        gradient: 'from-slate-500/20 via-gray-500/10 to-transparent',
        badge: 'bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-slate-500/50',
        progress: 'bg-slate-500',
        icon: Shield,
        glow: 'shadow-[0_0_50px_-12px_rgba(148,163,184,0.3)]'
      };
  }
};

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { members, transactions, membershipConfigs, refreshData } = useData();
  const { t } = useLanguage();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Real-time Clock for Active Session Calc
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Data on Mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Find Member Logic
  useEffect(() => {
    if (members.length > 0) {
      const found = members.find(m => 
        m.nickname.toLowerCase() === nickname.toLowerCase() || 
        m.id === nickname // Fallback to ID
      );
      setMember(found || null);
      setLoading(false);
    }
  }, [members, nickname]);

  // --- STATS CALCULATION (REAL-TIME) ---
  const stats = useMemo(() => {
    if (!member) return null;

    // 1. Find ACTIVE Transaction for this member
    const activeTx = transactions.find(tx => 
        tx.memberId === member.id && tx.status === 'ACTIVE'
    );

    let formattedElapsedTime = "00:00:00";
    
    if (activeTx) {
        const startTime = new Date(activeTx.startTime).getTime();
        const currentTime = now.getTime();
        const elapsedMs = Math.max(0, currentTime - startTime);
        
        // Format for display (Timer)
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        formattedElapsedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // 2. Calculate TOTAL Playtime (Historical + Current Active Booked Duration)
    // USER REQUEST FIX: Count the full booked duration, not just elapsed
    // This makes a member with 1hr history + 2hr active session show 3hr total immediately.
    const projectedHours = activeTx ? activeTx.durationHours : 0;
    const totalPlayTimeRealtime = (member.totalPlayTime + projectedHours).toFixed(1);

    // 3. Config for Progress
    const config = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
    
    // Calculate progress including current session
    // Note: hoursProgressToNextBonus is historical. We need to add active session to it too, modulo the threshold.
    const currentProgressTotal = member.hoursProgressToNextBonus + projectedHours;
    const effectiveProgress = currentProgressTotal % config.bonusThreshold;
    const progressPercent = Math.min(100, (effectiveProgress / config.bonusThreshold) * 100);

    return {
        totalPlayTime: totalPlayTimeRealtime,
        bonusBalance: member.freeHoursBalance,
        activeTx,
        formattedElapsedTime,
        config,
        progressPercent,
        joinDate: new Date(member.joinDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        hoursToNextBonus: Math.max(0, config.bonusThreshold - effectiveProgress).toFixed(1)
    };
  }, [member, transactions, now, membershipConfigs]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!member || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Member Tidak Ditemukan</h1>
        <p>Pastikan link atau nickname yang Anda masukkan benar.</p>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const Icon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden flex flex-col items-center justify-center pb-safe">
      
      {/* 
          BACKGROUND DRAGON (Fixed Center) 
          Positioned absolutely in the center of the viewport, behind content.
      */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
         <TribalPattern className="w-[80vmin] h-[80vmin] text-slate-700 animate-pulse-slow" />
      </div>

      {/* AMBIENT GLOW */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[50%] bg-${theme.accent.split('-')[1]}-900/20 blur-[100px] rounded-full pointer-events-none z-0`}></div>

      {/* MAIN CARD CONTAINER */}
      {/* 
          RESPONSIVE LOGIC: 
          portrait:max-w-sm (Vertical Shape)
          landscape:max-w-3xl (Horizontal Shape)
          mx-auto to center
      */}
      <div className={`relative z-10 w-full px-6 animate-slide-in portrait:max-w-sm landscape:max-w-3xl mx-auto`}>
        
        {/* Holographic Border Wrapper */}
        <div className={`
            rounded-[2.5rem] border p-1 shadow-2xl overflow-hidden relative transition-all duration-500
            ${theme.cardBg} ${theme.glow}
        `}>
           {/* Shimmer Effect Overlay */}
           <div className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} opacity-50`}></div>
           
           {/* 
              INNER CONTENT LAYOUT 
              portrait: flex-col (Stack Vertical)
              landscape: flex-row (Side by Side)
           */}
           <div className="relative bg-slate-950/50 rounded-[2.2rem] p-6 sm:p-8 flex portrait:flex-col landscape:flex-row items-center backdrop-blur-sm gap-6 landscape:gap-10 transition-all duration-500">
              
              {/* --- LEFT SECTION (Identity) --- */}
              {/* Landscape: Width 40%, Portrait: Width Full */}
              <div className="flex flex-col items-center text-center w-full landscape:w-[40%] portrait:border-b portrait:border-white/5 portrait:pb-6 landscape:border-r landscape:border-white/5 landscape:pr-6 shrink-0">
                  {/* Profile Image */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-b from-white/20 to-transparent shadow-2xl">
                        <img 
                            src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover bg-slate-900"
                        />
                    </div>
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${theme.badge}`}>
                        <Icon size={12} fill="currentColor" />
                        {member.membershipId}
                    </div>
                  </div>

                  {/* Identity Text */}
                  <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${theme.text}`}>
                    {member.name}
                  </h1>
                  <p className={`text-sm font-medium tracking-widest uppercase opacity-60 ${theme.accent}`}>
                    @{member.nickname}
                  </p>
              </div>

              {/* --- RIGHT SECTION (Stats & Progress) --- */}
              {/* Landscape: Width 60%, Portrait: Width Full */}
              <div className="flex flex-col justify-center w-full landscape:w-[60%]">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full mb-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 landscape:p-4 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors">
                        <Clock size={18} className={theme.accent} />
                        {/* Use parseFloat to remove unnecessary decimals (e.g. 3.0 -> 3) */}
                        <span className="text-xl landscape:text-2xl font-black text-white">{parseFloat(stats.totalPlayTime)}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-500">Total Jam</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 landscape:p-4 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-xl landscape:text-2xl font-black text-white">{stats.bonusBalance}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-500">Saldo Bonus</span>
                    </div>
                  </div>

                  {/* Active Session Indicator (Realtime) */}
                  {stats.activeTx && (
                      <div className="w-full mb-6 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                          <div className="relative border border-emerald-500/30 bg-emerald-950/30 rounded-2xl p-3 landscape:p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400 animate-spin-slow">
                                      <Gamepad2 size={18} />
                                  </div>
                                  <div className="text-left">
                                      <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Sedang Main</p>
                                      <p className="text-xs font-bold text-white max-w-[100px] truncate">{stats.activeTx.consoleName}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-lg landscape:text-xl font-mono font-black text-white">{stats.formattedElapsedTime}</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Loyalty Progress */}
                  <div className="w-full space-y-2 mb-6 landscape:mb-0">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                            <Zap size={12} className={theme.accent}/> Level Progress
                        </span>
                        <span className="text-[10px] font-bold text-white">{stats.progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                        <div 
                            className={`h-full rounded-full shadow-lg transition-all duration-1000 ease-out ${theme.progress}`}
                            style={{ width: `${stats.progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-center text-slate-500 mt-1">
                        Main <strong>{stats.hoursToNextBonus} jam</strong> lagi untuk bonus!
                    </p>
                  </div>

                  {/* Footer (Only visible in landscape inside Right Pane, in portrait it's at bottom) */}
                  <div className="hidden landscape:flex mt-auto pt-4 border-t border-white/5 w-full justify-between items-center text-[10px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={10}/> Join: {stats.joinDate}</span>
                    <span className="uppercase tracking-widest opacity-50">Ziezan Station</span>
                  </div>

              </div>

              {/* Footer (Portrait Only) */}
              <div className="landscape:hidden mt-auto pt-4 border-t border-white/5 w-full flex justify-between items-center text-[10px] text-slate-600 font-medium">
                 <span className="flex items-center gap-1"><Calendar size={10}/> Join: {stats.joinDate}</span>
                 <span className="uppercase tracking-widest opacity-50">Ziezan Station</span>
              </div>

           </div>
        </div>
      </div>

    </div>
  );
};

export default PublicMemberCard;
