import { MapPin, Phone, Clock } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-muted/50">
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-extrabold text-primary-foreground">P</span>
            </div>
            <span className="text-lg font-extrabold">
              <span className="text-primary">Ponto</span>
              <span className="text-secondary"> Fresco</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Seu mercado de confiança. Frescor e qualidade todos os dias.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Contato</h4>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-primary shrink-0" />
            <span>Rua das Frutas, 123 — Centro</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-primary shrink-0" />
            <span>(11) 99999-0000</span>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Horário</h4>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-primary shrink-0" />
            <span>Seg a Sáb: 7h às 21h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-primary shrink-0" />
            <span>Dom e Feriados: 8h às 14h</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 Mercado Ponto Fresco. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
