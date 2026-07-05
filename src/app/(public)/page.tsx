import { Hero } from '@/components/home/Hero';
import { StatStrip } from '@/components/home/StatStrip';
import { TrustBar } from '@/components/home/TrustBar';
import { HowItWorks } from '@/components/home/HowItWorks';
import { RoleShowcase } from '@/components/home/RoleShowcase';
import { IssueFeed } from '@/components/home/IssueFeed';
import { SLABlock } from '@/components/home/SLABlock';
import { CTASection } from '@/components/home/CTASection';
import { SingleScrollReveal } from '@/components/home/SingleScrollReveal';
import { CustomCursor } from '@/components/ui/CustomCursor';

const SCENE_ROAD = {
  before: '/road_broken.png',
  after:  '/road_fixed.png',
  tag:    'Road Infrastructure',
  title:  'Pothole → Repaved',
  type:   'wipe' as const,
};

const SCENE_LIGHT = {
  before: '/light_off.png',
  after:  '/light_on.png',
  tag:    'Street Lighting',
  title:  'Dark Street → Illuminated',
  type:   'fade' as const,
};

const SCENE_SANITATION = {
  before: '/sanitation_dirty.png',
  after:  '/sanitation_clean.png',
  tag:    'Sanitation',
  title:  'Waste Hazard → Cleared',
  type:   'wipe' as const,
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-body">
      <CustomCursor />
      <Hero />
      <SingleScrollReveal scene={SCENE_ROAD} />
      <StatStrip />
      <TrustBar />
      <HowItWorks />
      <SingleScrollReveal scene={SCENE_SANITATION} />
      <RoleShowcase />
      <SingleScrollReveal scene={SCENE_LIGHT} />
      <IssueFeed />
      <SLABlock />
      <CTASection />
    </div>
  );
}
