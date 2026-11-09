import { useEffect, useMemo } from "react";
import { useAtomValue } from "jotai";
import type { UmKeystore } from "@/types/wallet";
import type { WagmiPreparedTransaction } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Loader2, Check } from "lucide-react";
import { type Address, type Hex, hexToBigInt } from "viem";
import {
  useConfig,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { activeWalletAtom } from "@/atoms/activeWalletAtom";
import { decryptWalletToAccount } from "@/lib/um-wallet";
import { truncateAddress } from "@/lib/utils";
import { TransactionStatus } from "@/components/transaction-status";

export function validateTransaction(value: string): WagmiPreparedTransaction | string {
  if (!value) {
    return "Vui lòng nhập JSON giao dịch";
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed.to || typeof parsed.to !== "string") {
      return "Thiếu địa chỉ 'to'";
    }
    if (typeof parsed.chainId !== "number") {
      return "Thiếu hoặc sai 'chainId' (phải là số)";
    }
    return parsed as WagmiPreparedTransaction;
  } catch {
    return "Định dạng JSON không hợp lệ";
  }
}

export default function SendRawTransactionForm() {
  const config = useConfig();
  const activeWallet = useAtomValue<UmKeystore | null>(activeWalletAtom);

  const {
    data: rawTransactionHash,
    isPending: isPendingRawTransaction,
    sendTransaction,
    reset: resetSendTransaction,
  } = useSendTransaction();

  const form = useForm({
    defaultValues: {
      rawTransactionData: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (!activeWallet) {
        console.error("No active wallet");
        return;
      }

      const parsed = validateTransaction(value.rawTransactionData);
      if (typeof parsed === "string") {
        console.error(parsed);
        return;
      }

      const account = decryptWalletToAccount(activeWallet, value.password);

      sendTransaction({
        account,
        to: parsed.to as Address,
        value: parsed.value ? hexToBigInt(parsed.value as Hex) : undefined,
        data: parsed.data as Hex | undefined,
        chainId: parsed.chainId,
        gas: parsed.gas ? hexToBigInt(parsed.gas as Hex) : undefined,
        nonce: parsed.nonce,
        maxFeePerGas: parsed.maxFeePerGas ? hexToBigInt(parsed.maxFeePerGas as Hex) : undefined,
        maxPriorityFeePerGas: parsed.maxPriorityFeePerGas ? hexToBigInt(parsed.maxPriorityFeePerGas as Hex) : undefined,
        type: "eip1559",
      });
    },
  });

  const parsedTransaction = useMemo(() => {
    const value = form.state.values.rawTransactionData;
    if (!value) return null;
    const result = validateTransaction(value);
    if (typeof result === "string") return null;
    return result;
  }, [form.state.values.rawTransactionData]);

  const getChainName = (chainId: number) => {
    const chain = config.chains.find((c) => c.id === chainId);
    return chain?.name ?? `Chain ${chainId}`;
  };

  const txChainId = parsedTransaction?.chainId ?? 1;

  const {
    isLoading: isConfirmingRawTransaction,
    isSuccess: isConfirmedRawTransaction,
  } = useWaitForTransactionReceipt({
    hash: rawTransactionHash,
    chainId: txChainId,
  });

  const transactionChainBlockExplorer = config.chains.find(
    (chain) => chain.id === txChainId
  )?.blockExplorers?.default.url;

  function handleReset() {
    resetSendTransaction();
    form.reset();
  }

  useEffect(() => {
    resetSendTransaction();
    form.reset();
  }, [form, resetSendTransaction]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <form.Field
            name="rawTransactionData"
            validators={{
              onChange: ({ value }) => {
                const result = validateTransaction(value);
                if (typeof result === "string") {
                  return result;
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center justify-between">
                  <p className="text-muted-foreground">JSON giao dịch</p>
                </div>
                <div className="flex flex-row gap-2">
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="rounded-none"
                    placeholder='{"to": "0x...", "chainId": 1, "type": "eip1559", "gas": "0x...", "maxFeePerGas": "0x...", "maxPriorityFeePerGas": "0x..."}'
                    required
                  />
                </div>
                <RawTransactionDataFieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>
        {parsedTransaction && (
          <div className="border border-primary p-4">
            <div className="flex flex-col gap-3">
              <div className="border-b border-primary pb-2">
                <p className="font-medium">Chi tiết giao dịch</p>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex flex-row gap-2">
                  <span className="text-muted-foreground">Chain:</span>
                  <span>{getChainName(parsedTransaction.chainId)}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <span className="text-muted-foreground">Đến:</span>
                  <span className="font-mono">{truncateAddress(parsedTransaction.to as Address)}</span>
                </div>
                {parsedTransaction.from && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Từ:</span>
                    <span className="font-mono">{truncateAddress(parsedTransaction.from as Address)}</span>
                  </div>
                )}
                {parsedTransaction.value && parsedTransaction.value !== "0x0" && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Giá trị:</span>
                    <span className="font-mono">{parsedTransaction.value}</span>
                  </div>
                )}
                {parsedTransaction.type && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Loại:</span>
                    <span className="font-mono">{parsedTransaction.type}</span>
                  </div>
                )}
                {parsedTransaction.gas && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Gas:</span>
                    <span className="font-mono">{parsedTransaction.gas}</span>
                  </div>
                )}
                {parsedTransaction.nonce !== undefined && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Nonce:</span>
                    <span className="font-mono">{parsedTransaction.nonce}</span>
                  </div>
                )}
                {parsedTransaction.maxFeePerGas && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Phí tối đa mỗi gas:</span>
                    <span className="font-mono">{parsedTransaction.maxFeePerGas}</span>
                  </div>
                )}
                {parsedTransaction.maxPriorityFeePerGas && (
                  <div className="flex flex-row gap-2">
                    <span className="text-muted-foreground">Phí ưu tiên tối đa:</span>
                    <span className="font-mono">{parsedTransaction.maxPriorityFeePerGas}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="border-t-2 border-primary pt-4 border-dotted">
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value ? "Vui lòng nhập mật khẩu ví" : undefined,
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="rounded-none border-primary"
                  type="password"
                  placeholder="Mật khẩu"
                  required
                />
                <PasswordFieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>
        <div className="flex flex-col gap-2">
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              isPendingRawTransaction,
              isConfirmingRawTransaction,
            ]}
          >
            {([
              canSubmit,
              isPendingRawTransaction,
              isConfirmingRawTransaction,
            ]) => (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className="hover:cursor-pointer rounded-none col-span-1"
                  variant="outline"
                  type="reset"
                  disabled={
                    !canSubmit ||
                    isPendingRawTransaction ||
                    isConfirmingRawTransaction
                  }
                  onClick={handleReset}
                >
                  Đặt lại
                </Button>
                <Button
                  className="hover:cursor-pointer rounded-none col-span-2"
                  type="submit"
                  disabled={
                    !canSubmit ||
                    isPendingRawTransaction ||
                    isConfirmingRawTransaction
                  }
                >
                  {isPendingRawTransaction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isConfirmingRawTransaction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isConfirmedRawTransaction ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <>Gửi</>
                  )}
                </Button>
              </div>
            )}
          </form.Subscribe>
          <div className="border-t-2 border-primary pt-4 mt-4">
            <TransactionStatus
              isPending={isPendingRawTransaction}
              isConfirming={isConfirmingRawTransaction}
              isConfirmed={isConfirmedRawTransaction}
              txHash={rawTransactionHash}
              blockExplorerUrl={transactionChainBlockExplorer}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function RawTransactionDataFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập JSON giao dịch</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Vui lòng nhập JSON giao dịch"
              ? ""
              : "text-red-400"
          }`}
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : (
        <em className="text-green-500">hợp lệ!</em>
      )}
      {field.state.meta.isValidating ? "Đang kiểm tra..." : null}
    </>
  );
}

function PasswordFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập mật khẩu ví</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Vui lòng nhập mật khẩu ví"
              ? ""
              : "text-red-400"
          }`}
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : (
        <em className="text-green-500">hợp lệ!</em>
      )}
      {field.state.meta.isValidating ? "Đang kiểm tra..." : null}
    </>
  );
}
