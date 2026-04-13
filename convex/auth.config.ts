// CONVEX_SITE_URL is auto-set by Convex in cloud; for local bundling use .env.local
const siteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

const authConfig = {
  providers: [
    {
      domain: siteUrl,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
