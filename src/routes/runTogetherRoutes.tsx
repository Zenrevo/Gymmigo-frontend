import { Route } from 'react-router-dom';
import RunTogetherPage from '../pages/RunTogether/RunTogetherPage';
import RoomCreatePage from '../pages/RunTogether/RoomCreatePage';
import RoomPage from '../pages/RunTogether/RoomPage';
import RoomMembersPage from '../pages/RunTogether/RoomMembersPage';
import FindPeoplePage from '../pages/People/FindPeoplePage';
import FollowListPage from '../pages/People/FollowListPage';
import UserProfilePage from '../pages/People/UserProfilePage';

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
