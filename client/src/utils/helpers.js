// src/utils/helpers.js

/**
 * Get initials from a full name
 * @param {string} name
 * @returns {string} Initials (max 2 chars)
 */
export function getInitials(name) {
  if (!name) return '';
  const parts = name.split(' ').filter(part => part.length > 0);
  return parts.map(part => part[0].toUpperCase()).join('').substring(0, 2);
}

/**
 * Generate a consistent avatar color based on the name
 * @param {string} name
 * @returns {string} Hex color
 */
export function getAvatarColor(name) {
  if (!name) return '#6c757d'; // default gray
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
    '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
    '#9c755f', '#bab0ac'
  ];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Cleanup event listeners and tooltips used by the calendar
 * @param {'all' | 'modal' | 'tooltip'} type
 * @param {object} calendarResourcesRef React ref object containing resources
 */
export function cleanupResources(type, calendarResourcesRef) {
  if (!calendarResourcesRef?.current) return;

  // Remove modal event listeners
  if (type === 'all' || type === 'modal') {
    calendarResourcesRef.current.modalListeners?.forEach(({ element, event, handler }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler);
      }
    });
    calendarResourcesRef.current.modalListeners = [];
  }

  // Destroy tooltips
  if (type === 'all' || type === 'tooltip') {
    calendarResourcesRef.current.tooltips?.forEach(tooltip => {
      if (tooltip && typeof tooltip.dispose === 'function') {
        tooltip.dispose();
      }
    });
    calendarResourcesRef.current.tooltips = [];
  }
}
