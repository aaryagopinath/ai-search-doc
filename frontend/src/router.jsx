import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import GrammarFix from "./pages/GrammarFix";
import Navbar from "./components/Navbar";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/search" element={<Search />} />
        <Route path="/grammar-fix" element={<GrammarFix />} />
      </Routes>
    </BrowserRouter>
  );
}
