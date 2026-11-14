import { Route } from 'react-router-dom';
import { RunTogetherPage, RoomCreatePage, RoomPage, RoomMembersPage, FindPeoplePage, FollowListPage, UserProfilePage } from './runTogetherPages';

/** Run together (club, rooms) and People (children of the /app layout route). */
export const runTogetherRoutes = (
  <>
    <Route path="run-together" element={<RunTogetherPage />} />
    <Route path="run-together/new" element={<RoomCreatePage />} />
    <Route path="run-room/:codeOrId" element={<RoomPage />} />
    <Route path="run-room/:roomId/members" element={<RoomMembersPage />} />
    <Route path="people" element={<FindPeoplePage />} />
    <Route path="people/:tab" element={<FollowListPage />} />
    <Route path="u/:userId" element={<UserProfilePage />} />
  </>
);
