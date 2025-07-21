export { default as Header } from './Header';
// Los siguientes componentes ahora están en SystemButtons.jsx
export { SystemButtons } from '../../components/common/SystemButtons';
// Si necesitas acceso directo a los subcomponentes:
export { 
  SystemButtons as HeaderSystemButtons,
  // Subcomponentes individuales:
  // MenuButton, AddButton, RefreshButton, VisibilityButton, UndoMenu
} from '../../components/common/SystemButtons'; 