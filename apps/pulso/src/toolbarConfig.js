import { registerToolbarModules } from '@shared/navigation/toolbarRegistry';
import { matchPulsoSection } from './pulso/pulsoToolbarPaths';
import PulsoToolbarCenter from './pulso/PulsoToolbarCenter.jsx';
import PulsoToolbarRight from './pulso/PulsoToolbarRight.jsx';

registerToolbarModules([
  {
    id: 'pulso',
    match: (path) => matchPulsoSection(path) != null,
    center: PulsoToolbarCenter,
    centerDesktop: true,
    right: PulsoToolbarRight,
  },
]);
