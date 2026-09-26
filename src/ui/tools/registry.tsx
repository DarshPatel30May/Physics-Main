import type { ToolId } from '../nav';
import { ProjectileTool } from './ProjectileTool';
import { ForcesTool } from './ForcesTool';
import { BeamTool } from './BeamTool';
import { DirectionTool } from './DirectionTool';
import { GammaGraph, BlackbodyGraph, GravityGraph, OrbitGraph, DecayGraph, FieldGraph, DeflectionGraph, CircularGraph } from './GraphTools';
import { PhotoelectricTool, SpectrumTool, HydrogenLevels, FringeTool } from './LightTools';
import { BindingTool, ReactionTool, DecayEquationTool } from './NuclearTools';
import { StandardModelTool } from './StandardModelTool';

export function Tool({ id, topic }: { id: ToolId; topic?: string }) {
  switch (id) {
    case 'projectileTool': return <ProjectileTool />;
    case 'forcesTool': return <ForcesTool />;
    case 'beamTool': return <BeamTool />;
    case 'directionTool': return <DirectionTool initial={topic === 'motor' ? 'motor' : topic === 'efields' ? 'electric' : 'charge'} />;
    case 'lenzTool': return <DirectionTool initial="lenz" />;
    case 'nuclearTool': return <BindingTool />;
    case 'reactionTool': return <ReactionTool />;
    case 'decayEquationTool': return <DecayEquationTool />;
    case 'decayGraph': return <DecayGraph />;
    case 'photoelectricTool': return <PhotoelectricTool />;
    case 'standardModelTool': return <StandardModelTool />;
    case 'blackbodyGraph': return <BlackbodyGraph />;
    case 'gammaGraph': return <GammaGraph />;
    case 'gravityGraph': return <GravityGraph />;
    case 'orbitGraph': return <OrbitGraph />;
    case 'spectrumTool': return <SpectrumTool />;
    case 'hydrogenLevels': return <HydrogenLevels />;
    case 'fieldGraph': return <FieldGraph />;
    case 'deflectionGraph': return <DeflectionGraph />;
    case 'fringeTool': return <FringeTool />;
    case 'circularGraph': return <CircularGraph />;
  }
}
