// Global/ambient declarations to reduce TypeScript noise during migration
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';
declare module '*.json' {
  const value: any;
  export default value;
}

// fallback for unknown modules
declare module '*';
