export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export default {
  Platform,
  StyleSheet,
};
