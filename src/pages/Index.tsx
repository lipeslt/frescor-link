import { useState } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import DepartmentGrid from "@/components/DepartmentGrid";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";

const Index = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex min-h-screen flex-col">
            <Header onSearch={(query) => setSearchQuery(query)} />
            <HeroBanner />
            <main className="flex-1">
                <div className="container space-y-8 py-8">
                    <DepartmentGrid onSelectCategory={(category) => setSelectedCategory(category)} />
                    <ProductGrid searchQuery={searchQuery} selectedCategory={selectedCategory} />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Index;