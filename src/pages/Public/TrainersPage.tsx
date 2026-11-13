import RoleMarketingPage from './RoleMarketingPage';
import { rolePages } from './publicSiteContent';

export default function TrainersPage() {
  return <RoleMarketingPage page={rolePages['trainers']} />;
}
