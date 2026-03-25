import { useState } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import DepartmentGrid from "@/components/DepartmentGrid";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";

const Index = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header onSearch={setSearchQuery} />
            <main className="flex-1">
                <HeroBanner />
                <DepartmentGrid onSelect={setSelectedCategory} selected={selectedCategory} />
                <ProductGrid categoryId={selectedCategory} searchQuery={searchQuery} />
            </main>
            <Footer />
        </div>
    );
};

export default Index;