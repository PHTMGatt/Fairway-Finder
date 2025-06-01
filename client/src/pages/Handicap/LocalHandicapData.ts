// client/src/pages/Handicap/LocalHandicapData.ts

import { CourseDetails } from './HandicapAPI';

export const localCourses: CourseDetails[] = [
  {
    id: 5678,
    club_name: 'Chemung Hills Country Club',
    course_name: 'Chemung Hills Country Club',
    location: {
      address: '646 Underwood Rd, Erin, NY 14838, USA',
      city: 'Erin',
      state: 'NY',
      country: 'United States',
      latitude: 42.4673,
      longitude: -76.8661,
    },
    tees: {
      male: [
        { tee_name: 'Blue', course_rating: 72.2, slope_rating: 132 },
        { tee_name: 'White', course_rating: 70.1, slope_rating: 127 },
        { tee_name: 'Black', course_rating: 66.3, slope_rating: 120 },
        { tee_name: 'Red', course_rating: 63.7, slope_rating: 114 },
      ],
      female: [
        { tee_name: 'Blue', course_rating: 77.6, slope_rating: 145 },
        { tee_name: 'White', course_rating: 75.7, slope_rating: 142 },
        { tee_name: 'Black', course_rating: 72.0, slope_rating: 124 },
        { tee_name: 'Red', course_rating: 68.7, slope_rating: 118 },
      ],
    },
  },
];
