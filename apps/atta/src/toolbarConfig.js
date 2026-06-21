import { registerToolbarModules } from '@shared/navigation/toolbarRegistry';
import { matchAttaSection } from './atta/attaToolbarPaths';
import AttaToolbarLeft from './atta/AttaToolbarLeft.jsx';
import AttaToolbarCenter from './atta/AttaToolbarCenter.jsx';
import AttaToolbarRight from './atta/AttaToolbarRight.jsx';

registerToolbarModules([
  {
    id: 'atta',
    match: (path) => matchAttaSection(path) != null,
    left: AttaToolbarLeft,
    center: AttaToolbarCenter,
    centerDesktop: true,
    right: AttaToolbarRight,
  },
]);
