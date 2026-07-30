# App.tsx — Two changes needed

## Change 1: Import at top
REMOVE:  import SorenChat from "./components/SorenChat";
ADD:     import TileAI from "./components/TileAI";

## Change 2: In <main> JSX block
REMOVE:
  {/* Section 2: Soren AI Concierge - DORMANT / DISABLED FROM UI */}
  {/* <SorenChat /> */}
ADD:
  {/* Section 2: TileAI — Live Catalog AI */}
  <TileAI />
