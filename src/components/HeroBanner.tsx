import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-fresh.jpg";

const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden bg-primary">
      <img
        src={heroImg}
        alt="Frutas e verduras frescas"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      <div className="container relative z-10 flex min-h-[340px] flex-col items-start justify-center py-12 md:min-h-[420px] md:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg text-3xl font-extrabold leading-tight text-primary-foreground md:text-5xl"
        >
          Frescor e qualidade{" "}
          <span className="text-secondary">todo dia</span> na sua mesa
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-md text-base text-primary-foreground/80 md:text-lg"
        >
          Produtos selecionados, preços justos e entrega rápida. Seu mercado de confiança agora online.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6"
        >
          <Button size="lg" className="bg-secondary text-secondary-foreground font-bold hover:bg-offer-orange-dark px-8">
            Ver Ofertas
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
