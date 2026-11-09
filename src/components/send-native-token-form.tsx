import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import type { UmKeystore } from "@/types/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useForm, useStore } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Loader2, Check, Search } from "lucide-react";
import { parseEther, formatEther, type Address } from "viem";

import {
  useConfig,
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useGasPrice,
  useEnsAddress,
} from "wagmi";
import { normalize } from "viem/ens";
import { useMediaQuery } from "@/hooks/use-media-query";
import { activeWalletAtom } from "@/atoms/activeWalletAtom";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import { decryptWalletToAccount } from "@/lib/um-wallet";
import { recordActivity } from "@/lib/activity";
import type { ActivityRecord } from "@/types/activity";
import { TransactionStatus } from "@/components/transaction-status";
import AddressBookPickerButton from "@/components/address-book-picker-button";
import QrScannerButton from "@/components/qr-scanner-button";
import { InformationDialog } from "@/components/information-dialog";


export default function SendNativeTokenForm() {
  // get Wagmi config
  const config = useConfig();

  // check if desktop
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // current active wallet
  const activeWallet = useAtomValue<UmKeystore | null>(activeWalletAtom);

  // capture submit-time data to record on confirmation
  const pendingActivityRef = useRef<Omit<ActivityRecord, "id" | "timestamp" | "txHash"> | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // get gas price
  const {
    data: gasPriceData,
    isLoading: isLoadingGasPrice,
    refetch: refetchGasPrice,
  } = useGasPrice({
    query: {
      enabled: !!activeWallet?.address,
    },
    chainId: 1,
  });

  // send form
  const form = useForm({
    defaultValues: {
      receivingAddress: "",
      amount: "",
      type: "native",
      gasPreset: formatEther(gasPriceData || BigInt(0), "gwei") || "0",
      chain: "",
      password: "",
      message: "",
    },
    onSubmit: async ({ value }) => {
      // console.log(value);

      if (value.type === "native") {
        // check if there is an active wallet
        if (!activeWallet) {
          setFormError("Chưa chọn ví nào.");
          return;
        }

        const account = decryptWalletToAccount(activeWallet, value.password);

        // resolve ENS to address if needed
        let recipientAddress: Address;
        if (value.receivingAddress.endsWith(".eth")) {
          if (!ensAddress) {
            setFormError("Chưa phân giải địa chỉ ENS. Hãy nhấn biểu tượng tìm kiếm để phân giải trước.");
            return;
          }
          recipientAddress = ensAddress as Address;
        } else {
          recipientAddress = value.receivingAddress as Address;
        }

        // capture activity data before sending
        pendingActivityRef.current = {
          type: "native",
          from: activeWallet.address,
          to: recipientAddress,
          chainId: 1,
          nativeValue: parseEther(value.amount).toString(),
          gasPrice: value.gasPreset ? parseEther(value.gasPreset, "gwei").toString() : undefined,
          ensName: value.receivingAddress.endsWith(".eth") ? value.receivingAddress : undefined,
        };

        // execute the send native transaction
        sendNativeTx.mutate({
          account: account,
          to: recipientAddress,
          value: parseEther(value.amount),
          chainId: 1,
          gasPrice: value.gasPreset
            ? parseEther(value.gasPreset, "gwei")
            : undefined,
        });
      }
    },
  });

  // get receiving address reactively from form store
  const receivingAddress = useStore(
    form.store,
    (state) => state.values.receivingAddress || ""
  );

  // get ENS address
  const {
    data: ensAddress,
    isLoading: isLoadingEnsAddress,
    isError: isErrorEnsAddress,
    refetch: refetchEnsAddress,
  } = useEnsAddress({
    chainId: 1,
    name: receivingAddress && receivingAddress.endsWith(".eth") && (receivingAddress.split(".")[0] !== "" || receivingAddress.split(".")[1] !== "")
      ? normalize(receivingAddress)
      : undefined,
    query: {
      enabled: false,
    },
  });

  // check if balance query should be enabled
  const isBalanceQueryEnabled = !!activeWallet?.address;

  // get native balance
  const {
    data: nativeBalance,
    isLoading: isLoadingNativeBalance,
    refetch: refetchNativeBalance,
  } = useBalance({
    query: {
      enabled: isBalanceQueryEnabled,
    },
    address: (activeWallet?.address as Address) || undefined,
    chainId: 1,
  });

  // hook to send native transaction
  const sendNativeTx = useSendTransaction();

  // hook to wait for transaction receipt
  const {
    isLoading: isConfirmingSendNativeTransaction,
    isSuccess: isConfirmedSendNativeTransaction,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: sendNativeTx.data,
    chainId: 1,
  });

  const sendError = sendNativeTx.error?.message ?? null;

  const selectedChainBlockExplorer = config.chains.find(
    (chain) => chain.id === 1
  )?.blockExplorers?.default.url;

  function handleReset() {
    sendNativeTx.reset();
    setFormError(null);
    form.reset();
  }

  function handleClearError() {
    sendNativeTx.reset();
    setFormError(null);
  }

  useEffect(() => {
    if (isConfirmedSendNativeTransaction && sendNativeTx.data && pendingActivityRef.current) {
      recordActivity({ ...pendingActivityRef.current, txHash: sendNativeTx.data });
      pendingActivityRef.current = null;
    }
  }, [isConfirmedSendNativeTransaction, sendNativeTx.data]);


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* send native form*/}
        <div>
          <form.Field
            name="amount"
            validators={{
              onChange: ({ value }) => {
                // Check if empty
                if (!value) {
                  return "Vui lòng nhập số lượng cần gửi";
                }

                // Convert to number and check if it's valid
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                  return "Vui lòng nhập số hợp lệ";
                }

                // Check if negative
                if (numValue < 0) {
                  return "Số lượng phải lớn hơn hoặc bằng 0";
                }

                // Try to parse ether and check balance
                try {
                  const valueInWei = parseEther(value);
                  if (
                    nativeBalance?.value &&
                    valueInWei > nativeBalance.value
                  ) {
                    return "Số dư không đủ";
                  }
                } catch {
                  // Handle parseEther errors for invalid decimal places
                  return "Định dạng số lượng không hợp lệ";
                }

                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center justify-between">
                  <p className="text-muted-foreground">Số lượng gửi</p>
                  <div className="flex flex-row gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            (nativeBalance?.value || BigInt(0)) / BigInt(4)
                          )
                        )
                      }
                      className="hover:cursor-pointer underline underline-offset-4"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            (nativeBalance?.value || BigInt(0)) / BigInt(2)
                          )
                        )
                      }
                      className="hover:cursor-pointer underline underline-offset-4"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            ((nativeBalance?.value || BigInt(0)) * BigInt(3)) /
                            BigInt(4)
                          )
                        )
                      }
                      className="hover:cursor-pointer underline underline-offset-4"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            nativeBalance?.value || BigInt(0)
                          ) as string
                        )
                      }
                      className="hover:cursor-pointer underline underline-offset-4"
                    >
                      Tối đa
                    </button>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between">
                  {isDesktop ? (
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-transparent text-2xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      type="number"
                      placeholder="0"
                      required
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-transparent text-2xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      placeholder="0"
                      required
                    />
                  )}
                </div>
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-row gap-2">
                    <div className="text-muted-foreground">
                      {isBalanceQueryEnabled && isLoadingNativeBalance ? (
                        <Skeleton className="w-10 h-4" />
                      ) : (
                        formatEther(nativeBalance?.value || BigInt(0))
                      )}
                    </div>
                    <p className="text-muted-foreground">ETH</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none hover:cursor-pointer"
                    type="button"
                    onClick={() => refetchNativeBalance()}
                  >
                    {isBalanceQueryEnabled && isLoadingNativeBalance ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw />
                    )}
                  </Button>
                </div>
                <AmountFieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>
        <div>
          <form.Field
            name="receivingAddress"
            validators={{
              onChange: ({ value }) => {
                if (!value) {
                  return "Vui lòng nhập địa chỉ hoặc ENS";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2 items-center">
                    <p className="text-muted-foreground">Người nhận</p>
                    <InformationDialog
                      title="Người nhận"
                      content="Nhập địa chỉ người nhận. Bạn cũng có thể nhập tên ENS để phân giải thành địa chỉ. Hãy nhớ nhấn biểu tượng tìm kiếm để phân giải tên ENS sau khi nhập."
                    />
                  </div>
                  <InputGroup className="border-primary">
                    <InputGroupInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="text"
                      placeholder="Địa chỉ (0x...) hoặc ENS (.eth)"
                      className="text-base rounded-none"
                      required
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        onClick={() => refetchEnsAddress()}
                        title="Tra cứu ENS"
                        className="hover:cursor-pointer"
                      >
                        {isLoadingEnsAddress ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                      </InputGroupButton>
                      <QrScannerButton onScan={(address) => field.handleChange(address)} />
                      <AddressBookPickerButton onSelect={(address) => field.handleChange(address)} />
                    </InputGroupAddon>
                  </InputGroup>
                  <ReceivingAddressFieldInfo
                    field={field}
                    ensAddress={ensAddress}
                    isLoadingEnsAddress={isLoadingEnsAddress}
                    isErrorEnsAddress={isErrorEnsAddress}
                  />
                </div>
              );
            }}
          </form.Field>
        </div>
        <div>
          {/* A type-safe field component*/}
          <form.Field name="gasPreset">
            {(field) => (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center justify-between">
                  <p className="text-muted-foreground">Mức phí gas</p>
                  <div className="flex flex-row gap-4">
                    <button
                      type="button"
                      className="hover:cursor-pointer underline underline-offset-4"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            gasPriceData
                              ? (gasPriceData * BigInt(900)) / BigInt(1000)
                              : BigInt(0),
                            "gwei"
                          )
                        )
                      }
                    >
                      Chậm
                    </button>
                    <button
                      type="button"
                      className="hover:cursor-pointer underline underline-offset-4"
                      onClick={() =>
                        field.handleChange(
                          formatEther(gasPriceData || BigInt(0), "gwei")
                        )
                      }
                    >
                      Thường
                    </button>
                    <button
                      type="button"
                      className="hover:cursor-pointer underline underline-offset-4"
                      onClick={() =>
                        field.handleChange(
                          formatEther(
                            gasPriceData
                              ? (gasPriceData * BigInt(1100)) / BigInt(1000)
                              : BigInt(0),
                            "gwei"
                          )
                        )
                      }
                    >
                      Nhanh
                    </button>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between">
                  {isLoadingGasPrice ? (
                    <Skeleton className="w-10 h-4" />
                  ) : (
                    <div className="text-muted-foreground">
                      {field.state.value} gwei
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none hover:cursor-pointer"
                    type="button"
                    onClick={() => refetchGasPrice()}
                  >
                    {isLoadingGasPrice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form.Field>
        </div>
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
                  className="rounded-none border-primary text-base"
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
          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className="hover:cursor-pointer rounded-none col-span-1"
                  variant="outline"
                  type="reset"
                  disabled={
                    !canSubmit ||
                    sendNativeTx.isPending ||
                    isConfirmingSendNativeTransaction
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
                    sendNativeTx.isPending ||
                    isConfirmingSendNativeTransaction
                  }
                >
                  {sendNativeTx.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isConfirmingSendNativeTransaction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isConfirmedSendNativeTransaction ? (
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
              isPending={sendNativeTx.isPending}
              isConfirming={isConfirmingSendNativeTransaction}
              isConfirmed={isConfirmedSendNativeTransaction}
              txHash={sendNativeTx.data}
              blockExplorerUrl={selectedChainBlockExplorer}
              error={[formError, sendError, receiptError].filter(Boolean).join("\n") || null}
              onClearError={handleClearError}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function AmountFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập số lượng cần gửi</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${field.state.meta.errors.join(",") ===
            "Vui lòng nhập số lượng cần gửi"
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

function ReceivingAddressFieldInfo({
  field,
  ensAddress,
  isLoadingEnsAddress,
  isErrorEnsAddress,
}: {
  field: AnyFieldApi;
  ensAddress?: Address | null;
  isLoadingEnsAddress?: boolean;
  isErrorEnsAddress?: boolean;
}) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập địa chỉ hoặc ENS</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${field.state.meta.errors.join(",") ===
            "Vui lòng nhập địa chỉ hoặc ENS"
            ? ""
            : "text-red-400"
            }`}
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : isLoadingEnsAddress ? (
        <Skeleton className="w-10 h-4" />
      ) : isErrorEnsAddress ? (
        <div className="text-red-400 text-xs">Không thể phân giải ENS</div>
      ) : ensAddress ? (
        <em className="text-green-500 text-xs">{ensAddress}</em>
      ) : ensAddress === null ? (
        <div className="text-red-400 text-xs">ENS không hợp lệ</div>
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
          className={`${field.state.meta.errors.join(",") ===
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
