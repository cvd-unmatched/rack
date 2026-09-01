import { Network, Cpu, Zap, Cable, Square, Boxes, type LucideIcon } from 'lucide-react';
import type { Category } from '../types';

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Networking: Network,
  'Compute & Storage': Cpu,
  'Power & Cooling': Zap,
  'Patch & Cable': Cable,
  Structural: Square,
  Custom: Boxes,
};
