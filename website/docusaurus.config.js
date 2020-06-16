module.exports = {
  title: "Authgear SDK JS",
  tagline: "Documentation of Authgear SDK JS",
  url: "https://authgear.github.io/authgear-sdk-js",
  baseUrl: "/authgear-sdk-js/",
  favicon: "img/favicon.ico",
  organizationName: "authgear",
  projectName: "authgear-sdk-js",
  themeConfig: {
    navbar: {
      title: "Authgear SDK JS",
      logo: {
        alt: "Authgear SDK JS",
        src: "img/logo.png",
      },
      links: [
        {
          to: "docs/",
          activeBasePath: "docs",
          label: "Docs",
          position: "left",
        },
        {
          href: "https://github.com/authgear/authgear-sdk-js",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "API References",
              to: "docs/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Oursky, Ltd.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: "index",
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/authgear/authgear-sdk-js/edit/master/website/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
