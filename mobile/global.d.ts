declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';

declare module '*.module.css';

// allow importing JSON files
declare module '*.json' {
  const value: any;
  export default value;
}

// fallback for unknown native modules
declare module '*';
