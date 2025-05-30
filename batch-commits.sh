#!/usr/bin/env bash
set -euo pipefail

declare -A commits=(
  ['client/src/assets/images/Grass2.jpg']='chore(images): remove Grass2.jpg'
  ['client/src/assets/images/golf-unscreen.gif']='chore(images): remove golf-unscreen.gif'
  ['client/src/assets/images/golf.gif']='chore(images): remove golf.gif'
  ['client/src/assets/images/lawn-mower.gif']='chore(images): remove lawn-mower.gif'
  ['client/src/components/CourseForm/CourseForm.css']='style(CourseForm): apply baby-blue button, white/glass card & subtle shadow'
  ['client/src/components/CourseForm/CourseForm.tsx']='refactor(CourseForm): wrap logic in useCallback & memo, trim imports'
  ['client/src/components/CourseList/CourseList.css']='style(CourseList): unify card sizing, spacing & hover effects'
  ['client/src/components/CourseList/CourseList.tsx']='refactor(CourseList): memoize list rendering and remove dead code'
  ['client/src/components/Footer/Footer.css']='style(Footer): adjust padding, glass background & subtle shadows'
  ['client/src/components/Footer/Footer.tsx']='refactor(Footer): remove dead code & add //Note; comments'
  ['client/src/components/Handicap/HandicapDashboard.tsx']='chore(handicap): remove deprecated HandicapDashboard.tsx'
  ['client/src/components/Handicap/RoundForm.tsx']='chore(handicap): remove deprecated RoundForm.tsx'
  ['client/src/components/Header/Header.css']='style(Header): ensure flush styling, consistent spacing & glass background'
  ['client/src/components/Header/Header.tsx']='refactor(Header): wrap toggle logic in useCallback & trim imports'
  ['client/src/components/MapView/GoogleMapView.css']='style(GoogleMapView): tweak responsive container & filter icon alignment'
  ['client/src/components/MapView/GoogleMapView.tsx']='refactor(GoogleMapView): memoize initMap and remove redundant script loads'
  ['client/src/components/ScoreCard/ScoreCard.css']='style(ScoreCard): enforce uniform column widths, button placement & spacing'
  ['client/src/components/ScoreCard/ScoreCard.tsx']='refactor(ScoreCard): centralize state logic and wrap handlers in useCallback'
  ['client/src/components/ToggleSwitch/ToggleSwitch.css']='style(ToggleSwitch): unify switch styling, add subtle shadow & consistent sizing'
  ['client/src/components/ToggleSwitch/ToggleSwitch.tsx']='refactor(ToggleSwitch): wrap toggle handler in useCallback & trim imports'
  ['client/src/components/TripList/TripList.css']='style(TripList): apply baby-blue accents, white/glass cards & grid alignment'
  ['client/src/components/TripList/TripList.tsx']='refactor(TripList): memoize list rendering and remove dead code'
  ['client/src/pages/Auth/AuthContext.tsx']='fix(AuthContext): correct Request typing, remove unused imports & add //Note; comments'
  ['client/src/pages/Auth/Login.css']='style(Login): unify input styling & adjacent button placement'
  ['client/src/pages/Auth/Login.tsx']='refactor(Login): wrap submit handler in useCallback & trim imports'
  ['client/src/pages/Auth/Signup.css']='style(Signup): enforce consistent placeholders, input spacing & button hover text'
  ['client/src/pages/Auth/Signup.tsx']='refactor(Signup): wrap sign-up logic in useCallback & clean dead code'
  ['client/src/pages/Courses/CourseFinder.css']='style(CourseFinder): adjust grid layout, breathing room & input/button alignment'
  ['client/src/pages/Courses/CourseFinder.tsx']='refactor(CourseFinder): memoize API fetch logic and remove unused state'
  ['client/src/pages/DashBoard/DashBoard.tsx']='feat(DashBoard): consolidate summary cards & wrap data fetch in useCallback'
  ['client/src/pages/Handicap/HandicapTracker.css']='style(HandicapTracker): update CSS for two-card layout & toggle equal-height'
  ['client/src/pages/Handicap/HandicapTracker.tsx']='refactor(HandicapTracker): merge dashboard & form, wrap calc in useCallback'
  ['client/src/pages/Home/Home.css']='style(Home): adjust hero grid, background fill & responsive behavior'
  ['client/src/pages/Home/Home.tsx']='refactor(Home): remove hardcoded defaults & use geolocation hook'
  ['client/src/pages/Routes/MapRouting.tsx']='feat(MapRouting): streamline route setup and remaster format'
  ['client/src/pages/Trips/PlanTrip.css']='style(PlanTrip): adjust form card spacing, button adjacency & glass background'
  ['client/src/pages/Trips/PlanTrip.tsx']='refactor(PlanTrip): memoize handlers & remove dead code'
  ['client/src/pages/Trips/SavedTrips.css']='style(SavedTrips): unify list card styling, spacing & delete-all button override'
  ['client/src/pages/Trips/SavedTrips.tsx']='refactor(SavedTrips): wrap delete logic in useCallback & add //Note; comments'
  ['client/src/pages/Trips/TripDetails.css']='style(TripDetails): tweak card layout to content sizing for mobile & desktop'
  ['client/src/pages/Trips/TripDetails.tsx']='refactor(TripDetails): restore stacked layout toggle & wrap state in useCallback'
  ['client/src/utils/handicap.ts']='chore(utils): delete unused handicap.ts'
  ['client/src/utils/mutations.ts']='feat(utils): update UPDATE_HANDICAP mutation to include course rating'
  ['client/src/utils/roundStorage.ts']='chore(utils): delete unused roundStorage.ts'
  ['server/src/models/Profile.ts']='style(model): add handicap field to Profile schema'
  ['server/src/models/Trip.ts']='refactor(model): update Trip model imports & structure'
  ['server/src/schemas/resolvers.ts']='refactor(resolvers): implement updateHandicap mutation resolver with //Note; comments'
  ['server/src/schemas/typeDefs.ts']='refactor(typeDefs): extend Profile type & schema for handicap'
  ['server/src/server.ts']='chore(server): remove unused Request import & annotate setup'
  ['server/src/utils/auth.ts']='style(auth): clean JWT logic, fix expiry handling & add //Note; comments'
)

for file in "${!commits[@]}"; do
  if [[ -f "$file" ]]; then
    git add "$file"
    git commit -m "${commits[$file]}"
  else
    echo "⚠️  Skipped: $file"
  fi
done

git push origin BryGuy
