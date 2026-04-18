import Nav from "./components/Nav";
import Hero from "./components/Hero";
import WhatIs from "./components/WhatIs";
import HowItWorks from "./components/HowItWorks";
import Roadmap from "./components/Roadmap";
import Team from "./components/Team";
import Community from "./components/Community";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <HowItWorks />
        <Roadmap />
        <Team />
        <Community />
      </main>
      <Footer />
    </>
  );
}
