import RoleMarketingPage from './RoleMarketingPage';
import { rolePages } from './publicSiteContent';

export default function MembersPage() {
  return <RoleMarketingPage page={rolePages['members']} />;
}
