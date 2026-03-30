import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { Loader2 } from "lucide-react";

interface PaymentBrickProps {
  preferenceId: string;
  amount: number;
  publicKey: string;
  onSuccess: (pedidoId: string) => void;
  onPending: (pedidoId: string) => void;
  onError: (error: unknown) => void;
}

export function PaymentBrick({
  preferenceId,
  amount,
  publicKey,
  onSuccess,
  onPending,
  onError,
}: PaymentBrickProps) {
  const [brickReady, setBrickReady] = useState(false);
  const brickControllerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountBrick() {
      try {
        await loadMercadoPago();

        const mp = new (window as any).MercadoPago(publicKey);
        const bricksBuilder = mp.bricks();

        const controller = await bricksBuilder.create(
          "payment",
          "payment-brick-container",
          {
            initialization: {
              amount,
              preferenceId,
            },
            customization: {
              paymentMethods: {
                ticket: "all",
                bankTransfer: "all",
                creditCard: "all",
                debitCard: "all",
                mercadoPago: "all",
              },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) setBrickReady(true);
              },
              onSubmit: ({ formData }: any) => {
                const status: string = formData?.status ?? "";
                if (status === "approved") {
                  onSuccess(formData?.pedidoId ?? "");
                } else if (status === "pending") {
                  onPending(formData?.pedidoId ?? "");
                }
              },
              onError: (error: unknown) => {
                onError(error);
              },
            },
          }
        );

        if (!cancelled) {
          brickControllerRef.current = controller;
        } else {
          controller?.unmount?.();
        }
      } catch (err) {
        if (!cancelled) onError(err);
      }
    }

    mountBrick();

    return () => {
      cancelled = true;
      brickControllerRef.current?.unmount?.();
      brickControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferenceId, publicKey, amount]);

  return (
    <div className="relative w-full">
      {!brickReady && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div
        id="payment-brick-container"
        style={{ minHeight: "400px" }}
        className={brickReady ? "" : "hidden"}
      />
    </div>
  );
}
