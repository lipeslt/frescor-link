import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const statusConfig = {
  approved: {
    icon: CheckCircle,
    iconClass: "text-green-500",
    title: "Pagamento aprovado!",
    description: "Seu pedido foi confirmado e está sendo preparado.",
    primaryLabel: "Ver meu pedido",
  },
  pending: {
    icon: Clock,
    iconClass: "text-yellow-500",
    title: "Pagamento em análise",
    description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve.",
    primaryLabel: "Ver meu pedido",
  },
  failure: {
    icon: XCircle,
    iconClass: "text-red-500",
    title: "Pagamento recusado",
    description: "Não foi possível processar seu pagamento. Tente novamente.",
    primaryLabel: "Tentar novamente",
  },
} as const;

type StatusKey = keyof typeof statusConfig;

const PaymentReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const collectionStatus = params.get("collection_status");
  const externalReference = params.get("external_reference");

  useEffect(() => {
    if (!collectionStatus || !externalReference) {
      navigate("/");
    }
  }, [collectionStatus, externalReference, navigate]);

  if (!collectionStatus || !externalReference) return null;

  const key: StatusKey = (collectionStatus in statusConfig ? collectionStatus : "failure") as StatusKey;
  const config = statusConfig[key];
  const Icon = config.icon;

  const handlePrimary = () => {
    if (key === "failure") {
      navigate("/checkout");
    } else {
      navigate(`/pedido/${externalReference}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6 py-12">
          <Icon size={64} className={`mx-auto mb-6 ${config.iconClass}`} />
          <h1 className="text-2xl font-extrabold mb-3">{config.title}</h1>
          <p className="text-muted-foreground mb-2">{config.description}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Pedido: <span className="font-mono font-semibold">{externalReference}</span>
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handlePrimary}>{config.primaryLabel}</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para a loja
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentReturn;
