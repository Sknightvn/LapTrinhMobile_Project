import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      // expose Clerk publishable key to the Expo app runtime
      CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      // optional: expose Clerk frontend API if you have it
      CLERK_FRONTEND_API: process.env.EXPO_PUBLIC_CLERK_FRONTEND_API,
    },
  };
};
