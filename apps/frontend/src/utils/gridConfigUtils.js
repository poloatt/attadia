

/**
 * Factory para crear configuraciones de grid estándar
 */
export const createGridConfig = (options = {}) => {
  const {
    groupBy,
    getTitle,
    getSubtitle,
    getIcon,
    getColor,
    onItemClick,
    getDetails = () => [],
    getActions = () => ({ actions: [] }),
    getHoverInfo
  } = options;

  return {
    groupBy,
    getTitle,
    getSubtitle,
    getIcon,
    getColor,
    onItemClick,
    getDetails,
    getActions,
    getHoverInfo
  };
};

/**
 * Configuración estándar para secciones en construcción
 */
export const createUnderConstructionConfig = () => ({
  getDetails: (item) => {
    if (item.isUnderConstruction) {
      return [
        {
          icon: '🔨',
          text: 'En construcción'
        }
      ];
    }
    return [];
  },
  getActions: (item) => ({
    actions: item.isUnderConstruction ? [
      {
        icon: 'construction',
        tooltip: 'En construcción',
        onClick: () => {},
        disabled: true
      }
    ] : []
  })
});

/**
 * Configuración estándar para secciones de navegación
 */
export const createNavigationConfig = (navigate, groupKey, groupTitle, groupIcon) => ({
  groupBy: (item) => ({
    key: groupKey,
    title: groupTitle,
    icon: groupIcon
  }),
  getTitle: (item) => item.title,
  getSubtitle: (item) => item.description,
  getIcon: (item) => item.icon,
  getColor: (item) => item.color,
  onItemClick: (item) => navigate(item.path),
  ...createUnderConstructionConfig()
});

/**
 * Configuración estándar para entidades con acciones CRUD
 */
export const createEntityConfig = (options = {}) => {
  const {
    getTitle,
    getSubtitle,
    getIcon,
    onEdit,
    onDelete,
    itemName
  } = options;

  return {
    getTitle,
    getSubtitle,
    getIcon,
    getDetails: () => [],
    getActions: (item) => ({
      onEdit: () => onEdit(item),
      onDelete: () => onDelete(item.id || item._id),
      itemName: typeof itemName === 'function' ? itemName(item) : itemName
    })
  };
}; 