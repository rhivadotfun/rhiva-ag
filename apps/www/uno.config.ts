import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  theme: {
    colors: {
      primary: {
        DEFAULT: "#00D897",
      },
      light: {
        DEFAULT: "#F3F3F3",
        secondary: {
          DEFAULT: "#A2A2A2",
        },
      },
      dark: {
        DEFAULT: "#000B1A",
        secondary: {
          DEFAULT: "#010E1F",
        },
      },
      gray: {
        DEFAULT: "#737373",
      },
    },
  },
  presets: [presetWind3()],
});
